"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  adminListBlogCategoriesAction,
  adminCreateBlogCategoryAction,
  adminToggleBlogCategoryAction,
} from "@/app/admin/actions/blog";
import { LumaSpin } from "@/components/ui/luma-spin";

type Cat = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order?: number;
};

export default function AdminBlogCategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await adminListBlogCategoriesAction();
    setLoading(false);
    if (!res.ok) {
      setErr(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
            : "خطا در بارگذاری",
      );
      setItems([]);
      return;
    }
    setItems((res.items as Cat[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.slug || "").toLowerCase().includes(s),
    );
  }, [items, q]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await adminCreateBlogCategoryAction({ name: name.trim() });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error === "name_required" ? "نام الزامی است" : "ایجاد ناموفق");
      return;
    }
    setName("");
    void load();
  }

  async function toggle(id: string, next: boolean) {
    setBusyId(id);
    const res = await adminToggleBlogCategoryAction(id, next);
    setBusyId(null);
    if (!res.ok) {
      setErr("تغییر وضعیت ناموفق");
      return;
    }
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: next } : c)),
    );
  }

  return (
    <div className="bg-background min-h-screen space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">دسته‌های بلاگ</h1>
          <p className="text-muted-foreground text-sm">مدیریت دسته‌بندی مقالات</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blog"
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            مقالات
          </Link>
          <Link
            href="/admin/dashboard"
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            داشبورد
          </Link>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="border-border flex flex-wrap items-end gap-2 rounded-2xl border p-4"
      >
        <label className="block min-w-[12rem] flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">نام دسته جدید</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border bg-background w-full rounded-xl border px-3 py-2"
            placeholder="مثلاً راهنمای خرید"
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "…" : "افزودن"}
        </button>
      </form>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="جستجو نام یا اسلاگ"
        className="border-border bg-background w-full max-w-md rounded-xl border px-3 py-2 text-sm"
      />

      {err ? <p className="text-destructive text-sm">{err}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right">نام</th>
                <th className="p-3 text-right">اسلاگ</th>
                <th className="p-3 text-right">فعال</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="text-muted-foreground p-3 font-mono text-xs" dir="ltr">
                    {c.slug}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => void toggle(c.id, !c.is_active)}
                      className="border rounded-lg px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {c.is_active ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={3} className="text-muted-foreground p-6 text-center">
                    دسته‌ای نیست
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
