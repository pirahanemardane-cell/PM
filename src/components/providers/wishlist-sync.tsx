"use client";

import { useEffect } from "react";
import { listWishlistAction } from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";
import { createClient } from "@/lib/supabase/client";

/** همگام‌سازی علاقه‌مندی سرور با استور لوکال — بدون رفرش */
export function WishlistSync() {
  const setFromServer = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user?.id) return;
      const res = await listWishlistAction();
      if (!res.ok) return;
      const mapped = res.items.map((i) => ({
        id: i.productId,
        title: i.title,
        price: i.price,
        image: i.image,
        href: i.slug ? `/products/${i.slug}` : undefined,
      }));
      useShopStore.setState({ wishlist: mapped });
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    void setFromServer();
  }, []);

  useRtEvent(RT.wishlist, () => {
    void setFromServer();
  });

  return null;
}
