"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
import { AdminBulkBar } from "@/components/admin/bulk-bar";
import {
  adminArchiveProductsAction,
  adminHardDeleteProductsAction,
} from "@/app/admin/actions/lifecycle";
  adminListProductsAction,
  adminUpdateProductFlagsAction,
  adminSoftDeleteProductAction,
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
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  async function runBulkArchive() {
    if (!selected.length) return;
    if (!confirm("آرشیو موارد انتخاب‌شده؟")) return;
    setBulkBusy(true);
    const res = await adminArchiveProductsAction(selected);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    setSelected([]);
    void load();
  }
  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await adminHardDeleteProductsAction(selected);
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
    const res = await adminArchiveProductsAction([id]);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    void load();
  }
  async function hardDeleteOne(id: string, name: string) {
    if (!confirm(`حذف دائمی «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteProductsAction([id]);
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
    setError(null);
    const res = await adminListProductsAction(100, {
      q: q.trim() || undefined,
      status: statusFilter || undefined,
    });
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
  }, [q, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(
    id: string,
    flags: Parameters<typeof adminUpdateProductFlagsAction>[1],
  ) {
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

  async function softDelete(id: string, name: string) {
    if (!confirm(`«${name}» حذف شود؟ (حذف نرم — قابل بازیابی از دیتابیس)`)) {
      return;
    }
    setBusyId(id);
    const res = await adminSoftDeleteProductAction(id);
    setBusyId(null);
    if (!res.ok) {
      setError("حذف ناموفق بود");
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="bg-background min-h-screen p-6" dir="rtl">
      <div className="w-full max-w-none space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">محصولات</h1>
            <p className="text-muted-foreground text-sm">
              مدیریت کاتالوگ — وضعیت، فلگ‌ها و حذف نرم
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products/new"
              className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium"
            >
              محصول جدید
            </Link>
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

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو نام یا اسلاگ…"
            className="border-input bg-background h-10 min-w-[200px] flex-1 rounded-xl border px-3 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-input bg-background h-10 rounded-xl border px-3 text-sm"
          >
            <option value="">همه وضعیت‌ها</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_FA[s]}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <AdminBulkBar
          count={selected.length}
          busy={bulkBusy}
          onArchive={() => void runBulkArchive()}
          onHardDelete={() => void runBulkHardDelete()}
          onClear={() => setSelected([])}
        />


        {loading ? (
          <div className="flex justify-center py-16">
            <LumaSpin />
          </div>
        ) : items.length === 0 ? (
          <div className="border-border rounded-2xl border py-16 text-center">
            <p className="text-muted-foreground text-sm">محصولی یافت نشد.</p>
            <Link
              href="/admin/products/new"
              className="text-primary mt-3 inline-block text-sm hover:underline"
            >
              افزودن اولین محصول
            </Link>
          </div>
        ) : (
          <div className="table-scroll border-border overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">نام</th>
                  <th className="p-3 font-medium">دسته / برند</th>
                  <th className="p-3 font-medium">وضعیت</th>
                  <th className="p-3 font-medium">شگفت‌انگیز</th>
                  <th className="p-3 font-medium">جدید</th>
                  <th className="p-3 font-medium">پرفروش</th>
                  <th className="p-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-border border-t">
                    <td className="p-3">
                      <div className="font-medium"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /><span>{p.name}</span></label> <button type="button" className="text-muted-foreground text-xs" onClick={() => void archiveOne(p.id, p.name)}>آرشیو</button> <button type="button" className="text-destructive text-xs" onClick={() => void hardDeleteOne(p.id, p.name)}>حذف دائمی</button></div>
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
                          void patch(p.id, {
                            status: e.target.value as
                              | "draft"
                              | "published"
                              | "archived",
                          })
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
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-primary text-xs hover:underline"
                        >
                          ویرایش
                        </Link>
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="text-muted-foreground text-xs hover:underline"
                        >
                          مشاهده
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => void softDelete(p.id, p.name)}
                          className="text-destructive text-xs hover:underline disabled:opacity-50"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
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
