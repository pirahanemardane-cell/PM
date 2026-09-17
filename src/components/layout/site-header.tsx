"use client";

import Link from "next/link";
import { SmartSearch } from "@/components/layout/smart-search";
import { CountBadge, useShopCounts } from "@/components/layout/header-badges";
import {
  Heart,
  GitCompareArrows,
  ShoppingCart,
  History,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/products", label: "محصولات" },
  { href: "/products", label: "همه محصولات" },
];

export function SiteHeader({ className }: { className?: string }) {
  const counts = useShopCounts();

  return (
    <header
      className={cn(
        "border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur",
        className
      )}
      dir="rtl"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        {/* لوگو */}
        <Link href="/" className="shrink-0 text-xl font-black tracking-tight">
          PM
        </Link>

        {/* منو */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-muted-foreground hover:text-foreground rounded-lg px-2.5 py-1.5 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* سرچ فیلتردار */}
        <div className="min-w-[200px] flex-1">
          <SmartSearch />
        </div>

        {/* آیکون‌ها + ورود + خرید */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/dashboard"
            className="relative rounded-full border border-border bg-background p-2 hover:bg-muted"
            title="بازدید اخیر"
          >
            <History className="h-4 w-4" />
            <CountBadge count={counts.recent} />
          </Link>
          <Link
            href="/dashboard"
            className="relative rounded-full border border-border bg-background p-2 hover:bg-muted"
            title="مقایسه"
          >
            <GitCompareArrows className="h-4 w-4" />
            <CountBadge count={counts.compare} />
          </Link>
          <Link
            href="/dashboard"
            className="relative rounded-full border border-border bg-background p-2 hover:bg-muted"
            title="علاقه‌مندی"
          >
            <Heart className="h-4 w-4" />
            <CountBadge count={counts.wishlist} />
          </Link>
          <Link
            href="/dashboard"
            className="relative rounded-full border border-border bg-background p-2 hover:bg-muted"
            title="سبد خرید"
          >
            <ShoppingCart className="h-4 w-4" />
            <CountBadge count={counts.cart} />
          </Link>

          <Link
            href="/login"
            className="border-border hover:bg-muted inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm"
          >
            <UserRound className="h-4 w-4" />
            ورود
          </Link>
          <Link
            href="/products"
            className="bg-primary text-primary-foreground inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium"
          >
            خرید
          </Link>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
