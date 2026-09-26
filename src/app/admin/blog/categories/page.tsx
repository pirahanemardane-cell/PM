"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminBulkBar } from "@/components/admin/bulk-bar";
import {
  adminArchiveBlogCategoriesAction,
  adminHardDeleteBlogCategoriesAction,
} from "@/app/admin/actions/lifecycle";
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
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  
  function toggleSelectAll(ids: string[]) {
    setSelected((prev) =>
      prev.length === ids.length && ids.every((id) => prev.includes(id))
        ? []
        : [...ids],
    );
  }
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  async function runBulkArchive() {
    if (!selected.length) return;
    if (!confirm("آرشیو موارد انتخاب‌شده؟")) return;
    setBulkBusy(true);
    const res = await adminArchiveBlogCategoriesAction(selected);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    setSelected([]);
    void load();
  }
  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await adminHardDeleteBlogCategoriesAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        has_products: "به محصول متصل است",
        has_orders: "در سفارش‌ها استفاده شده",
      };
      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");
      return;
    }
    setSelected([]);
    void load();
  }
  async function archiveOne(id: string, name: string) {
    if (!confirm(`آرشیو «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminArchiveBlogCategoriesAction([id]);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    void load();
  }
  async function hardDeleteOne(id: string, name: string) {
    if (!confirm(`حذف دائمی «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteBlogCategoriesAction([id]);
    setBulkBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        has_products: "به محصول متصل است",
        has_orders: "در سفارش‌ها استفاده شده",
      };
      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");
      return;
    }
    void load();
  }
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
          <h1 className="text-2xl font-bold text-primary">دسته‌های بلاگ</h1>
        <AdminBulkBar
          count={selected.length}
          total={items.length}
          onSelectAll={() => toggleSelectAll(items.map((x) => x.id))}
          busy={bulkBusy}
          onArchive={() => void runBulkArchive()}
          onHardDelete={() => void runBulkHardDelete()}
          onClear={() => setSelected([])}
        />

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
        <div className="table-scroll border-border overflow-x-auto rounded-xl border">
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
                  <td className="p-3 font-medium"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} /><span>{c.name}</span></label> <button type="button" className="text-muted-foreground text-xs" onClick={() => void archiveOne(c.id, c.name)}>آرشیو</button> <button type="button" className="text-destructive text-xs" onClick={() => void hardDeleteOne(c.id, c.name)}>حذف دائمی</button></td>
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
