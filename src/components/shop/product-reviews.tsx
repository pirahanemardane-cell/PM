"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  createProductReviewAction,
  listProductReviewsAction,
  uploadReviewImageAction,
} from "@/app/(shop)/actions/reviews";
import { ComposerInput } from "@/components/ui/composer-input";
import { formatJalaliDate } from "@/lib/dates/jalali";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  admin_reply?: string | null;
  is_verified?: boolean | null;
  created_at: string;
  user?: { full_name: string | null } | null;
  images?: { id?: string; url: string; sort_order?: number }[];
};

export function ProductReviews({ productId }: { productId: string }) {
  const [items, setItems] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await listProductReviewsAction(productId);
    if (res.ok) setItems(res.items as unknown as Review[]);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRtEvent(RT.reviews, () => {
    void load();
  });

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMsg("");
    const next = [...pendingUrls];
    for (const file of Array.from(files).slice(0, 4 - next.length)) {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadReviewImageAction(fd);
      if (res.ok && res.url) next.push(res.url);
      else {
        const map: Record<string, string> = {
          login_required: "برای ارسال تصویر وارد شوید",
          too_large: "حجم تصویر حداکثر ۳ مگابایت",
          not_image: "فقط تصویر مجاز است",
        };
        setMsg(map[res.error || ""] || "آپلود تصویر ناموفق");
      }
    }
    setPendingUrls(next.slice(0, 4));
    setUploading(false);
  }

  async function onSend(body: string) {
    setBusy(true);
    setMsg("");
    const res = await createProductReviewAction({
      productId,
      rating,
      title: title || undefined,
      body,
      imageUrls: pendingUrls,
    });
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        login_required: "برای ثبت نظر وارد شوید",
        rating_invalid: "امتیاز نامعتبر",
        body_short: "متن نظر کوتاه است",
        already_reviewed: "قبلاً برای این محصول نظر داده‌اید",
        not_purchased: "فقط پس از خرید این محصول می‌توانید نظر دهید",
      };
      setMsg(map[res.error] || res.error || "خطا در ثبت نظر");
      return;
    }
    setTitle("");
    setPendingUrls([]);
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
              <span className="font-medium">{r.user?.full_name?.trim() || "خریدار"}</span>
              {r.is_verified ? (
                <span
                  title="این نظر پس از خرید ثبت شده"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                >
                  خریدار
                </span>
              ) : null}
              <span className="text-amber-600">{"★".repeat(r.rating)}</span>
              <time className="text-muted-foreground text-xs">{formatJalaliDate(r.created_at)}</time>
            </div>
            {r.title ? <p className="font-medium">{r.title}</p> : null}
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{r.body}</p>
            {(r.images ?? []).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(r.images ?? []).map((img) => (
                  <a
                    key={img.url}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative h-20 w-20 overflow-hidden rounded-lg border"
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="80px" unoptimized />
                  </a>
                ))}
              </div>
            ) : null}
            {r.admin_reply ? (
              <div className="bg-muted/50 mt-3 rounded-lg border-r-2 border-primary p-3 text-xs">
                <p className="mb-1 font-medium text-primary">پاسخ فروشگاه</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{r.admin_reply}</p>
              </div>
            ) : null}
          </article>
        ))}
        {!items.length ? (
          <p className="text-muted-foreground text-sm">هنوز نظر تأییدشده‌ای نیست.</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-primary">ثبت نظر</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs">امتیاز</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان (اختیاری)"
            className="border-input bg-background h-9 min-w-[12rem] flex-1 rounded-lg border px-3 text-sm"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs">عکس محصول (اختیاری، تا ۴ تصویر)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading || pendingUrls.length >= 4}
            onChange={(e) => void onPickFiles(e.target.files)}
            className="block w-full text-xs"
          />
          {pendingUrls.length ? (
            <div className="flex flex-wrap gap-2">
              {pendingUrls.map((u) => (
                <div key={u} className="relative h-16 w-16 overflow-hidden rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white"
                    onClick={() => setPendingUrls((p) => p.filter((x) => x !== u))}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <ComposerInput
          onSend={onSend}
          placeholder="نظر خود را بنویسید... (متن بدون لینک؛ عکس جداگانه)"
          sendLabel="ارسال نظر"
          disabled={busy || uploading}
        />
        {msg ? <p className="text-muted-foreground text-sm">{msg}</p> : null}
      </div>
    </section>
  );
}
