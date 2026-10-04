"use client";

import { useEffect, useState } from "react";
import { CarouselCards } from "@/components/ui/carousel-cards";
import type { CarouselCardItem } from "@/lib/product-to-carousel-item";
import { getLiveRecentlyViewedAction } from "@/app/(shop)/actions/shop";
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
  const [ready, setReady] = useState(false);
  const pruneStore = useShopStore((s) => s.recentlyViewed);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        const parsed = raw ? (JSON.parse(raw) as StoredItem[]) : [];
        const fromLs = Array.isArray(parsed) ? parsed : [];
        const storeItems = useShopStore.getState().recentlyViewed || [];
        const byId = new Map<string, StoredItem>();
        // store اول (تازه‌تر)، بعد LS
        for (const x of [...storeItems, ...fromLs]) {
          const id = (x as StoredItem).id;
          if (!id) continue;
          if (!byId.has(id)) byId.set(id, x as StoredItem);
        }
        const ordered = [...byId.values()];
        if (!ordered.length) {
          if (!cancelled) {
            setItems([]);
            setReady(true);
          }
          return;
        }

        const ids = ordered.map((x) => x.id!).filter(Boolean);
        // سرور واقعی: فقط محصولات published و حذف‌نشده + قیمت/عکس/نام فعلی
        const res = await getLiveRecentlyViewedAction(ids);
        if (cancelled) return;

        if (!res.ok) {
          // اگر سرور خطا داد، چیزی نشان نده (نه دموی قدیمی)
          setItems([]);
          setReady(true);
          return;
        }

        const liveItems = res.items;
        const liveIds = new Set(liveItems.map((x) => x.id));

        // پاک کردن حذف‌شده‌ها از localStorage و zustand
        const keptForStore = ordered
          .filter((x) => x.id && liveIds.has(x.id))
          .map((x) => {
            const live = liveItems.find((l) => l.id === x.id);
            return {
              id: x.id!,
              title: live?.title ?? x.title ?? x.name ?? "محصول",
              price: live?.price ?? (typeof x.price === "number" ? x.price : 0),
              image: live?.image ?? x.imageUrl ?? x.image,
              brand: live?.brand ?? x.brand,
              href: live?.href ?? x.href,
            };
          });

        try {
          localStorage.setItem(LS_KEY, JSON.stringify(keptForStore));
        } catch {}
        useShopStore.setState({
          recentlyViewed: keptForStore.map((k) => ({
            id: k.id,
            title: k.title,
            price: k.price,
            image: k.image,
            brand: k.brand,
            href: k.href,
          })),
        });

        setItems(
          liveItems.map((x) => ({
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
        if (!cancelled) {
          setItems([]);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pruneStore]);

  if (!ready) {
    return null;
  }

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
