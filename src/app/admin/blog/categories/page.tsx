"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListBlogCategoriesAction,
  adminToggleBlogCategoryAction,
} from "@/app/admin/actions/blog";

type Cat = { id: string; name: string; slug: string; is_active: boolean };

export default function AdminBlogCategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);

  async function load() {
    const res = await adminListBlogCategoriesAction();
    if (res.ok) setItems(res.items as Cat[]);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">دسته‌بندی مقالات</h1>
        <Link
          href="/admin/blog/categories/new"
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm"
        >
          افزودن دسته
        </Link>
      </div>
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
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="text-muted-foreground p-3 font-mono text-xs">
                  {c.slug}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    className="border rounded-lg px-2 py-1 text-xs"
                    onClick={() =>
                      void adminToggleBlogCategoryAction(c.id, !c.is_active).then(
                        load,
                      )
                    }
                  >
                    {c.is_active ? "فعال" : "غیرفعال"}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={3} className="text-muted-foreground p-6 text-center">
                  دسته‌ای نیست
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
