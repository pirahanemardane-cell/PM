"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListBrandsAction,
  adminUpdateBrandAction,
} from "@/app/admin/actions/taxonomy";

type Brand = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function AdminBrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await adminListBrandsAction();
    setLoading(false);
    if (!res.ok) {
      setErr("خطا یا نیاز به ورود");
      return;
    }
    setItems(res.items as Brand[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleActive(b: Brand) {
    const res = await adminUpdateBrandAction(b.id, { is_active: !b.is_active });
    if (res.ok) void load();
  }

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">برندها</h1>
        <Link
          href="/admin/brands/new"
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm"
        >
          افزودن برند
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
                <th className="p-3 text-right">فعال</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-border border-t">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="text-muted-foreground p-3 font-mono text-xs">
                    {b.slug}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void toggleActive(b)}
                      className="border-border rounded-lg border px-2 py-1 text-xs"
                    >
                      {b.is_active ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={3} className="text-muted-foreground p-6 text-center">
                    برندی نیست
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
