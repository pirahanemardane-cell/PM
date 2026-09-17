"use client";
import { SmartSearch } from "@/components/layout/smart-search";
import { CountBadge, useShopCounts } from "@/components/layout/header-badges";
import Link from "next/link";
import { Heart, GitCompareArrows, ShoppingCart, History } from "lucide-react";

export function HeaderSearchStrip() {
  const counts = useShopCounts();
  return (
    <div className="border-border bg-surface-muted border-b" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          <SmartSearch />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="relative rounded-lg border border-border bg-background p-2" title="سبد">
            <ShoppingCart className="h-4 w-4" />
            <CountBadge count={counts.cart} />
          </Link>
          <Link href="/dashboard" className="relative rounded-lg border border-border bg-background p-2" title="علاقه‌مندی">
            <Heart className="h-4 w-4" />
            <CountBadge count={counts.wishlist} />
          </Link>
          <Link href="/dashboard" className="relative rounded-lg border border-border bg-background p-2" title="مقایسه">
            <GitCompareArrows className="h-4 w-4" />
            <CountBadge count={counts.compare} />
          </Link>
          <Link href="/dashboard" className="relative rounded-lg border border-border bg-background p-2" title="اخیر">
            <History className="h-4 w-4" />
            <CountBadge count={counts.recent} />
          </Link>
        </div>
      </div>
    </div>
  );
}
