"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { useServerCartStore } from "@/lib/server-cart-store";
import { RT } from "@/lib/realtime/events";

function useDebouncedDispatch(ms = 400) {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, []);

  return useCallback((eventName: string) => {
    const prev = timers.current.get(eventName);
    if (prev) clearTimeout(prev);
    timers.current.set(
      eventName,
      setTimeout(() => {
        timers.current.delete(eventName);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(eventName));
        }
      }, ms),
    );
  }, [ms]);
}

/**
 * تنها نقطه Realtime سایت.
 * تغییر DB → event → صفحات باز با load() خودشان به‌روز می‌شوند (بدون reload).
 */
export function RealtimeBridge() {
  const refreshCart = useServerCartStore((s) => s.refresh);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const dispatch = useDebouncedDispatch(400);

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

  const onCart = useCallback(() => {
    void refreshCart();
    dispatch(RT.cart);
  }, [refreshCart, dispatch]);

  const onOrders = useCallback(() => dispatch(RT.orders), [dispatch]);
  const onWishlist = useCallback(() => dispatch(RT.wishlist), [dispatch]);
  const onStock = useCallback(() => dispatch(RT.stock), [dispatch]);
  const onCatalog = useCallback(() => dispatch(RT.catalog), [dispatch]);
  const onReviews = useCallback(() => dispatch(RT.reviews), [dispatch]);
  const onSupport = useCallback(() => dispatch(RT.support), [dispatch]);

  // سبد
  useRealtimeTable({ table: "cart_items", enabled: true, onPayload: onCart });
  useRealtimeTable({ table: "carts", enabled: true, onPayload: onCart });

  // علاقه‌مندی
  useRealtimeTable({
    table: "wishlists",
    enabled: Boolean(userId),
    onPayload: onWishlist,
  });

  // سفارش — مشتری فقط مال خودش
  useRealtimeTable({
    table: "orders",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: Boolean(userId) && !isAdmin,
    onPayload: onOrders,
  });
  useRealtimeTable({
    table: "order_items",
    enabled: Boolean(userId) && !isAdmin,
    onPayload: onOrders,
  });

  // سفارش — ادمین همه
  useRealtimeTable({
    table: "orders",
    enabled: isAdmin,
    onPayload: onOrders,
  });
  useRealtimeTable({
    table: "order_items",
    enabled: isAdmin,
    onPayload: onOrders,
  });

  // موجودی واریانت + کاتالوگ
  useRealtimeTable({
    table: "product_variants",
    enabled: true,
    onPayload: onStock,
  });
  useRealtimeTable({
    table: "products",
    enabled: true,
    onPayload: onCatalog,
  });

  // نظرات
  useRealtimeTable({
    table: "reviews",
    enabled: true,
    onPayload: onReviews,
  });

  // مرجوعی + تیکت
  useRealtimeTable({
    table: "return_requests",
    enabled: Boolean(userId),
    onPayload: onSupport,
  });

  return null;
}
