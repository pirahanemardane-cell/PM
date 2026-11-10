"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminAnswerQuestionAction,
  adminDeleteQuestionAction,
  adminListProductQuestionsAction,
  adminSetQuestionApprovedAction,
  type AdminQuestionRow,
} from "@/app/admin/actions/product-qa";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

export default function AdminProductQaPage() {
  const [items, setItems] = useState<AdminQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminListProductQuestionsAction(filter);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "forbidden"
          ? "دسترسی ندارید"
          : "بارگذاری ناموفق — مطمئن شوید مایگریشن ۰۶۷ اعمال شده",
      );
      return;
    }
    setItems(res.items);
    setError(null);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">پرسش و پاسخ محصولات</h1>
        <p className="text-muted-foreground text-sm">تأیید سوالات خریداران و پاسخ فروشگاه</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "در انتظار"],
            ["approved", "تأییدشده"],
            ["all", "همه"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === id ? "bg-primary text-primary-foreground" : "border-border border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {loading ? (
        <div className="flex justify-center py-12">
          <LumaSpin />
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">موردی نیست</p>
          ) : (
            items.map((q) => (
              <article key={q.id} className="border-border space-y-3 rounded-xl border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/products/${q.product?.slug || ""}`}
                    className="font-medium hover:underline"
                  >
                    {q.product?.name ?? "محصول"}
                  </Link>
                  <span className="text-muted-foreground text-xs">
                    {q.user?.full_name || "کاربر"} · {formatJalaliDateTime(q.created_at)}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      q.is_approved ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
                    }`}
                  >
                    {q.is_approved ? "تأیید" : "در انتظار"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{q.body}</p>
                {(q.answers ?? []).length ? (
                  <ul className="bg-muted/40 space-y-1 rounded-lg p-3 text-xs">
                    {(q.answers ?? []).map((a) => (
                      <li key={a.id}>
                        {a.is_staff ? "فروشگاه: " : ""}
                        {a.body}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <textarea
                  className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  rows={2}
                  placeholder="پاسخ فروشگاه…"
                  value={reply[q.id] || ""}
                  onChange={(e) => setReply((r) => ({ ...r, [q.id]: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === q.id}
                    className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                    onClick={async () => {
                      setBusy(q.id);
                      await adminAnswerQuestionAction(q.id, reply[q.id] || "");
                      setBusy(null);
                      void load();
                    }}
                  >
                    ثبت پاسخ
                  </button>
                  {!q.is_approved ? (
                    <button
                      type="button"
                      className="border-border rounded-lg border px-3 py-1.5 text-xs"
                      onClick={async () => {
                        setBusy(q.id);
                        await adminSetQuestionApprovedAction(q.id, true);
                        setBusy(null);
                        void load();
                      }}
                    >
                      تأیید سوال
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="border-border rounded-lg border px-3 py-1.5 text-xs"
                      onClick={async () => {
                        setBusy(q.id);
                        await adminSetQuestionApprovedAction(q.id, false);
                        setBusy(null);
                        void load();
                      }}
                    >
                      رد نمایش
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-destructive text-xs underline"
                    onClick={async () => {
                      if (!confirm("حذف سوال؟")) return;
                      setBusy(q.id);
                      await adminDeleteQuestionAction(q.id);
                      setBusy(null);
                      void load();
                    }}
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
