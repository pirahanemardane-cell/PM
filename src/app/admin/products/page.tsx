"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListProductsAction,
  adminUpdateProductFlagsAction,
} from "@/app/admin/actions/products";
import { LumaSpin } from "@/components/ui/luma-spin";

const STATUSES = ["draft", "published", "archived"] as const;

const STATUS_FA: Record<string, string> = {
  draft: "پیش‌نویس",
  published: "منتشر",
  archived: "بایگانی",
};

type Row = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  created_at: string;
  brand?: { name: string } | null;
  category?: { name: string } | null;
};

export default function AdminProductsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListProductsAction(80);
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, flags: Parameters<typeof adminUpdateProductFlagsAction>[1]) {
    setBusyId(id);
    const res = await adminUpdateProductFlagsAction(id, flags);
    setBusyId(null);
    if (!res.ok) {
      setError("ذخیره ناموفق بود");
      return;
    }
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...flags } : p)),
    );
  }

  return (
    <div className="bg-background min-h-screen p-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">محصولات</h1>
            <p className="text-muted-foreground text-sm">
              وضعیت و فلگ‌های نمایش — فاز ۱
            </p>
          </div>
          <div className="flex gap-2">
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
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            محصولی یافت نشد.
          </p>
        ) : (
          <div className="border-border overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[800px] text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">نام</th>
                  <th className="p-3 font-medium">دسته / برند</th>
                  <th className="p-3 font-medium">وضعیت</th>
                  <th className="p-3 font-medium">شگفت‌انگیز</th>
                  <th className="p-3 font-medium">جدید</th>
                  <th className="p-3 font-medium">عملیات</th>
                  <th className="p-3 font-medium">پرفروش</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-border border-t">
                    <td className="p-3">
                      <div className="font-medium">{p.name}</div>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-primary mt-1 inline-block text-xs hover:underline"
                      >
                        ویرایش
                      </Link>
                      <div className="text-muted-foreground font-mono text-xs">
                        {p.slug}
                      </div>
                    </td>
                    <td className="text-muted-foreground p-3 text-xs">
                      {p.category?.name ?? "—"} / {p.brand?.name ?? "—"}
                    </td>
                    <td className="p-3">
                      <select
                        value={p.status}
                        disabled={busyId === p.id}
                        onChange={(e) =>
                          void patch(p.id, { status: e.target.value })
                        }
                        className="border-input bg-background h-9 rounded-lg border px-2 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_FA[s] ?? s}
                          </option>
                        ))}
                      </select>
                    </td>
                    {(
                      [
                        ["is_featured", p.is_featured],
                        ["is_new", p.is_new],
                        ["is_bestseller", p.is_bestseller],
                      ] as const
                    ).map(([key, val]) => (
                      <td key={key} className="p-3">
                        <input
                          type="checkbox"
                          checked={!!val}
                          disabled={busyId === p.id}
                          onChange={(e) =>
                            void patch(p.id, { [key]: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
