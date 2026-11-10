"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  cancelMyStockAlertAction,
  listMyStockAlertsAction,
} from "@/app/(shop)/actions/my-stock-alerts";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate } from "@/lib/dates/jalali";

export function TabAlerts() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    const res = await listMyStockAlertsAction();
    setLoading(false);
    if (res.ok) setItems(res.items);
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <h2 className="text-base font-bold text-primary">اطلاع موجودی</h2>
      <p className="text-muted-foreground text-sm">
        درخواست‌های «موجود شد خبرم کن» از صفحه محصول اینجا دیده می‌شوند.
      </p>
      {!items.length ? (
        <p className="text-muted-foreground text-sm">لیست خالی است.</p>
      ) : (
        items.map((a) => (
          <article key={a.id} className="border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
            <div>
              {a.product?.slug ? (
                <Link href={`/محصولات/${a.product.slug}`} className="font-medium underline">
                  {a.product.name}
                </Link>
              ) : (
                <span>محصول</span>
              )}
              <p className="text-muted-foreground text-xs">
                {[a.variant?.size, a.variant?.color_name].filter(Boolean).join(" / ") || "—"} ·{" "}
                {a.status} · {formatJalaliDate(a.created_at)}
              </p>
            </div>
            {a.status === "pending" ? (
              <button
                type="button"
                className="text-destructive text-xs underline"
                onClick={async () => {
                  await cancelMyStockAlertAction(a.id);
                  void load();
                }}
              >
                لغو
              </button>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
