"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createProductReviewAction,
  listProductReviewsAction,
} from "@/app/(shop)/actions/reviews";
import { ComposerInput } from "@/components/ui/composer-input";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  user?: { full_name: string | null } | null;
};

export function ProductReviews({ productId }: { productId: string }) {
  const [items, setItems] = useState<Review[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await listProductReviewsAction(productId);
    if (res.ok) setItems(res.items as Review[]);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSend(body: string) {
    setBusy(true);
    setMsg("");
    const res = await createProductReviewAction({
      productId,
      rating,
      title: title || undefined,
      body,
      parentId: replyTo || undefined,
    });
    setReplyTo(null);
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        login_required: "برای ثبت نظر وارد شوید",
        rating_invalid: "امتیاز نامعتبر",
        body_short: "متن نظر کوتاه است",
        already_reviewed: "قبلاً برای این محصول نظر داده‌اید",
      };
      setMsg(map[res.error] || res.error || "خطا در ثبت نظر");
      return;
    }
    setTitle("");
    setMsg("نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.");
    void load();
  }

  return (
    <section className="space-y-6 border-t pt-8" dir="rtl">
      <h2 className="text-xl font-bold text-primary">نظرات خریداران</h2>

      <div className="space-y-3">
        {items.map((r) => (
          <article key={r.id} className="border-border rounded-xl border p-4 text-sm">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {r.user?.full_name?.trim() || "خریدار"}
              </span>
              <span className="text-amber-600">{"★".repeat(r.rating)}</span>
              <time className="text-muted-foreground text-xs">
                {new Date(r.created_at).toLocaleDateString("fa-IR")}
              </time>
            </div>
            {r.title ? <p className="font-medium">{r.title}</p> : null}
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{r.body}</p>
            <button
              type="button"
              className="text-primary mt-2 text-xs font-medium hover:underline"
              onClick={() => setReplyTo(r.id)}
            >
              پاسخ
            </button>
          </article>
        ))}
        {!items.length ? (
          <p className="text-muted-foreground text-sm">هنوز نظر تأییدشده‌ای نیست.</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-primary">ثبت نظر</h3>
        {replyTo ? (
          <p className="text-muted-foreground text-xs">
            در حال پاسخ به نظر{" "}
            <button type="button" className="text-primary underline" onClick={() => setReplyTo(null)}>
              انصراف
            </button>
          </p>
        ) : null}
        <ComposerInput
          onSend={onSend}
          placeholder={replyTo ? "پاسخ خود را بنویسید..." : "نظر خود را بنویسید..."}
          sendLabel={replyTo ? "ارسال پاسخ" : "ارسال نظر"}
          disabled={busy}
        />
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>
    </section>
  );
}
