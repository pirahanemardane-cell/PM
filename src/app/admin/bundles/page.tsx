"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminAddComplementAction,
  adminDeleteComplementAction,
  adminListComplementsAction,
  adminSearchProductsForBundleAction,
  type ComplementAdminRow,
} from "@/app/admin/actions/bundles";
import { LumaSpin } from "@/components/ui/luma-spin";

type Hit = { id: string; name: string; slug: string };

export default function AdminBundlesPage() {
  const [items, setItems] = useState<ComplementAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productQ, setProductQ] = useState("");
  const [compQ, setCompQ] = useState("");
  const [productHits, setProductHits] = useState<Hit[]>([]);
  const [compHits, setCompHits] = useState<Hit[]>([]);
  const [productId, setProductId] = useState<Hit | null>(null);
  const [compId, setCompId] = useState<Hit | null>(null);
  const [label, setLabel] = useState("");
  const [isBundle, setIsBundle] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminListComplementsAction();
    setLoading(false);
    if (!res.ok) {
      setError("بارگذاری ناموفق — مایگریشن ۰۶۷ را اعمال کنید");
      return;
    }
    setItems(res.items);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (productQ.trim().length < 1) {
        setProductHits([]);
        return;
      }
      const res = await adminSearchProductsForBundleAction(productQ);
      if (res.ok) setProductHits(res.items);
    }, 250);
    return () => clearTimeout(t);
  }, [productQ]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (compQ.trim().length < 1) {
        setCompHits([]);
        return;
      }
      const res = await adminSearchProductsForBundleAction(compQ);
      if (res.ok) setCompHits(res.items);
    }, 250);
    return () => clearTimeout(t);
  }, [compQ]);

  async function onAdd() {
    if (!productId || !compId) {
      setError("محصول اصلی و مکمل را انتخاب کنید");
      return;
    }
    setBusy(true);
    const res = await adminAddComplementAction({
      productId: productId.id,
      complementProductId: compId.id,
      label,
      isBundle,
    });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error === "duplicate"
          ? "قبلاً ثبت شده"
          : res.error === "same_product"
            ? "نمی‌توان همان محصول را مکمل کرد"
            : "خطا در ثبت",
      );
      return;
    }
    setLabel("");
    setProductId(null);
    setCompId(null);
    setProductQ("");
    setCompQ("");
    void load();
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">مکمل‌ها و باندل</h1>
        <p className="text-muted-foreground text-sm">
          کراوات، دکمه سردست و سایر مکمل‌ها را به پیراهن وصل کنید — روی PDP نمایش داده می‌شود.
        </p>
      </div>

      <div className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">محصول اصلی</label>
          <input
            className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
            value={productQ}
            onChange={(e) => {
              setProductQ(e.target.value);
              setProductId(null);
            }}
            placeholder="جستجو…"
          />
          {productId ? (
            <p className="text-xs text-emerald-700">انتخاب: {productId.name}</p>
          ) : (
            <ul className="max-h-32 overflow-auto text-xs">
              {productHits.map((h) => (
                <li key={h.id}>
                  <button type="button" className="hover:underline" onClick={() => { setProductId(h); setProductQ(h.name); }}>
                    {h.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">مکمل / باندل</label>
          <input
            className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
            value={compQ}
            onChange={(e) => {
              setCompQ(e.target.value);
              setCompId(null);
            }}
            placeholder="جستجو…"
          />
          {compId ? (
            <p className="text-xs text-emerald-700">انتخاب: {compId.name}</p>
          ) : (
            <ul className="max-h-32 overflow-auto text-xs">
              {compHits.map((h) => (
                <li key={h.id}>
                  <button type="button" className="hover:underline" onClick={() => { setCompId(h); setCompQ(h.name); }}>
                    {h.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          className="border-input bg-background rounded-lg border px-3 py-2 text-sm md:col-span-2"
          placeholder="برچسب (مثلاً کراوات پیشنهادی)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isBundle} onChange={(e) => setIsBundle(e.target.checked)} />
          باندل (قیمت ویژه اختیاری بعداً)
        </label>
        <button
          type="button"
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          onClick={() => void onAdd()}
        >
          افزودن
        </button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <LumaSpin />
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3 text-right">محصول</th>
                <th className="p-3 text-right">مکمل</th>
                <th className="p-3 text-right">برچسب</th>
                <th className="p-3 text-right">باندل</th>
                <th className="p-3 text-right">حذف</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground p-6 text-center">
                    هنوز مکملی ثبت نشده
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-border border-t">
                    <td className="p-3">
                      <Link href={`/products/${row.product?.slug || ""}`} className="hover:underline">
                        {row.product?.name || row.product_id}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Link href={`/products/${row.complement?.slug || ""}`} className="hover:underline">
                        {row.complement?.name || row.complement_product_id}
                      </Link>
                    </td>
                    <td className="p-3">{row.label || "—"}</td>
                    <td className="p-3">{row.is_bundle ? "بله" : "خیر"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="text-destructive text-xs underline"
                        onClick={async () => {
                          await adminDeleteComplementAction(row.id);
                          void load();
                        }}
                      >
                        حذف
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
