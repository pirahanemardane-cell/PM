"use client";

import { useEffect, useState } from "react";
import { useShopStore } from "@/lib/shop-store";
import { useUnifiedCart } from "@/lib/use-unified-cart";

export function useShopCounts() {
  const { count: cart } = useUnifiedCart();
  const wishlist = useShopStore((s) => s.wishlist.length);
  const compare = useShopStore((s) => s.compare.length);
  const recent = useShopStore((s) => s.recentlyViewed.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return { cart: 0, wishlist: 0, compare: 0, recent: 0 };
  return { cart, wishlist, compare, recent };
}

export function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="bg-primary text-primary-foreground absolute -top-1.5 -left-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
