"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardWithSidebar from "@/components/ui/dashboard-with-collapsible-sidebar";
import { adminDashboardStatsAction } from "@/app/admin/actions/stats";
import { LumaSpin } from "@/components/ui/luma-spin";

type Stats = {
  orders: number;
  products: number;
  users: number;
  discounts: number;
  pendingOrders: number;
};

function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await adminDashboardStatsAction();
      setLoading(false);
      if (!res.ok) {
        setError(
          res.error === "login_required"
            ? "ورود لازم است"
            : res.error === "forbidden"
              ? "دسترسی ادمین ندارید"
              : "خطا در بارگذاری آمار",
        );
        return;
      }
      setStats(res.stats);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LumaSpin />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (!stats) return null;

  const cards = [
    { label: "سفارش‌ها", value: stats.orders, href: "/admin/orders" },
    { label: "در انتظار", value: stats.pendingOrders, href: "/admin/orders" },
    { label: "محصولات", value: stats.products, href: "/admin/products" },
    { label: "کاربران", value: stats.users, href: "/admin/users" },
    { label: "کد تخفیف", value: stats.discounts, href: "/admin/discounts" },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
        <p className="text-muted-foreground text-sm">نمای کلی فروشگاه</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="border-border bg-card hover:border-primary/40 rounded-2xl border p-5 shadow-sm transition"
          >
            <p className="text-muted-foreground text-sm">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">
              {c.value.toLocaleString("fa-IR")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="bg-background flex min-h-screen" dir="rtl">
      {/* سایدبار از کامپوننت موجود */}
      <AdminShell>
        <StatsPanel />
      </AdminShell>
    </div>
  );
}

/** استفاده از همان سایدبار؛ محتوای main را جایگزین می‌کنیم */
function AdminShell({ children }: { children: React.ReactNode }) {
  // اگر DashboardWithSidebar فقط پوسته ثابت دارد، مستقیم children + لینک‌ها:
  return (
    <div className="flex min-h-screen w-full">
      <aside className="border-border sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-l p-3 md:flex">
        <p className="mb-4 px-2 text-sm font-bold">پنل ادمین</p>
        <nav className="flex flex-1 flex-col gap-1 text-sm">
          {(
            [
              ["/admin/dashboard", "داشبورد"],
              ["/admin/orders", "سفارش‌ها"],
              ["/admin/products", "محصولات"],
              ["/admin/discounts", "تخفیف‌ها"],
              ["/admin/users", "کاربران"],
              ["/admin/analytics", "گزارش‌ها"],
              ["/admin/settings", "تنظیمات"],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="hover:bg-primary hover:text-primary-foreground rounded-lg px-3 py-2"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
