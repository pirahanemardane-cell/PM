"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { SiteFooter } from "@/components/layout/site-footer";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FolderTree,
  FileText,
  MessageSquare,
  Ticket,
  Bell,
  Percent,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "داشبورد", icon: Home },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/categories", label: "دسته‌ها", icon: FolderTree },
  { href: "/admin/brands", label: "برندها", icon: Package },
  { href: "/admin/attributes", label: "مشخصات", icon: Tag },
  { href: "/admin/tags", label: "برچسب‌ها", icon: Tag },
  { href: "/admin/discounts", label: "تخفیف‌ها", icon: Tag },
  { href: "/admin/flash-sale", label: "شگفت‌انگیز", icon: Percent },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/media", label: "رسانه", icon: ImageIcon },
  { href: "/admin/blog", label: "بلاگ", icon: FileText },
  { href: "/admin/reviews", label: "نظرات", icon: MessageSquare },
  { href: "/admin/tickets", label: "تیکت‌ها", icon: Ticket },
  { href: "/admin/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/admin/returns", label: "مرجوعی", icon: Package },
  { href: "/admin/analytics", label: "گزارش‌ها", icon: BarChart3 },
  { href: "/admin/logs", label: "لاگ‌ها", icon: FileText },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];


export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-background text-foreground flex min-h-screen" dir="rtl">
      <aside
        className={`border-border sticky top-0 flex h-screen shrink-0 flex-col border-l transition-all ${
          open ? "w-60" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b p-3">
          {open ? <span className="text-sm font-bold">CMS مدیریت</span> : null}
          <button
            type="button"
            className="border-border inline-flex h-9 w-9 items-center justify-center rounded-lg border"
            onClick={() => setOpen((v) => !v)}
            aria-label="جمع‌کردن منو"
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {open ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-border border-t p-2">
          <Link
            href="/"
            className="text-muted-foreground hover:bg-muted block rounded-lg px-3 py-2 text-xs"
          >
            {open ? "← بازگشت به فروشگاه" : "←"}
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <SiteHeader />
        <div className="px-4 pt-2 md:px-6">
          <AppBreadcrumb />
        </div>
        <div className="min-h-[60vh] px-4 py-4 md:px-6">{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}
