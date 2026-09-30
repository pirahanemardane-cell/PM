"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useServerCartStore } from "@/lib/server-cart-store";
import { RT } from "@/lib/realtime/events";

/** debounce جدا برای هر نوع event — کاتالوگ کندتر، سبد سریع‌تر */
function useSmartDispatch() {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, []);

  return useCallback((eventName: string, ms = 400) => {
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
  }, []);
}

/**
 * تنها نقطه Realtime سایت — یک WebSocket / یک channel
 * به‌جای ۱۰+ کانال جدا (علت اصلی کندی پنل‌ها)
 */
export function RealtimeBridge() {
  const refreshCart = useServerCartStore((s) => s.refresh);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const dispatch = useSmartDispatch();
  const cartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // سبد: debounce کوتاه + یک refresh
    if (cartTimer.current) clearTimeout(cartTimer.current);
    cartTimer.current = setTimeout(() => {
      void refreshCart();
      dispatch(RT.cart, 0);
    }, 200);
  }, [refreshCart, dispatch]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("pm:site-rt-v1");

    // سبد
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "cart_items" },
      () => onCart(),
    );

    // علاقه‌مندی — فقط وقتی لاگین
    if (userId) {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "wishlists" },
        () => dispatch(RT.wishlist, 300),
      );
    }

    // سفارش‌ها
    if (isAdmin) {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "orders" },
        () => dispatch(RT.orders, 350),
      );
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "order_items" },
        () => dispatch(RT.orders, 350),
      );
    } else if (userId) {
      channel.on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        () => dispatch(RT.orders, 350),
      );
    }

    // موجودی / کاتالوگ — debounce بلند تا پنل ادمین قفل نشود
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "product_variants" },
      () => dispatch(RT.stock, 900),
    );
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "products" },
      () => dispatch(RT.catalog, 900),
    );

    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "reviews" },
      () => dispatch(RT.reviews, 600),
    );

    if (userId) {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "return_requests" },
        () => dispatch(RT.support, 500),
      );
    }

    channel.subscribe();

    return () => {
      if (cartTimer.current) clearTimeout(cartTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, onCart, dispatch]);

  return null;
}
