"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useShopStore } from "@/lib/shop-store";
import { Price } from "@/components/ui/price";

function productHref(p: { href?: string; id: string }) {
  return p.href || `/محصولات`;
}

export function CompareMatrix() {
  const compare = useShopStore((s) => s.compare);
  const toggleCompare = useShopStore((s) => s.toggleCompare);

  const attrRows = useMemo(() => {
    const labels = new Map<string, string>();
    for (const p of compare) {
      for (const a of p.attrs || []) {
        const key = (a.slug || a.label).trim();
        if (!key) continue;
        if (!labels.has(key)) labels.set(key, a.label || key);
      }
    }
    return [...labels.entries()];
  }, [compare]);

  if (!compare.length) {
    return (
      <div className="border-border rounded-xl border p-8 text-center text-sm">
        <p className="text-muted-foreground mb-3">لیست مقایسه خالی است.</p>
        <Link href="/محصولات" className="text-primary underline">
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="border-border overflow-x-auto rounded-xl border" dir="rtl">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="p-3 text-right font-medium">مشخصه</th>
            {compare.map((p) => (
              <th key={p.id} className="p-3 text-right align-top">
                <Link href={productHref(p)} className="font-semibold hover:underline">
                  {p.title}
                </Link>
                <div className="mt-2">
                  <button
                    type="button"
                    className="text-destructive text-xs underline"
                    onClick={() => toggleCompare(p)}
                  >
                    حذف
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-border border-t">
            <td className="text-muted-foreground p-3">قیمت</td>
            {compare.map((p) => (
              <td key={p.id} className="p-3">
                <Price amount={p.price} size="sm" />
              </td>
            ))}
          </tr>
          <tr className="border-border border-t">
            <td className="text-muted-foreground p-3">برند</td>
            {compare.map((p) => (
              <td key={p.id} className="p-3">
                {p.brand || "—"}
              </td>
            ))}
          </tr>
          <tr className="border-border border-t">
            <td className="text-muted-foreground p-3">دسته</td>
            {compare.map((p) => (
              <td key={p.id} className="p-3">
                {p.category || "—"}
              </td>
            ))}
          </tr>
          <tr className="border-border border-t">
            <td className="text-muted-foreground p-3">رنگ‌ها</td>
            {compare.map((p) => (
              <td key={p.id} className="p-3">
                {(p.colors || []).join("، ") || p.color || "—"}
              </td>
            ))}
          </tr>
          <tr className="border-border border-t">
            <td className="text-muted-foreground p-3">سایزها</td>
            {compare.map((p) => (
              <td key={p.id} className="p-3">
                {(p.sizes || []).join("، ") || p.size || "—"}
              </td>
            ))}
          </tr>
          {attrRows.map(([key, label]) => (
            <tr key={key} className="border-border border-t">
              <td className="text-muted-foreground p-3">{label}</td>
              {compare.map((p) => {
                const hit = (p.attrs || []).find(
                  (a) => (a.slug || a.label).trim() === key,
                );
                return (
                  <td key={p.id} className="p-3">
                    {hit?.value || "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-border border-t p-3 text-xs">
        <Link href="/مقایسه" className="text-primary underline">
          صفحه مقایسه کامل
        </Link>
      </div>
    </div>
  );
}
