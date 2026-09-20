"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { useServerCartStore } from "@/lib/server-cart-store";

/**
 * یک نقطه اتصال Realtime برای کل فروشگاه.
 * تغییر DB → همان eventهایی که UI از قبل می‌فهمد.
 */
export function RealtimeBridge() {
  const refreshCart = useServerCartStore((s) => s.refresh);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setUserId(data.user?.id ?? null);
      } catch {
        if (!cancelled) setUserId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bumpCart = useCallback(() => {
    void refreshCart();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pm:cart-changed"));
    }
  }, [refreshCart]);

  const bumpOrders = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pm:orders-changed"));
    }
  }, []);

  const bumpWishlist = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pm:wishlist-changed"));
    }
  }, []);

  // سبد
  useRealtimeTable({
    table: "cart_items",
    enabled: true,
    onPayload: bumpCart,
  });
  useRealtimeTable({
    table: "carts",
    enabled: true,
    onPayload: bumpCart,
  });

  // سفارش‌ها (فیلتر کاربر وقتی لاگین است)
  useRealtimeTable({
    table: "orders",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onPayload: bumpOrders,
  });
  useRealtimeTable({
    table: "order_items",
    enabled: !!userId,
    onPayload: bumpOrders,
  });

  // علاقه‌مندی
  useRealtimeTable({
    table: "wishlists",
    enabled: !!userId,
    onPayload: bumpWishlist,
  });

  return null;
}
