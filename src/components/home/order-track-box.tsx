"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toEnglishDigits } from "@/lib/numbers";
import { trackOrderAction } from "@/app/(shop)/actions/shop";

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

export function OrderTrackBox() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    status: string;
    total_amount: number;
    shipping_name: string | null;
    shipping_city: string | null;
    created_at: string;
    items: {
      id: string;
      title: string;
      size_name?: string;
      color_name?: string;
      quantity: number;
      line_total: number;
    }[];
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const normalized = toEnglishDigits(code).trim();
    if (normalized.length < 8) {
      setError("حداقل ۸ کاراکتر از شناسه سفارش را وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      const res = await trackOrderAction(normalized);
      if (!res.ok) {
        setError(res.error || "سفارشی یافت نشد");
        return;
      }
      setResult(res.order);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card space-y-4 rounded-2xl border p-5" dir="rtl">
      <h2 className="text-lg font-bold text-primary">پیگیری سفارش</h2>
      <p className="text-muted-foreground text-sm leading-7">
        با شناسه سفارش از وضعیت خرید خود مطلع شوید.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="مثال: c1f37a67"
          className="flex-1"
          dir="ltr"
        />
        <Button
          type="submit"
          suppressHydrationWarning
          variant="outline"
          disabled={loading}
          className="hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground"
        >
          {loading ? "جستجو…" : "پیگیری"}
        </Button>
      </form>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {result ? (
        <div className="border-border space-y-2 rounded-xl border p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold">
              {STATUS_FA[result.status] ?? result.status}
            </span>
            <span className="text-muted-foreground text-xs" dir="ltr">
              {result.id.slice(0, 8)}…
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {result.created_at
              ? new Date(result.created_at).toLocaleDateString("fa-IR")
              : ""}
            {result.shipping_city ? ` · ${result.shipping_city}` : ""}
            {result.shipping_name ? ` · ${result.shipping_name}` : ""}
          </p>
          <p className="font-medium">
            {(result.total_amount || 0).toLocaleString("fa-IR")} تومان
          </p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            {result.items.map((it) => (
              <li key={it.id}>
                {it.title}
                {it.size_name ? ` · ${it.size_name}` : ""}
                {it.quantity > 1 ? ` × ${it.quantity}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
