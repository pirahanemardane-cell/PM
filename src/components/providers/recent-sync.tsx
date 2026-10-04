"use client";

import { useCallback, useEffect } from "react";
import { getLiveRecentlyViewedAction } from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

const LS_KEY = "pm-recently-viewed";

export function RecentSync() {
  const sync = useCallback(async () => {
    try {
      const store = useShopStore.getState().recentlyViewed || [];
      let ids = store.map((x) => x.id).filter(Boolean);
      if (!ids.length) {
        try {
          const raw = localStorage.getItem(LS_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) {
            ids = parsed
              .map((x: { id?: string }) => x.id)
              .filter(Boolean) as string[];
          }
        } catch {}
      }
      if (!ids.length) return;
      const res = await getLiveRecentlyViewedAction(ids);
      if (!res.ok) return;
      const next = res.items.map((x) => ({
        id: x.id,
        title: x.title,
        price: x.price,
        image: x.image,
        brand: x.brand,
        href: x.href,
      }));
      useShopStore.setState({ recentlyViewed: next });
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {}
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void sync();
  }, [sync]);

  useRtEvent(RT.catalog, () => {
    void sync();
  });

  return null;
}
