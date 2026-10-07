"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  useServerCartStore,
  type ServerCartLine,
} from "@/lib/server-cart-store";
import { useShopStore } from "@/lib/shop-store";

export type UnifiedCartLine = ServerCartLine & { source: "server" | "local" };

export function useUnifiedCart() {
  const linesServer = useServerCartStore((s) => s.lines);
  const loading = useServerCartStore((s) => s.loading);
  const hydrated = useServerCartStore((s) => s.hydrated);
  const refresh = useServerCartStore((s) => s.refresh);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user?.id));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(Boolean(session?.user?.id));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void refresh({ force: true }).then(() => {
      try {
        useShopStore.getState().clearCart();
      } catch {}
    });
  }, [refresh]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    function onChange() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refresh({ force: false });
      }, 1300);
    }
    window.addEventListener("pm:cart-changed", onChange);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("pm:cart-changed", onChange);
    };
  }, [refresh]);

  const lines: UnifiedCartLine[] = linesServer.map((l) => ({
    ...l,
    source: "server" as const,
  }));

  const count = lines.reduce((n, l) => n + (l.quantity || 1), 0);
  const total = lines.reduce((s, l) => s + l.price * (l.quantity || 1), 0);

  return {
    lines,
    count,
    total,
    loading: loading && !hydrated,
    isLoggedIn,
    refresh: () => refresh({ force: true }),
    hydrated,
  };
}
