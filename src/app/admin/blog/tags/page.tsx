"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminBulkBar } from "@/components/admin/bulk-bar";
import {
  adminArchiveBlogTagsAction,
  adminHardDeleteBlogTagsAction,
} from "@/app/admin/actions/lifecycle";
import {
  adminListBlogTagsAction,
  adminToggleBlogTagAction,
} from "@/app/admin/actions/tags";

type Tag = { id: string; name: string; slug: string; is_active: boolean };

export default function AdminBlogTagsPage() {
  const [items, setItems] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
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
    const res = await adminArchiveBlogTagsAction(selected);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    setSelected([]);
    void load();
  }
  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await adminHardDeleteBlogTagsAction(selected);
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
    const res = await adminArchiveBlogTagsAction([id]);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    void load();
  }
  async function hardDeleteOne(id: string, name: string) {
    if (!confirm(`حذف دائمی «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteBlogTagsAction([id]);
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
  async function load() {
    const res = await adminListBlogTagsAction();
    if (res.ok) setItems(res.items as Tag[]);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">برچسب مقالات</h1>
        <AdminBulkBar
          count={selected.length}
          total={items.length}
          onSelectAll={() => toggleSelectAll(items.map((x) => x.id))}
          busy={bulkBusy}
          onArchive={() => void runBulkArchive()}
          onHardDelete={() => void runBulkHardDelete()}
          onClear={() => setSelected([])}
        />

        <Link
          href="/admin/blog/tags/new"
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm"
        >
          افزودن برچسب
        </Link>
      </div>
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
            {items.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-medium"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} /><span>{t.name}</span></label> <button type="button" className="text-muted-foreground text-xs" onClick={() => void archiveOne(t.id, t.name)}>آرشیو</button> <button type="button" className="text-destructive text-xs" onClick={() => void hardDeleteOne(t.id, t.name)}>حذف دائمی</button></td>
                <td className="text-muted-foreground p-3 font-mono text-xs">{t.slug}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className="border rounded-lg px-2 py-1 text-xs"
                    onClick={() =>
                      void adminToggleBlogTagAction(t.id, !t.is_active).then(load)
                    }
                  >
                    {t.is_active ? "فعال" : "غیرفعال"}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={3} className="text-muted-foreground p-6 text-center">
                  برچسبی نیست
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground text-xs">صفحات برچسب بلاگ همیشه noindex.</p>
    </div>
  );
}
