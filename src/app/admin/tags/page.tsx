"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  adminListProductTagsAction,
  adminCreateProductTagAction,
  adminToggleProductTagAction,
  adminUpdateProductTagAction,
  adminDeleteProductTagAction,
} from "@/app/admin/actions/tags";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";

type Tag = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at?: string;
};

export default function AdminProductTagsPage() {
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListProductTagsAction();
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
            : "خطا در بارگذاری برچسب‌ها",
      );
      setItems([]);
      return;
    }
    setItems((res.items as Tag[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.slug.toLowerCase().includes(s),
    );
  }, [items, q]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    const res = await adminCreateProductTagAction({
      name: name.trim(),
      slug: slug.trim() || undefined,
    });
    setCreating(false);
    if (!res.ok) {
      setError(
        res.error === "name_required"
          ? "نام برچسب لازم است"
          : "ایجاد برچسب ناموفق بود",
      );
      return;
    }
    setName("");
    setSlug("");
    await load();
  }

  async function toggle(id: string, next: boolean) {
    setBusyId(id);
    const res = await adminToggleProductTagAction(id, next);
    setBusyId(null);
    if (!res.ok) {
      setError("تغییر وضعیت ناموفق بود");
      return;
    }
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_active: next } : t)),
    );
  }

  async function renameTag(id: string, current: string) {
    const next = window.prompt("نام جدید برچسب", current);
    if (next == null || !next.trim() || next.trim() === current) return;
    setBusyId(id);
    const res = await adminUpdateProductTagAction(id, { name: next.trim() });
    setBusyId(null);
    if (!res.ok) {
      setError("ویرایش نام ناموفق بود");
      return;
    }
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: next.trim() } : t)),
    );
  }

  async function removeTag(id: string, name: string) {
    if (!window.confirm(`حذف برچسب «${name}»؟`)) return;
    setBusyId(id);
    const res = await adminDeleteProductTagAction(id);
    setBusyId(null);
    if (!res.ok) {
      setError("حذف ناموفق بود");
      return;
    }
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="bg-background min-h-screen space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">برچسب محصولات</h1>
          <p className="text-muted-foreground text-sm">
            {toPersianDigits(String(items.length))} برچسب
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="border-border rounded-xl border px-4 py-2 text-sm"
        >
          داشبورد
        </Link>
      </div>

      <form
        onSubmit={onCreate}
        className="border-border grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام برچسب"
          className="border-border bg-background rounded-xl border px-3 py-2 text-sm"
          required
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="اسلاگ (اختیاری)"
          className="border-border bg-background rounded-xl border px-3 py-2 font-mono text-sm"
          dir="ltr"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm disabled:opacity-50"
        >
          {creating ? "…" : "افزودن"}
        </button>
      </form>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="جستجو نام یا اسلاگ…"
        className="border-border bg-background w-full max-w-md rounded-xl border px-3 py-2 text-sm"
      />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

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
              {filtered.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3 font-medium">{t.name}
                  <span className="mr-2 inline-flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void renameTag(t.id, t.name)}
                      className="text-xs text-sky-700 hover:underline"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void removeTag(t.id, t.name)}
                      className="text-destructive text-xs hover:underline"
                    >
                      حذف
                    </button>
                  </span></td>
                  <td className="text-muted-foreground p-3 font-mono text-xs" dir="ltr">
                    {t.slug}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      className="border-border rounded-lg border px-2 py-1 text-xs disabled:opacity-50"
                      onClick={() => void toggle(t.id, !t.is_active)}
                    >
                      {t.is_active ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-muted-foreground p-6 text-center"
                  >
                    برچسبی نیست
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        صفحات عمومی برچسب معمولاً noindex هستند.
      </p>
    </div>
  );
}
