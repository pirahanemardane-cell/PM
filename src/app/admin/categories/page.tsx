"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListCategoriesAction,
  adminUpdateCategoryAction,
} from "@/app/admin/actions/taxonomy";

type Cat = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await adminListCategoriesAction();
    setLoading(false);
    if (!res.ok) {
      setErr(res.error === "login_required" ? "ورود لازم است" : "خطا");
      return;
    }
    setItems(res.items as Cat[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleActive(c: Cat) {
    const res = await adminUpdateCategoryAction(c.id, { is_active: !c.is_active });
    if (res.ok) void load();
  }

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">دسته‌بندی محصولات</h1>
        <Link
          href="/admin/categories/new"
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm"
        >
          افزودن دسته
        </Link>
      </div>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {loading ? (
        <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3 text-right">نام</th>
                <th className="p-3 text-right">اسلاگ</th>
                <th className="p-3 text-right">ترتیب</th>
                <th className="p-3 text-right">فعال</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-border border-t">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="text-muted-foreground p-3 font-mono text-xs">
                    {c.slug}
                  </td>
                  <td className="p-3">{c.sort_order}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void toggleActive(c)}
                      className="border-border rounded-lg border px-2 py-1 text-xs"
                    >
                      {c.is_active ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground p-6 text-center">
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
