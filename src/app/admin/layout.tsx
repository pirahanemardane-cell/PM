"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "داشبورد", icon: Home },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/discounts", label: "تخفیف‌ها", icon: Tag },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/analytics", label: "گزارش‌ها", icon: BarChart3 },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-background text-foreground flex min-h-screen" dir="rtl">
      <aside
        className={`border-border sticky top-0 flex h-screen shrink-0 flex-col border-l transition-all ${
          open ? "w-56" : "w-14"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b p-3">
          {open ? (
            <span className="text-sm font-bold">پنل ادمین</span>
          ) : (
            <span className="sr-only">پنل ادمین</span>
          )}
          <button
            type="button"
            className="border-border inline-flex h-8 w-8 items-center justify-center rounded-md border"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "جمع کردن منو" : "باز کردن منو"}
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {open ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-2">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground block rounded-lg px-3 py-2 text-xs"
          >
            {open ? "بازگشت به فروشگاه" : "←"}
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
