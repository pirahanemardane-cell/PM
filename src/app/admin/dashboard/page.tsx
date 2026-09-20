"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardStatsAction } from "@/app/admin/actions/stats";
import { LumaSpin } from "@/components/ui/luma-spin";

type Stats = {
  orders: number;
  products: number;
  users: number;
  discounts: number;
  pendingOrders: number;
};

export default function AdminDashboardPage() {
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

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>
        <p className="text-muted-foreground text-sm">نمای کلی فروشگاه</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["سفارش‌ها", stats.orders, "/admin/orders"],
              ["در انتظار", stats.pendingOrders, "/admin/orders"],
              ["محصولات", stats.products, "/admin/products"],
              ["کاربران", stats.users, "/admin/users"],
              ["کد تخفیف", stats.discounts, "/admin/discounts"],
            ] as const
          ).map(([label, value, href]) => (
            <Link
              key={label}
              href={href}
              className="border-border bg-card hover:border-primary/40 rounded-2xl border p-5 shadow-sm transition"
            >
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="mt-2 text-3xl font-bold">
                {value.toLocaleString("fa-IR")}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
