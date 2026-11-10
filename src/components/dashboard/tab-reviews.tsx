"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyReviewsAction } from "@/app/(shop)/actions/reviews";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate } from "@/lib/dates/jalali";

export function TabReviews() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await listMyReviewsAction();
      setLoading(false);
      if (res.ok) setItems(res.items);
    })();
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
      <h2 className="text-base font-bold text-primary">نظرات من</h2>
      {!items.length ? (
        <p className="text-muted-foreground text-sm">هنوز نظری ثبت نکرده‌اید.</p>
      ) : (
        items.map((r) => (
          <article key={r.id} className="border-border rounded-xl border p-4 text-sm">
            <div className="mb-1 flex flex-wrap gap-2 text-xs">
              {r.product?.slug ? (
                <Link href={`/محصولات/${r.product.slug}`} className="font-medium underline">
                  {r.product.name}
                </Link>
              ) : null}
              <span className="text-amber-600">{"★".repeat(r.rating || 0)}</span>
              <span className="text-muted-foreground">{formatJalaliDate(r.created_at)}</span>
              <span>{r.is_approved ? "منتشرشده" : "در انتظار تأیید"}</span>
            </div>
            {r.title ? <p className="font-medium">{r.title}</p> : null}
            <p className="text-muted-foreground whitespace-pre-wrap">{r.body}</p>
            {(r.images ?? []).length ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {(r.images as { url: string }[]).length} تصویر پیوست
              </p>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
