"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyQuestionsAction } from "@/app/(shop)/actions/product-qa";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate } from "@/lib/dates/jalali";

export function TabQA() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await listMyQuestionsAction();
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
      <h2 className="text-base font-bold text-primary">پرسش‌های من</h2>
      {!items.length ? (
        <p className="text-muted-foreground text-sm">هنوز سوالی نپرسیده‌اید. از صفحه محصول بپرسید.</p>
      ) : (
        items.map((q) => (
          <article key={q.id} className="border-border rounded-xl border p-4 text-sm">
            <div className="text-muted-foreground mb-1 flex flex-wrap gap-2 text-xs">
              {q.product?.slug ? (
                <Link href={`/محصولات/${q.product.slug}`} className="underline">
                  {q.product.name}
                </Link>
              ) : null}
              <span>{formatJalaliDate(q.created_at)}</span>
              <span>{q.is_approved ? "تأییدشده" : "در انتظار تأیید"}</span>
            </div>
            <p className="whitespace-pre-wrap">{q.body}</p>
            {(q.answers ?? [])
              .filter((a: any) => a.is_approved)
              .map((a: any) => (
                <p key={a.id} className="bg-muted/40 mt-2 rounded-lg p-2 text-xs">
                  {a.is_staff ? "فروشگاه: " : ""}
                  {a.body}
                </p>
              ))}
          </article>
        ))
      )}
    </div>
  );
}
