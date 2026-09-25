"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";
import {
  adminListReviewsAction,
  adminSetReviewApprovedAction,
  adminSetReviewReplyAction,
} from "@/app/admin/actions/reviews";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate, formatJalaliDateTime } from "@/lib/dates/jalali";


type Row = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  is_approved: boolean;
  admin_reply?: string | null;
  created_at: string;
  product?: { name: string } | null;
  user?: { full_name: string | null } | null;
};

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListReviewsAction({ approved: filter });
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
            : "خطا در بارگذاری",
      );
      setItems([]);
      return;
    }
    const rows = (res.items as Row[]) ?? [];
    setItems(rows);
    const next: Record<string, string> = {};
    for (const r of rows) next[r.id] = r.admin_reply ?? "";
    setDrafts(next);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useRtEvent(RT.reviews, () => {
    void load();
  });

  async function toggle(id: string, is_approved: boolean) {
    setBusyId(id);
    const res = await adminSetReviewApprovedAction(id, is_approved);
    setBusyId(null);
    if (!res.ok) {
      setError("ذخیره ناموفق بود");
      return;
    }
    if (filter === "yes" && !is_approved) {
      setItems((prev) => prev.filter((r) => r.id !== id));
    } else if (filter === "no" && is_approved) {
      setItems((prev) => prev.filter((r) => r.id !== id));
    } else {
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved } : r)),
      );
    }
  }

  async function saveReply(id: string) {
    setBusyId(id);
    const text = drafts[id] ?? "";
    const res = await adminSetReviewReplyAction(id, text);
    setBusyId(null);
    if (!res.ok) {
      setError("ذخیره پاسخ ناموفق بود");
      return;
    }
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, admin_reply: text.trim() || null } : r)),
    );
  }

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">نظرات محصولات</h1>
          <p className="text-muted-foreground text-sm">
            تأیید، رد و پاسخ رسمی فروشگاه
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "yes" | "no")}
            className="border-input bg-background h-10 rounded-xl border px-3 text-sm"
          >
            <option value="all">همه</option>
            <option value="no">در انتظار</option>
            <option value="yes">تأییدشده</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            تازه‌سازی
          </button>
          <Link
            href="/admin/dashboard"
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            داشبورد
          </Link>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <article
              key={r.id}
              className="border-border space-y-3 rounded-xl border p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.product?.name ?? "—"}</p>
                  <p className="text-muted-foreground text-xs">
                    {r.user?.full_name ?? "—"} ·{" "}
                    {formatJalaliDate(r.created_at)} ·{" "}
                    {"★".repeat(r.rating)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  className={`rounded-lg border px-2 py-1 text-xs disabled:opacity-50 ${
                    r.is_approved
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                  }`}
                  onClick={() => void toggle(r.id, !r.is_approved)}
                >
                  {r.is_approved ? "تأیید شده" : "در انتظار"}
                </button>
              </div>
              {r.title ? <p className="font-medium">{r.title}</p> : null}
              <p className="text-muted-foreground whitespace-pre-wrap">{r.body}</p>
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-medium">پاسخ فروشگاه</label>
                <textarea
                  value={drafts[r.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                  }
                  rows={2}
                  className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="پاسخ رسمی (اختیاری)"
                  dir="rtl"
                />
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void saveReply(r.id)}
                  className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  ذخیره پاسخ
                </button>
              </div>
            </article>
          ))}
          {!items.length ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              نظری نیست
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
