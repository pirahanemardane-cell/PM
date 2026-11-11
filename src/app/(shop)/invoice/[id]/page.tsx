"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getMyOrderInvoiceAction,
  type CustomerInvoiceDTO,
} from "@/app/(shop)/actions/invoice";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";
import { toPersianDigits } from "@/lib/numbers";

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو",
};

export default function CustomerInvoicePage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [order, setOrder] = useState<CustomerInvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await getMyOrderInvoiceAction(id);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "برای مشاهده فاکتور وارد شوید"
          : res.error === "not_found"
            ? "فاکتور یافت نشد"
            : "خطا در بارگذاری",
      );
      setOrder(null);
      return;
    }
    setOrder(res.order);
    setError(null);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20" dir="rtl">
        <LumaSpin />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 text-center" dir="rtl">
        <p className="text-sm">{error || "یافت نشد"}</p>
        <Link href="/داشبورد?tab=orders" className="text-primary underline">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    );
  }

  const itemsSub = order.items.reduce((s, it) => s + Number(it.line_total || 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 print:p-0 sm:p-8" dir="rtl">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <Link href="/داشبورد?tab=orders" className="text-sm underline">
          ← سفارش‌ها
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="border-border rounded-xl border px-4 py-2 text-sm"
        >
          چاپ فاکتور / رسید
        </button>
      </div>

      <header className="border-border space-y-1 border-b pb-4">
        <h1 className="text-xl font-bold text-primary">فاکتور فروش — پیراهن مردانه</h1>
        <p className="text-muted-foreground text-sm">
          شماره: <span dir="ltr">{order.id}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          تاریخ: {formatJalaliDateTime(order.created_at)} · وضعیت:{" "}
          {STATUS_FA[order.status] || order.status}
        </p>
      </header>

      <section className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">گیرنده</p>
          <p className="font-medium">{order.shipping_name || "—"}</p>
          <p dir="ltr">{order.shipping_phone || ""}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">آدرس ارسال</p>
          <p>
            {[order.shipping_city, order.shipping_address].filter(Boolean).join("، ") || "—"}
          </p>
          {order.shipping_postal ? (
            <p className="text-xs" dir="ltr">
              {order.shipping_postal}
            </p>
          ) : null}
        </div>
      </section>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-right">کالا</th>
              <th className="p-3 text-right">تعداد</th>
              <th className="p-3 text-right">فی</th>
              <th className="p-3 text-right">جمع</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-border border-t">
                <td className="p-3">
                  {it.title}
                  <span className="text-muted-foreground block text-xs">
                    {[it.size_name, it.color_name].filter(Boolean).join(" · ")}
                  </span>
                </td>
                <td className="p-3">{toPersianDigits(String(it.quantity))}</td>
                <td className="p-3">
                  {toPersianDigits(Math.round(it.unit_price).toLocaleString("en-US"))}
                </td>
                <td className="p-3 font-medium">
                  {toPersianDigits(Math.round(it.line_total).toLocaleString("en-US"))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">جمع کالا</span>
          <span>{toPersianDigits(Math.round(itemsSub).toLocaleString("en-US"))} تومان</span>
        </div>
        {Number(order.discount_amount) > 0 ? (
          <div className="flex justify-between text-emerald-700">
            <span>تخفیف{order.discount_code ? ` (${order.discount_code})` : ""}</span>
            <span>
              −{toPersianDigits(Math.round(Number(order.discount_amount)).toLocaleString("en-US"))}
            </span>
          </div>
        ) : null}
        {Number(order.shipping_fee) > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              ارسال{order.shipping_method_title ? ` — ${order.shipping_method_title}` : ""}
            </span>
            <span>
              {toPersianDigits(Math.round(Number(order.shipping_fee)).toLocaleString("en-US"))}
            </span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-muted-foreground">ارسال</span>
            <span>{order.shipping_method_title || "—"}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-base font-bold">
          <span>مبلغ قابل پرداخت</span>
          <span>
            {toPersianDigits(Math.round(order.total_amount).toLocaleString("en-US"))} تومان
          </span>
        </div>
        {order.tracking_number ? (
          <p className="text-muted-foreground pt-2 text-xs">
            کد رهگیری: <span dir="ltr">{order.tracking_number}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
