"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListBlogPostsAction,
  adminSetBlogPostStatusAction,
} from "@/app/admin/actions/blog";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  category?: { name: string } | null;
};

const STATUS_FA: Record<string, string> = {
  draft: "پیش‌نویس",
  published: "منتشر",
  archived: "بایگانی",
};

export default function AdminBlogPostsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    const res = await adminListBlogPostsAction();
    if (!res.ok) setErr("خطا یا نیاز به ورود ادمین");
    else setItems(res.items as Row[]);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">مقالات بلاگ</h1>
        <Link
          href="/admin/blog/new"
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm"
        >
          افزودن مقاله
        </Link>
      </div>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-right">عنوان</th>
              <th className="p-3 text-right">دسته</th>
              <th className="p-3 text-right">وضعیت</th>
              <th className="p-3 text-right">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="text-muted-foreground p-3">
                  {p.category?.name ?? "—"}
                </td>
                <td className="p-3">
                  <select
                    className="border rounded-lg px-2 py-1 text-xs"
                    value={p.status}
                    onChange={(e) =>
                      void adminSetBlogPostStatusAction(
                        p.id,
                        e.target.value as "draft" | "published" | "archived",
                      ).then(load)
                    }
                  >
                    {(["draft", "published", "archived"] as const).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_FA[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="text-muted-foreground p-3 text-xs">
                  {new Date(p.created_at).toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground p-6 text-center">
                  مقاله‌ای نیست
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
