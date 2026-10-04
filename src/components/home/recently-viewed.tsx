"use client";

import { useCallback, useEffect, useState } from "react";
import { CarouselCards } from "@/components/ui/carousel-cards";
import type { CarouselCardItem } from "@/lib/product-to-carousel-item";
import { getLiveRecentlyViewedAction } from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

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

function collectIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredItem[]) : [];
    const fromLs = Array.isArray(parsed) ? parsed : [];
    const storeItems = useShopStore.getState().recentlyViewed || [];
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const x of [...storeItems, ...fromLs]) {
      const id = (x as StoredItem).id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    return ids;
  } catch {
    return (useShopStore.getState().recentlyViewed || [])
      .map((x) => x.id)
      .filter(Boolean);
  }
}

export function RecentlyViewed() {
  const [items, setItems] = useState<CarouselCardItem[]>([]);
  const [ready, setReady] = useState(false);
  const storeLen = useShopStore((s) => s.recentlyViewed.length);

  const refresh = useCallback(async () => {
    try {
      const ids = collectIds();
      if (!ids.length) {
        setItems([]);
        setReady(true);
        return;
      }
      const res = await getLiveRecentlyViewedAction(ids);
      if (!res.ok) {
        setItems([]);
        setReady(true);
        return;
      }
      const live = res.items;
      const kept = live.map((x) => ({
        id: x.id,
        title: x.title,
        price: x.price,
        image: x.image,
        brand: x.brand,
        href: x.href,
      }));
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(kept));
      } catch {}
      useShopStore.setState({ recentlyViewed: kept });
      setItems(
        live.map((x) => ({
          id: x.id,
          title: x.title,
          brand: x.brand,
          href: x.href,
          imageUrl: x.image || "/og-image.webp",
          price: x.price,
        })),
      );
      setReady(true);
    } catch {
      setItems([]);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, storeLen]);

  useRtEvent(RT.catalog, () => {
    void refresh();
  });

  if (!ready) return null;

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
