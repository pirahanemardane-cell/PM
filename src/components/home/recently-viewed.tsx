"use client";

import { useEffect, useState } from "react";
import {
  CarouselCards,
  type CarouselCardItem,
} from "@/components/ui/carousel-cards";

type StoredItem = {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  image?: string;
  imageUrl?: string;
  price?: number;
  brand?: string;
  href?: string;
};

export function RecentlyViewed() {
  const [items, setItems] = useState<CarouselCardItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pm-recently-viewed");
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      setItems(
        parsed
          .map((x, i) => {
            const title = (x.title || x.name || "").trim();
            const href =
              x.href ||
              (x.slug ? `/products/${x.slug}` : x.id ? `/products/${x.id}` : "");
            if (!title || !href) return null;
            return {
              id: x.id || x.slug || String(i),
              title,
              brand: x.brand,
              href,
              imageUrl: x.imageUrl || x.image || "/og-image.webp",
              price: typeof x.price === "number" ? x.price : 0,
            } satisfies CarouselCardItem;
          })
          .filter((x): x is CarouselCardItem => x != null),
      );
    } catch {
      // ignore
    }
  }, []);

  if (items.length === 0) {
    return (
      <section aria-label="آخرین بازدیدها" className="space-y-3">
        <h2 className="text-xl font-bold text-primary md:text-2xl">
          آخرین بازدیدها
        </h2>
        <p className="text-muted-foreground text-sm">
          هنوز محصولی ندیده‌اید. از فروشگاه شروع کنید.
        </p>
      </section>
    );
  }

  return (
    <CarouselCards title="آخرین بازدیدها" items={items} slidesToShow={4} />
  );
}
