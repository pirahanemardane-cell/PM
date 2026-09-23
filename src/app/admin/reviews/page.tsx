"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";
import {
  adminListReviewsAction,
  adminSetReviewApprovedAction,
} from "@/app/admin/actions/reviews";
import { LumaSpin } from "@/components/ui/luma-spin";

type Row = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  is_approved: boolean;
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
    setItems((res.items as Row[]) ?? []);
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
    // اگر فیلتر محدود است و دیگر نمی‌خورد، از لیست بردار
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

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">نظرات محصولات</h1>
          <p className="text-muted-foreground text-sm">تأیید یا رد نظرات خریداران</p>
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
        <div className="table-scroll border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right font-medium">محصول</th>
                <th className="p-3 text-right font-medium">کاربر</th>
                <th className="p-3 text-right font-medium">امتیاز</th>
                <th className="p-3 text-right font-medium">متن</th>
                <th className="p-3 text-right font-medium">تاریخ</th>
                <th className="p-3 text-right font-medium">تأیید</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 font-medium">{r.product?.name ?? "—"}</td>
                  <td className="p-3">{r.user?.full_name ?? "—"}</td>
                  <td className="p-3 tabular-nums">{r.rating} / ۵</td>
                  <td className="text-muted-foreground max-w-xs p-3 text-xs">
                    {r.title ? <strong className="text-foreground">{r.title} — </strong> : null}
                    {r.body}
                  </td>
                  <td className="text-muted-foreground p-3 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="p-3">
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
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground p-6 text-center">
                    نظری نیست
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
