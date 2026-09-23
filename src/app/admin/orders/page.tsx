"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListOrdersAction,
  adminUpdateOrderStatusAction,
} from "@/app/admin/actions/orders";
import { LumaSpin } from "@/components/ui/luma-spin";

const STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو",
};

type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  discount_code?: string | null;
  discount_amount?: number | null;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_city?: string | null;
  created_at: string;
  order_items?: { title: string; quantity: number; line_total: number }[];
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListOrdersAction(80, {
      status: statusFilter,
      q: qApplied || undefined,
    });
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
            : "خطا در بارگذاری",
      );
      setItems([]);
      return;
    }
    setItems((res.items as OrderRow[]) ?? []);
  }, [statusFilter, qApplied]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onOrders() {
      void load();
    }
    window.addEventListener("pm:orders-changed", onOrders);
    return () => window.removeEventListener("pm:orders-changed", onOrders);
  }, [load]);

  async function changeStatus(id: string, status: string) {
    setBusyId(id);
    const res = await adminUpdateOrderStatusAction(id, status);
    setBusyId(null);
    if (!res.ok) {
      setError("به‌روزرسانی وضعیت ناموفق بود");
      return;
    }
    setItems((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    );
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setQApplied(q.trim());
  }

  return (
    <div className="bg-background min-h-screen p-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">سفارش‌ها</h1>
            <p className="text-muted-foreground text-sm">
              مدیریت سفارش‌های فروشگاه
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="border-border rounded-xl border px-4 py-2 text-sm"
            >
              تازه‌سازی
            </button>
            <Link
              href="/admin/dashboard"
              className="border-border rounded-xl border px-4 py-2 text-sm"
            >
              داشبورد
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs ${
              statusFilter === "all"
                ? "bg-secondary text-secondary-foreground"
                : "border-border border"
            }`}
          >
            همه
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                statusFilter === s
                  ? "bg-secondary text-secondary-foreground"
                  : "border-border border"
              }`}
            >
              {STATUS_FA[s]}
            </button>
          ))}
        </div>

        <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو نام یا موبایل گیرنده"
            className="border-input bg-background h-10 min-w-[14rem] flex-1 rounded-xl border px-3 text-sm"
            dir="rtl"
          />
          <button
            type="submit"
            className="bg-secondary text-secondary-foreground rounded-xl px-4 py-2 text-sm"
          >
            جستجو
          </button>
        </form>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <LumaSpin />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            سفارشی یافت نشد.
          </p>
        ) : (
          <div className="border-border overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">کد</th>
                  <th className="p-3 font-medium">گیرنده</th>
                  <th className="p-3 font-medium">مبلغ</th>
                  <th className="p-3 font-medium">تخفیف</th>
                  <th className="p-3 font-medium">وضعیت</th>
                  <th className="p-3 font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="border-border border-t">
                    <td className="p-3 font-mono text-xs">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-primary hover:underline"
                      >
                        {o.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="p-3">
                      <div>{o.shipping_name ?? "—"}</div>
                      <div className="text-muted-foreground text-xs">
                        {o.shipping_city ?? ""} {o.shipping_phone ?? ""}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {Number(o.total_amount).toLocaleString("fa-IR")} تومان
                    </td>
                    <td className="p-3">
                      {o.discount_code ? (
                        <span className="text-xs">
                          {o.discount_code}
                          {o.discount_amount
                            ? ` (−${Number(o.discount_amount).toLocaleString("fa-IR")})`
                            : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        disabled={busyId === o.id}
                        onChange={(e) => void changeStatus(o.id, e.target.value)}
                        className="border-input bg-background max-w-[9rem] rounded-lg border px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_FA[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString("fa-IR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
