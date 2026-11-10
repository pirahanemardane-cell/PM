"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProductComplementsAction, type ComplementDTO } from "@/app/(shop)/actions/complements";
import { Price } from "@/components/ui/price";

export function ProductComplements({ productId }: { productId: string }) {
  const [items, setItems] = useState<ComplementDTO[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await listProductComplementsAction(productId);
      if (res.ok) setItems(res.items);
    })();
  }, [productId]);

  if (!items.length) return null;

  return (
    <section className="space-y-3 border-t pt-8" dir="rtl">
      <h2 className="text-lg font-bold text-primary">مکمل‌های پیشنهادی</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/products/${c.product.slug}`}
            className="border-border hover:border-primary/40 rounded-xl border p-3 transition-colors"
          >
            <p className="text-muted-foreground text-[11px]">
              {c.label || (c.is_bundle ? "باندل" : "مکمل")}
            </p>
            <p className="font-medium">{c.product.name}</p>
            <Price amount={c.product.price} className="mt-1 text-sm" />
          </Link>
        ))}
      </div>
    </section>
  );
}
