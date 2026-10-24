"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LumaSpin } from "@/components/ui/luma-spin";

type FunnelSummary = {
  days: number;
  funnel: {
    view_item: number;
    add_to_cart: number;
    view_cart: number;
    begin_checkout: number;
    add_shipping_info: number;
    purchase_events: number;
  };
  sales: {
    orders_paid: number;
    revenue: number;
    aov: number;
  };
  rates: {
    view_to_cart_pct: number;
    cart_to_checkout_pct: number;
    checkout_to_purchase_pct: number;
    overall_conversion_pct: number;
    cart_abandon_pct: number;
    checkout_abandon_pct: number;
  };
  ops: {
    returns: number;
    search_zero_results: number;
  };
};

type TopProduct = {
  product_id: string;
  title: string;
  units_sold: number;
  revenue: number;
};

const FUNNEL_STEPS: { key: keyof FunnelSummary["funnel"]; label: string }[] = [
  { key: "view_item", label: "بازدید محصول" },
  { key: "add_to_cart", label: "افزودن به سبد" },
  { key: "view_cart", label: "مشاهده سبد" },
  { key: "begin_checkout", label: "شروع چک‌اوت" },
  { key: "add_shipping_info", label: "انتخاب ارسال" },
  { key: "purchase_events", label: "خرید (رویداد)" },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<FunnelSummary | null>(null);
  const [tops, setTops] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: summary, error: e1 } = await supabase.rpc(
          "admin_funnel_summary",
          { days_back: days },
        );
        if (e1) throw e1;
        const { data: topRows, error: e2 } = await supabase.rpc(
          "admin_top_products",
          { days_back: days, lim: 10 },
        );
        if (e2) throw e2;
        if (cancelled) return;
        setData(summary as FunnelSummary);
        setTops((topRows as TopProduct[]) ?? []);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(
          msg.includes("forbidden")
            ? "دسترسی ادمین لازم است"
            : "خطا در بارگذاری قیف",
        );
        setData(null);
        setTops([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const maxFunnel = data
    ? Math.max(
        1,
        ...FUNNEL_STEPS.map((s) => Number(data.funnel[s.key] ?? 0)),
      )
    : 1;

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">قیف فروش و آمار</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            داخلی — بدون ابزار خارجی
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                days === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}
            >
              {d} روز
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-20">
          <LumaSpin />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="سفارش موفق" value={data.sales.orders_paid} />
            <Kpi
              label="فروش (ریال)"
              value={data.sales.revenue}
              format
            />
            <Kpi label="میانگین سفارش (AOV)" value={data.sales.aov} format />
            <Kpi
              label="نرخ تبدیل کلی"
              value={`${data.rates.overall_conversion_pct}%`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              label="بازدید → سبد"
              value={`${data.rates.view_to_cart_pct}%`}
            />
            <Kpi
              label="رها شدن سبد"
              value={`${data.rates.cart_abandon_pct}%`}
            />
            <Kpi
              label="رها شدن چک‌اوت"
              value={`${data.rates.checkout_abandon_pct}%`}
            />
          </div>

          <section className="border-border bg-card rounded-2xl border p-5">
            <h2 className="mb-4 text-lg font-semibold">قیف خرید</h2>
            <ul className="space-y-3">
              {FUNNEL_STEPS.map((s) => {
                const n = Number(data.funnel[s.key] ?? 0);
                const pct = Math.round((n / maxFunnel) * 100);
                return (
                  <li key={s.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{s.label}</span>
                      <span className="tabular-nums">
                        {n.toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              ستون «خرید (رویداد)» از track سایت است؛ «سفارش موفق» از جدول
              orders منبع حقیقت فروش است.
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Kpi label="مرجوعی" value={data.ops.returns} />
            <Kpi
              label="جستجوی بدون نتیجه"
              value={data.ops.search_zero_results}
            />
          </div>

          <section className="border-border bg-card rounded-2xl border p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">پرفروش‌ترین‌ها</h2>
              <Link
                href="/admin/reports"
                className="text-muted-foreground text-xs underline"
              >
                گزارش فروش
              </Link>
            </div>
            {tops.length === 0 ? (
              <p className="text-muted-foreground text-sm">داده‌ای نیست</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-right">
                    <th className="py-2 font-medium">محصول</th>
                    <th className="py-2 font-medium">تعداد</th>
                    <th className="py-2 font-medium">مبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {tops.map((t) => (
                    <tr key={t.product_id} className="border-b last:border-0">
                      <td className="py-2">{t.title}</td>
                      <td className="py-2 tabular-nums">
                        {Number(t.units_sold).toLocaleString("fa-IR")}
                      </td>
                      <td className="py-2 tabular-nums">
                        {Number(t.revenue).toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  format,
}: {
  label: string;
  value: number | string;
  format?: boolean;
}) {
  const display =
    typeof value === "number" && format
      ? value.toLocaleString("fa-IR")
      : typeof value === "number"
        ? value.toLocaleString("fa-IR")
        : value;
  return (
    <div className="border-border bg-card rounded-2xl border p-4 shadow-sm">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{display}</p>
    </div>
  );
}
