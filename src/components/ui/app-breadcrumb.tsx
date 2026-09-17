"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function AppBreadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  if (!items?.length) return null;
  return (
    <nav aria-label="breadcrumb" className={cn("bg-surface-muted border-border border-b", className)} dir="rtl">
      <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3 text-sm">
        <li>
          <Link href="/" className="text-muted-foreground hover:text-foreground">خانه</Link>
        </li>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              <ChevronLeft className="text-muted-foreground h-3.5 w-3.5 rotate-180 opacity-60" />
              {last || !item.href ? (
                <span className="font-medium">{item.label}</span>
              ) : (
                <Link href={item.href} className="text-muted-foreground hover:text-foreground">{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
