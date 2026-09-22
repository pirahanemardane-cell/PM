"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  adminGetOrderAction,
  adminUpdateOrderStatusAction,
} from "@/app/admin/actions/orders";
import { LumaSpin } from "@/components/ui/luma-spin";

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  processing: "آماده‌سازی",
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
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">سفارش</h1>
            <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="border-border rounded-xl border px-4 py-2 text-sm print:hidden"
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

        <div className="border-border bg-card space-y-3 rounded-2xl border p-5 text-sm">
          <div className="flex flex-wrap items-center gap-3">
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
            <span className="text-muted-foreground">گیرنده: </span>
            {order.shipping_name} — {order.shipping_phone}
          </p>
          <p>
            <span className="text-muted-foreground">آدرس: </span>
            {order.shipping_city} {order.shipping_address}{" "}
            {order.shipping_postal ?? ""}
          </p>
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
            {new Date(order.created_at).toLocaleString("fa-IR")}
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
