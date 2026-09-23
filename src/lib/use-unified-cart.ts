"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useShopStore, type ShopProduct } from "@/lib/shop-store";
import { useServerCartStore, type ServerCartLine } from "@/lib/server-cart-store";

export type UnifiedCartLine = ServerCartLine & { source: "server" | "local" };

function mapLocal(cart: ShopProduct[]): UnifiedCartLine[] {
  return cart.map((p) => ({
    key: `${p.id}|${p.color ?? ""}|${p.size ?? ""}`,
    productId: p.id,
    title: p.title || "محصول",
    price: p.price ?? 0,
    quantity: p.quantity ?? 1,
    image: p.image,
    size: p.size,
    color: p.color?.startsWith("#") ? undefined : p.color,
    colorHex: p.color?.startsWith("#") ? p.color : undefined,
    source: "local" as const,
  }));
}

export function useUnifiedCart() {
  const localCart = useShopStore((s) => s.cart);
  const clearLocal = useShopStore((s) => s.clearCart);
  const linesServer = useServerCartStore((s) => s.lines);
  const loading = useServerCartStore((s) => s.loading);
  const refresh = useServerCartStore((s) => s.refresh);
  const clearServer = useServerCartStore((s) => s.clear);

  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    if (userId) void refresh();
    else clearServer();
  }, [userId, refresh, clearServer]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    function onChange() {
      if (!userId) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refresh();
      }, 300);
    }
    window.addEventListener("pm:cart-changed", onChange);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("pm:cart-changed", onChange);
    };
  }, [userId, refresh]);

  // فقط وقتی سرور واقعاً اقلام دارد local را پاک کن
  useEffect(() => {
    if (userId && linesServer.length > 0 && localCart.length > 0) {
      clearLocal();
    }
  }, [userId, linesServer.length, localCart.length, clearLocal]);

  const isLoggedIn = Boolean(userId);

  // اگر لاگین و سرور خالی ولی local پر → local نشان بده (تا getCart/add درست شود)
  let lines: UnifiedCartLine[];
  if (isLoggedIn) {
    if (linesServer.length > 0) {
      lines = linesServer.map((l) => ({ ...l, source: "server" as const }));
    } else if (localCart.length > 0) {
      // حتی حین loading — optimistic از local
      lines = mapLocal(localCart);
    } else {
      lines = [];
    }
  } else {
    lines = mapLocal(localCart);
  }

  const count = lines.reduce((n, l) => n + (l.quantity || 1), 0);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return { lines, count, total, loading, isLoggedIn, refresh };
}
