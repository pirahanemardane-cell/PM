"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  addComplementToCartAction,
  listProductComplementsAction,
  type ComplementDTO,
} from "@/app/(shop)/actions/complements";
import { Price } from "@/components/ui/price";
import { useServerCartStore } from "@/lib/server-cart-store";
import { toast } from "@/lib/toaster";
import { mapCartError } from "@/lib/cart-errors";

export function ProductComplements({ productId }: { productId: string }) {
  const [items, setItems] = useState<ComplementDTO[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const refresh = useServerCartStore((s) => s.refresh);

  useEffect(() => {
    void (async () => {
      const res = await listProductComplementsAction(productId);
      if (res.ok) setItems(res.items);
    })();
  }, [productId]);

  if (!items.length) return null;

  async function onAdd(c: ComplementDTO) {
    setBusyId(c.id);
    try {
      const res = await addComplementToCartAction({ complementRowId: c.id });
      if (!res.ok) {
        toast.error(mapCartError(res.error) || "افزودن ناموفق");
        return;
      }
      toast.success(c.is_bundle && c.bundle_price ? "باندل به سبد اضافه شد" : "به سبد اضافه شد");
      void refresh();
    } catch {
      toast.error("خطا در افزودن");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3 border-t pt-8" dir="rtl">
      <h2 className="text-lg font-bold text-primary">مکمل‌های پیشنهادی</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div
            key={c.id}
            className="border-border flex flex-col gap-2 rounded-xl border p-3"
          >
            <Link
              href={`/محصولات/${c.product.slug}`}
              className="hover:border-primary/40 flex flex-1 gap-3 transition-colors"
            >
              {c.product.image ? (
                <span className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={c.product.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </span>
              ) : null}
              <span className="min-w-0">
                <p className="text-muted-foreground text-[11px]">
                  {c.label || (c.is_bundle ? "باندل" : "مکمل")}
                </p>
                <p className="font-medium">{c.product.name}</p>
                <Price amount={c.product.price} className="mt-1 text-sm" />
              </span>
            </Link>
            <button
              type="button"
              disabled={busyId === c.id || !c.product.defaultVariantId}
              onClick={() => void onAdd(c)}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              {busyId === c.id
                ? "…"
                : c.is_bundle && c.bundle_price
                  ? "افزودن باندل به سبد"
                  : "افزودن به سبد"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/** نوار پیشنهاد مکمل در صفحه سبد */
export function CartComplementStrip({ productIds }: { productIds: string[] }) {
  const [items, setItems] = useState<ComplementDTO[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const refresh = useServerCartStore((s) => s.refresh);

  useEffect(() => {
    if (!productIds.length) {
      setItems([]);
      return;
    }
    void (async () => {
      const { listCartComplementSuggestionsAction } = await import(
        "@/app/(shop)/actions/complements"
      );
      const res = await listCartComplementSuggestionsAction(productIds);
      if (res.ok) setItems(res.items);
    })();
  }, [productIds.join(",")]);

  if (!items.length) return null;

  return (
    <section className="border-border mt-6 space-y-3 rounded-xl border p-4" dir="rtl">
      <h2 className="text-sm font-bold">پیشنهاد مکمل برای سبد شما</h2>
      <ul className="space-y-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <div className="min-w-0">
              <Link href={`/محصولات/${c.product.slug}`} className="font-medium underline">
                {c.product.name}
              </Link>
              <p className="text-muted-foreground text-xs">
                {c.label || (c.is_bundle ? "باندل" : "مکمل")} ·{" "}
                <Price amount={c.product.price} size="sm" />
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === c.id || !c.product.defaultVariantId}
              className="border-border rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
              onClick={async () => {
                setBusyId(c.id);
                const res = await addComplementToCartAction({ complementRowId: c.id });
                setBusyId(null);
                if (!res.ok) {
                  toast.error(mapCartError(res.error) || "افزودن ناموفق");
                  return;
                }
                toast.success("به سبد اضافه شد");
                void refresh();
              }}
            >
              {busyId === c.id ? "…" : "افزودن"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
