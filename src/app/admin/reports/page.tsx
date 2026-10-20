"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminSalesReportAction,
  adminExportOrdersCsvAction,
} from "@/app/admin/actions/stats";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";

type Report = {
  days: number;
  ordersCount: number;
  paidCount: number;
  revenuePaid: number;
  revenueAll: number;
  byStatus: Record<string, number>;
  byDay: { date: string; orders: number; revenue: number }[];
};

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  processing: "آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو شده",
};

function money(n: number) {
  return toPersianDigits(Math.round(n).toLocaleString("en-US"));
}

export default function AdminReportsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminSalesReportAction(days);
    setLoading(false);
    if (!res.ok || !res.report) {
      setError("بارگذاری گزارش ناموفق بود");
      setReport(null);
      return;
    }
    setReport(res.report as Report);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    setError(null);
    try {
      const res = await adminExportOrdersCsvAction(days);
      if (!res.ok) {
        setError("خروجی CSV ناموفق بود");
        return;
      }
      const header = [
        "id",
        "status",
        "payment_status",
        "total_amount",
        "discount_amount",
        "shipping_name",
        "shipping_phone",
        "shipping_city",
        "shipping_address",
        "tracking_number",
        "created_at",
      ];
      const escape = (v: string | number) => {
        const s = String(v ?? "");
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [
        header.join(","),
        ...res.rows.map((r) =>
          [
            r.id,
            r.status,
            r.payment_status,
            r.total_amount,
            r.discount_amount,
            r.shipping_name,
            r.shipping_phone,
            r.shipping_city,
            r.shipping_address,
            r.tracking_number,
            r.created_at,
          ]
            .map(escape)
            .join(","),
        ),
      ];
      const blob = new Blob(["\ufeff" + lines.join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pm-orders-${days}d.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">گزارش فروش</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            خلاصه سفارش‌ها و مبلغ در بازه انتخابی
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                days === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border"
              }`}
            >
              {toPersianDigits(String(d))} روز
            </button>
          ))}
          <button
            type="button"
            disabled={exporting}
            onClick={() => void exportCsv()}
            className="border-border rounded-xl border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {exporting ? "…" : "خروجی CSV"}
          </button>
          <Link
            href="/admin/dashboard"
            className="border-border rounded-xl border px-3 py-1.5 text-sm"
          >
            داشبورد
          </Link>
          <Link
            href="/admin/backup"
            className="border-border rounded-xl border px-3 py-1.5 text-sm"
          >
            بک‌آپ
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "تعداد سفارش",
                value: toPersianDigits(String(report.ordersCount)),
              },
              {
                label: "سفارش پرداخت‌شده / موفق",
                value: toPersianDigits(String(report.paidCount)),
              },
              {
                label: "مبلغ فروش (موفق)",
                value: `${money(report.revenuePaid)} تومان`,
              },
              {
                label: "جمع مبلغ همه سفارش‌ها",
                value: `${money(report.revenueAll)} تومان`,
              },
            ].map((c) => (
              <div key={c.label} className="border-border rounded-xl border p-4">
                <p className="text-muted-foreground text-xs">{c.label}</p>
                <p className="mt-2 text-lg font-bold">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="border-border rounded-xl border p-4">
            <h2 className="mb-3 font-semibold">تفکیک وضعیت</h2>
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {Object.entries(report.byStatus).map(([k, v]) => (
                <li
                  key={k}
                  className="bg-muted/40 flex justify-between rounded-lg px-3 py-2 text-sm"
                >
                  <span>{STATUS_FA[k] || k}</span>
                  <span className="font-medium">
                    {toPersianDigits(String(v))}
                  </span>
                </li>
              ))}
              {!Object.keys(report.byStatus).length ? (
                <p className="text-muted-foreground text-sm">داده‌ای نیست</p>
              ) : null}
            </ul>
          </div>

          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[320px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-right font-medium">تاریخ</th>
                  <th className="p-3 text-right font-medium">سفارش</th>
                  <th className="p-3 text-right font-medium">فروش (تومان)</th>
                </tr>
              </thead>
              <tbody>
                {report.byDay.map((row) => (
                  <tr key={row.date} className="border-t">
                    <td className="p-3 font-mono text-xs" dir="ltr">
                      {row.date}
                    </td>
                    <td className="p-3">
                      {toPersianDigits(String(row.orders))}
                    </td>
                    <td className="p-3">{money(row.revenue)}</td>
                  </tr>
                ))}
                {!report.byDay.length ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-muted-foreground p-6 text-center"
                    >
                      در این بازه سفارشی نیست
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
