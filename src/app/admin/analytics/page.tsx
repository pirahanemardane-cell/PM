"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardStatsAction } from "@/app/admin/actions/stats";
import { LumaSpin } from "@/components/ui/luma-spin";

type Stats = {
  ordersTotal: number;
  ordersPending: number;
  productsTotal: number;
  productsPublished: number;
  usersTotal: number;
  discountsActive: number;
  stockAlertsPending: number;
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
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

  const cards = stats
    ? [
        {
          label: "کل سفارش‌ها",
          value: stats.ordersTotal,
          href: "/admin/orders",
          hint: `${stats.ordersPending} در انتظار`,
        },
        {
          label: "محصولات",
          value: stats.productsTotal,
          href: "/admin/products",
          hint: `${stats.productsPublished} منتشر`,
        },
        {
          label: "کاربران",
          value: stats.usersTotal,
          href: "/admin/users",
          hint: "پروفایل‌ها",
        },
        {
          label: "تخفیف فعال",
          value: stats.discountsActive,
          href: "/admin/discounts",
          hint: "کدهای فعال",
        },
        {
          label: "لیست انتظار موجودی",
          value: stats.stockAlertsPending ?? 0,
          href: "/admin/stock-alerts",
          hint: "در انتظار اطلاع",
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-primary">گزارش‌ها</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          خلاصه آمار فروشگاه (نسخه سبک؛ نمودار پیشرفته بعداً)
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-20">
          <LumaSpin />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="border-border bg-card hover:border-primary/40 rounded-2xl border p-5 shadow-sm transition-colors"
            >
              <p className="text-muted-foreground text-xs">{c.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {c.value.toLocaleString("fa-IR")}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{c.hint}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
