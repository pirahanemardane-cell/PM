"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { slug: string; name: string };

export function RecentlyViewed() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pm-recently-viewed");
      if (raw) setItems(JSON.parse(raw) as Item[]);
    } catch {
      // ignore
    }
  }, []);

  if (items.length === 0) {
    return (
      <section aria-label="آخرین بازدیدها" className="space-y-3">
        <h2 className="text-xl font-bold md:text-2xl">آخرین بازدیدها</h2>
        <p className="text-muted-foreground text-sm">
          هنوز محصولی ندیده‌اید. از فروشگاه شروع کنید.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="آخرین بازدیدها" className="space-y-5">
      <h2 className="text-xl font-bold md:text-2xl">آخرین بازدیدها</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${item.slug}`}
            className="bg-card hover:bg-muted/40 w-40 shrink-0 rounded-xl border p-3 text-sm"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
