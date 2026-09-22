"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { useServerCartStore } from "@/lib/server-cart-store";

/**
 * یک نقطه اتصال Realtime برای کل فروشگاه.
 * تغییر DB → eventهای استاندارد UI.
 * ادمین: همهٔ سفارش‌ها (بدون فیلتر user_id).
 */
export function RealtimeBridge() {
  const refreshCart = useServerCartStore((s) => s.refresh);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id ?? null;
        if (cancelled) return;
        setUserId(uid);
        if (!uid) {
          setIsAdmin(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .maybeSingle();
        if (!cancelled) {
          setIsAdmin((profile as { role?: string } | null)?.role === "admin");
        }
      } catch {
        if (!cancelled) {
          setUserId(null);
          setIsAdmin(false);
        }
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

  // سفارش مشتری: فقط سفارش‌های خودش
  useRealtimeTable({
    table: "orders",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId && !isAdmin,
    onPayload: bumpOrders,
  });
  useRealtimeTable({
    table: "order_items",
    enabled: !!userId && !isAdmin,
    onPayload: bumpOrders,
  });

  // سفارش ادمین: همه ردیف‌ها (نیاز به SELECT RLS برای admin)
  useRealtimeTable({
    table: "orders",
    enabled: isAdmin,
    onPayload: bumpOrders,
  });
  useRealtimeTable({
    table: "order_items",
    enabled: isAdmin,
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
