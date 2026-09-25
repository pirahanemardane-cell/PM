"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminDashboardStatsAction,
  type AdminDashboardStats,
} from "@/app/admin/actions/stats";
import { adminListLogsAction, type AdminLogRow } from "@/app/admin/actions/logs";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

function n(v: number) {
  return toPersianDigits(Math.round(v).toLocaleString("en-US"));
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [logs, setLogs] = useState<AdminLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [res, logRes] = await Promise.all([
        adminDashboardStatsAction(),
        adminListLogsAction(8),
      ]);
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
      if (logRes.ok) setLogs(logRes.items ?? []);
    })();
  }, []);

  const cards = stats
    ? [
        {
          label: "سفارش‌ها",
          value: n(stats.ordersTotal),
          sub: `${n(stats.ordersPending)} در انتظار · ${n(stats.ordersProcessing)} پردازش · ${n(stats.ordersShipped)} ارسال`,
          href: "/admin/orders",
        },
        {
          label: "فروش (غیرلغو)",
          value: `${n(stats.revenueTotal)} ت`,
          sub: "جمع total_amount",
          href: "/admin/orders",
        },
        {
          label: "محصولات",
          value: n(stats.productsTotal),
          sub: `${n(stats.productsPublished)} منتشر · ${n(stats.lowStockVariants)} واریانت کم‌موجودی (≤۳)`,
          href: "/admin/products",
        },
        {
          label: "کاربران",
          value: n(stats.usersTotal),
          sub: `${n(stats.discountsActive)} تخفیف فعال`,
          href: "/admin/users",
        },
        {
          label: "مرجوعی باز",
          value: n(stats.returnsOpen),
          sub: "نیاز به رسیدگی",
          href: "/admin/returns",
        },
        {
          label: "تیکت باز",
          value: n(stats.ticketsOpen),
          sub: "پشتیبانی",
          href: "/admin/tickets",
        },
      ]
    : [];

  return (
    <div className="p-6" dir="rtl">
      <div className="w-full max-w-none space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">داشبورد مدیریت</h1>
          <p className="text-muted-foreground text-sm">نمای عملیاتی روزانه فروشگاه</p>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <LumaSpin />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Link
                key={c.label + c.href}
                href={c.href}
                className="border-border bg-card hover:border-primary/40 rounded-2xl border p-5 shadow-sm transition-colors"
              >
                <p className="text-muted-foreground text-xs">{c.label}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums">{c.value}</p>
                <p className="text-muted-foreground mt-1 text-xs">{c.sub}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border-border bg-card rounded-2xl border p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary">آخرین فعالیت ادمین</h2>
              <Link href="/admin/logs" className="text-muted-foreground text-xs hover:underline">
                همه لاگ‌ها
              </Link>
            </div>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">لاگی ثبت نشده یا جدول موجود نیست.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((row) => (
                  <li key={row.id} className="border-border/60 border-b pb-2 text-sm last:border-0">
                    <span className="font-medium">{row.action}</span>
                    {row.entity ? (
                      <span className="text-muted-foreground"> · {row.entity}</span>
                    ) : null}
                    <div className="text-muted-foreground text-xs">
                      {formatJalaliDateTime(row.created_at)}
                      {row.meta ? ` — ${row.meta}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-border bg-card rounded-2xl border p-5">
            <h2 className="mb-3 text-sm font-semibold text-primary">دسترسی سریع</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["/admin/orders", "سفارش‌ها"],
                  ["/admin/products", "محصولات"],
                  ["/admin/returns", "مرجوعی"],
                  ["/admin/tickets", "تیکت"],
                  ["/admin/discounts", "تخفیف"],
                  ["/admin/backup", "بک‌آپ"],
                  ["/admin/logs", "لاگ"],
                  ["/admin/analytics", "گزارش"],
                ] as const
              ).map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="border-border hover:bg-muted rounded-xl border px-4 py-2 text-sm"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
