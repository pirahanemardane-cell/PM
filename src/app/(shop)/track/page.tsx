"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { trackOrderAction } from "@/app/(shop)/actions/shop";
import { formatJalaliDate } from "@/lib/dates/jalali";
import { toPersianDigits } from "@/lib/numbers";
import { LumaSpin } from "@/components/ui/luma-spin";

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار بررسی",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو شده",
  refunded: "بازگشت وجه",
};

function TrackForm() {
  const search = useSearchParams();
  const initial = (search.get("code") || search.get("id") || "").trim();
  const [code, setCode] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    status: string;
    total_amount: number;
    shipping_city: string | null;
    created_at: string;
    items: {
      id: string;
      title: string;
      size_name?: string | null;
      color_name?: string | null;
      quantity: number;
    }[];
  } | null>(null);

  useEffect(() => {
    if (initial) void run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function run(raw: string) {
    const normalized = raw.trim();
    if (!normalized) {
      setError("شناسه سفارش را وارد کنید");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await trackOrderAction(normalized);
      if (!res.ok) {
        setError(res.error || "سفارشی یافت نشد");
        return;
      }
      setResult(res.order as typeof result);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(code);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="شناسه کامل سفارش (UUID)"
          className="border-input bg-background h-11 flex-1 rounded-xl border px-3 text-sm"
          dir="ltr"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground h-11 rounded-xl px-6 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "جستجو…" : "پیگیری"}
        </button>
      </form>
      <p className="text-muted-foreground text-xs">
        فقط شناسه کامل سفارش پذیرفته می‌شود.
      </p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {loading && !result ? (
        <div className="flex justify-center py-10">
          <LumaSpin />
        </div>
      ) : null}
      {result ? (
        <div className="border-border bg-card space-y-3 rounded-2xl border p-5 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-bold text-primary">
              {STATUS_FA[result.status] ?? result.status}
            </span>
            <span className="text-muted-foreground text-xs" dir="ltr">
              {result.id}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {result.created_at ? formatJalaliDate(result.created_at) : ""}
            {result.shipping_city ? ` · ${result.shipping_city}` : ""}
          </p>
          <p className="font-medium">
            {toPersianDigits(
              Math.round(result.total_amount || 0).toLocaleString("en-US"),
            )}{" "}
            تومان
          </p>
          <ul className="text-muted-foreground space-y-1 border-t pt-3 text-xs">
            {result.items.map((it) => (
              <li key={it.id}>
                {it.title}
                {it.size_name ? ` · ${it.size_name}` : ""}
                {it.quantity > 1
                  ? ` × ${toPersianDigits(String(it.quantity))}`
                  : ""}
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className="border-border inline-flex h-9 items-center rounded-xl border px-3 text-xs">
            پنل خریدار
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-10" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-primary">پیگیری سفارش</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          با شناسه سفارش از وضعیت خرید خود مطلع شوید.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <LumaSpin />
          </div>
        }
      >
        <TrackForm />
      </Suspense>
    </main>
  );
}
