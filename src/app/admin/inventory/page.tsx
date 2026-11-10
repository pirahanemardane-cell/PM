"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListInventoryAction,
  adminUpdateVariantStockAction,
  type InventoryRow,
} from "@/app/admin/actions/inventory";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminListInventoryAction({ q, lowOnly });
    setLoading(false);
    if (!res.ok) {
      setError("بارگذاری موجودی ناموفق");
      return;
    }
    setItems(res.items);
    const d: Record<string, string> = {};
    for (const i of res.items) d[i.id] = String(i.stock_quantity);
    setDrafts(d);
    setError(null);
  }, [q, lowOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(row: InventoryRow) {
    setBusyId(row.id);
    const res = await adminUpdateVariantStockAction(row.id, Number(drafts[row.id] ?? 0), row.is_active);
    setBusyId(null);
    if (!res.ok) {
      setError("ذخیره ناموفق");
      return;
    }
    void load();
  }

  async function toggleActive(row: InventoryRow) {
    setBusyId(row.id);
    await adminUpdateVariantStockAction(row.id, row.stock_quantity, !row.is_active);
    setBusyId(null);
    void load();
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">موجودی سایز و رنگ</h1>
        <p className="text-muted-foreground text-sm">
          موجودی واقعی واریانت‌ها — همان اعدادی که روی صفحه محصول به خریدار نشان داده می‌شود.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          placeholder="جستجو نام / SKU / سایز / رنگ"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          فقط کمبود موجودی
        </label>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <LumaSpin />
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3 text-right font-medium">محصول</th>
                <th className="p-3 text-right font-medium">سایز</th>
                <th className="p-3 text-right font-medium">رنگ</th>
                <th className="p-3 text-right font-medium">SKU</th>
                <th className="p-3 text-right font-medium">موجودی</th>
                <th className="p-3 text-right font-medium">فعال</th>
                <th className="p-3 text-right font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground p-6 text-center">
                    واریانتی یافت نشد
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-border border-t">
                    <td className="p-3">
                      <Link href={`/products/${row.product_slug}`} className="hover:underline">
                        {row.product_name}
                      </Link>
                    </td>
                    <td className="p-3">{row.size || "—"}</td>
                    <td className="p-3">{row.color_name || "—"}</td>
                    <td className="p-3 font-mono text-xs" dir="ltr">
                      {row.sku || "—"}
                    </td>
                    <td className="p-3">
                      <input
                        className="border-input bg-background w-20 rounded border px-2 py-1"
                        value={drafts[row.id] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
                      />
                      <span className="text-muted-foreground mr-1 text-xs">
                        ({toPersianDigits(String(row.stock_quantity))})
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        className="text-xs underline"
                        onClick={() => void toggleActive(row)}
                      >
                        {row.is_active ? "فعال" : "غیرفعال"}
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        className="bg-primary text-primary-foreground rounded-lg px-3 py-1 text-xs disabled:opacity-50"
                        onClick={() => void save(row)}
                      >
                        ذخیره
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
