"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  adminGetOrderAction,
  adminUpdateOrderStatusAction,
  adminSetOrderTrackingAction,
} from "@/app/admin/actions/orders";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await adminGetOrderAction(id);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "not_found"
          ? "سفارش پیدا نشد"
          : res.error === "forbidden"
            ? "دسترسی ندارید"
            : "خطا در بارگذاری",
      );
      setOrder(null);
      return;
    }
    setOrder(res.order);
    setTracking(String((res.order as any)?.tracking_number ?? ""));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(status: string) {
    setBusy(true);
    const res = await adminUpdateOrderStatusAction(id, status);
    setBusy(false);
    if (!res.ok) {
      setError("به‌روزرسانی وضعیت ناموفق");
      return;
    }
    setOrder((o: any) => (o ? { ...o, status } : o));
  }

  async function saveTracking() {
    setBusy(true);
    const res = await adminSetOrderTrackingAction(id, tracking);
    setBusy(false);
    if (!res.ok) {
      setError("ذخیره کد رهگیری ناموفق");
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" dir="rtl">
        <LumaSpin />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-3 p-6" dir="rtl">
        <p className="text-destructive text-sm">{error ?? "نامشخص"}</p>
        <Link href="/admin/orders" className="text-primary text-sm underline">
          بازگشت به لیست
        </Link>
      </div>
    );
  }

  const items = order.order_items ?? [];

  return (
    <div className="bg-background min-h-screen p-6 print:p-0" dir="rtl">
      <div className="w-full max-w-none space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-primary">سفارش</h1>
            <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="border-border rounded-xl border px-4 py-2 text-sm"
            >
              چاپ فاکتور
            </button>
            <Link
              href="/admin/orders"
              className="border-border rounded-xl border px-4 py-2 text-sm"
            >
              لیست سفارش‌ها
            </Link>
          </div>
        </div>

        <div className="border-border bg-card space-y-3 rounded-2xl border p-5 text-sm">
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <span className="text-muted-foreground">وضعیت</span>
            <select
              value={order.status}
              disabled={busy}
              onChange={(e) => void changeStatus(e.target.value)}
              className="border-input bg-background h-9 rounded-lg border px-2 text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_FA[s] ?? s}
                </option>
              ))}
            </select>
          </div>
          <p>
            <span className="text-muted-foreground">وضعیت: </span>
            {STATUS_FA[order.status] ?? order.status}
          </p>
          <p>
            <span className="text-muted-foreground">گیرنده: </span>
            {order.shipping_name} — {order.shipping_phone}
          </p>
          <p>
            <span className="text-muted-foreground">آدرس: </span>
            {order.shipping_city} {order.shipping_address}{" "}
            {order.shipping_postal ?? ""}
          </p>

          <div className="border-border space-y-2 rounded-xl border p-3 print:border-0 print:p-0">
            <label className="text-muted-foreground text-xs">کد رهگیری پست / پیک</label>
            <div className="flex flex-wrap gap-2">
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="مثلاً 1234567890"
                dir="ltr"
                className="border-input bg-background h-9 min-w-[200px] flex-1 rounded-lg border px-3 font-mono text-xs"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveTracking()}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-50"
              >
                ذخیره رهگیری
              </button>
            </div>
            {order.tracking_number ? (
              <p className="text-xs">
                فعلی:{" "}
                <span className="font-mono font-bold" dir="ltr">
                  {order.tracking_number}
                </span>
                {order.shipped_at ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — {formatJalaliDateTime(order.shipped_at)}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          {order.note ? (
            <p>
              <span className="text-muted-foreground">یادداشت: </span>
              {order.note}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">مبلغ: </span>
            {Number(order.total_amount).toLocaleString("fa-IR")} تومان
          </p>
          {order.discount_code ? (
            <p>
              <span className="text-muted-foreground">تخفیف: </span>
              {order.discount_code} (−
              {Number(order.discount_amount ?? 0).toLocaleString("fa-IR")})
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            {formatJalaliDateTime(order.created_at)}
          </p>
        </div>

        <div className="border-border overflow-hidden rounded-2xl border">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">کالا</th>
                <th className="p-3 font-medium">تعداد</th>
                <th className="p-3 font-medium">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any) => (
                <tr key={it.id} className="border-border border-t">
                  <td className="p-3">
                    {it.title}
                    <span className="text-muted-foreground block text-xs">
                      {[it.size_name, it.color_name].filter(Boolean).join(" / ")}
                    </span>
                  </td>
                  <td className="p-3">{it.quantity}</td>
                  <td className="p-3 whitespace-nowrap">
                    {Number(it.line_total).toLocaleString("fa-IR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
