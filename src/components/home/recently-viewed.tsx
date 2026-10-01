"use client";

import { useEffect, useState } from "react";
import { CarouselCards } from "@/components/ui/carousel-cards";
import type { CarouselCardItem } from "@/lib/product-to-carousel-item";
import { filterLiveProductIdsAction } from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";

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

const LS_KEY = "pm-recently-viewed";

export function RecentlyViewed() {
  const [items, setItems] = useState<CarouselCardItem[]>([]);
  const pruneStore = useShopStore((s) => s.recentlyViewed);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredItem[]) : [];
        const fromLs = Array.isArray(parsed) ? parsed : [];
        // merge with zustand store (same ids)
        const storeItems = useShopStore.getState().recentlyViewed || [];
        const byId = new Map<string, StoredItem>();
        for (const x of [...fromLs, ...storeItems]) {
          const id = (x as StoredItem).id;
          if (!id) continue;
          if (!byId.has(id)) byId.set(id, x as StoredItem);
        }
        const ordered = [...byId.values()];
        if (!ordered.length) return;

        const ids = ordered.map((x) => x.id!).filter(Boolean);
        const res = await filterLiveProductIdsAction(ids);
        const live = new Set(res.ok ? res.ids : []);

        const kept = ordered.filter((x) => x.id && live.has(x.id));
        // پاک کردن حذف‌شده‌ها از localStorage و store
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(kept));
        } catch {}
        const store = useShopStore.getState();
        if (store.recentlyViewed?.length) {
          const dead = store.recentlyViewed.filter((x) => !live.has(x.id));
          for (const d of dead) {
            // re-add only live via set: replace list
          }
          useShopStore.setState({
            recentlyViewed: store.recentlyViewed.filter((x) => live.has(x.id)),
          });
        }

        if (cancelled) return;
        setItems(
          kept
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
    })();
    return () => {
      cancelled = true;
    };
  }, [pruneStore]);

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
