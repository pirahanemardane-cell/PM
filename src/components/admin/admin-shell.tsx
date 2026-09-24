"use client";

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


function AdminBreadcrumb() {
  const pathname = usePathname();
  const parts = (pathname || "").split("/").filter(Boolean);
  // admin / section / ...
  if (parts[0] !== "admin") return null;
  const labels: Record<string, string> = {
    admin: "مدیریت",
    dashboard: "داشبورد",
    products: "محصولات",
    categories: "دسته‌ها",
    brands: "برندها",
    orders: "سفارش‌ها",
    users: "کاربران",
    media: "رسانه",
    blog: "بلاگ",
    settings: "تنظیمات",
    tags: "برچسب‌ها",
    discounts: "تخفیف‌ها",
    "flash-sale": "شگفت‌انگیز",
    reviews: "نظرات",
    tickets: "تیکت‌ها",
    notifications: "اعلان‌ها",
    returns: "مرجوعی",
    analytics: "آمار",
    attributes: "مشخصات",
    logs: "لاگ",
    new: "جدید",
    edit: "ویرایش",
  };
  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    acc += "/" + p;
    // uuid-like skip label raw
    const isId = /^[0-9a-f-]{8,}$/i.test(p);
    const label = isId ? "جزئیات" : labels[p] || p;
    crumbs.push({ href: acc, label });
  }
  return (
    <nav aria-label="مسیر" className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1.5 text-xs">
      {crumbs.map((c, i) => (
        <span key={c.href} className="inline-flex items-center gap-1.5">
          {i > 0 ? <span className="opacity-50">/</span> : null}
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-primary transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

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
      <main className="min-w-0 flex-1 overflow-auto"><>
          <AdminBreadcrumb />
          <div className="min-h-[60vh]">{children}</div>
          <footer className="text-muted-foreground mt-10 border-t pt-4 text-center text-xs">
            پنل مدیریت · پیراهن مردانه
          </footer>
        </></main>
    </div>
  );
}
