"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useServerCartStore } from "@/lib/server-cart-store";
import { RT } from "@/lib/realtime/events";

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

/** یک WebSocket مرکزی — Realtime سراسری فروشگاه + ادمین */
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
    if (cartTimer.current) clearTimeout(cartTimer.current);
    cartTimer.current = setTimeout(() => {
      void refreshCart();
      dispatch(RT.cart, 0);
    }, 250);
  }, [refreshCart, dispatch]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("pm:site-rt-v4");

    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "cart_items" },
      () => onCart(),
    );

    if (userId) {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "wishlists" },
        () => dispatch(RT.wishlist, 400),
      );
    }

    if (isAdmin) {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "orders" },
        () => dispatch(RT.orders, 400),
      );
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "return_requests" },
        () => dispatch(RT.returns, 500),
      );
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "contact_messages" },
        () => dispatch(RT.support, 500),
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
        () => dispatch(RT.orders, 400),
      );
      channel.on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "return_requests",
          filter: `user_id=eq.${userId}`,
        },
        () => dispatch(RT.returns, 500),
      );
    }

    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "product_variants" },
      () => dispatch(RT.stock, 800),
    );
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "products" },
      () => dispatch(RT.catalog, 1000),
    );
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "reviews" },
      () => dispatch(RT.reviews, 800),
    );

    if (userId) {
      channel.on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => dispatch(RT.notifications, 300),
      );
    }

    channel.subscribe();

    // وقتی تب دوباره فعال می‌شود، یک سیگنال نرم برای همگام‌سازی
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        dispatch(RT.catalog, 0);
        dispatch(RT.stock, 0);
        if (userId) {
          dispatch(RT.cart, 0);
          dispatch(RT.orders, 0);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (cartTimer.current) clearTimeout(cartTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, onCart, dispatch]);

  return null;
}
