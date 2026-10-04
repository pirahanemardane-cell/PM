"use client";

import { useCallback, useEffect } from "react";
import {
  listWishlistAction,
  getLiveRecentlyViewedAction,
} from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";
import { createClient } from "@/lib/supabase/client";

export function WishlistSync() {
  const sync = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;

      if (uid) {
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
        return;
      }

      const local = useShopStore.getState().wishlist || [];
      if (!local.length) return;
      const ids = local.map((x) => x.id).filter(Boolean);
      const live = await getLiveRecentlyViewedAction(ids);
      if (!live.ok) return;
      const byId = new Map(live.items.map((x) => [x.id, x]));
      const next = ids
        .map((id) => byId.get(id))
        .filter((x): x is NonNullable<typeof x> => x != null)
        .map((x) => ({
          id: x.id,
          title: x.title,
          price: x.price,
          image: x.image,
          brand: x.brand,
          href: x.href,
        }));
      useShopStore.setState({ wishlist: next });
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void sync();
  }, [sync]);

  useRtEvent(RT.wishlist, () => {
    void sync();
  });
  useRtEvent(RT.catalog, () => {
    void sync();
  });

  return null;
}
