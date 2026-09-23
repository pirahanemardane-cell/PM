"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListBlogTagsAction,
  adminToggleBlogTagAction,
} from "@/app/admin/actions/tags";

type Tag = { id: string; name: string; slug: string; is_active: boolean };

export default function AdminBlogTagsPage() {
  const [items, setItems] = useState<Tag[]>([]);

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
        <h1 className="text-2xl font-bold">برچسب مقالات</h1>
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
                <td className="p-3 font-medium">{t.name}</td>
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
