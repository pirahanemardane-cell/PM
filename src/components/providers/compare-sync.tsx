"use client";

import { useCallback, useEffect } from "react";
import { getLiveRecentlyViewedAction } from "@/app/(shop)/actions/shop";
import { useShopStore } from "@/lib/shop-store";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

export function CompareSync() {
  const sync = useCallback(async () => {
    try {
      const list = useShopStore.getState().compare || [];
      if (!list.length) return;
      const ids = list.map((x) => x.id).filter(Boolean);
      const res = await getLiveRecentlyViewedAction(ids);
      if (!res.ok) return;
      const byId = new Map(res.items.map((x) => [x.id, x]));
      const next = ids
        .map((id) => byId.get(id))
        .filter((x): x is NonNullable<typeof x> => x != null)
        .map((x) => ({
          id: x.id,
          title: x.title,
          price: x.price,
          image: x.image,
          brand: x.brand,
          href: x.href,
        }));
      const prev = useShopStore.getState().compare;
      const same =
        prev.length === next.length &&
        prev.every(
          (p, i) =>
            p.id === next[i]?.id &&
            p.price === next[i]?.price &&
            p.title === next[i]?.title &&
            (p.image || "") === (next[i]?.image || ""),
        );
      if (!same) {
        useShopStore.setState({ compare: next });
      }
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

  const compareLen = useShopStore((s) => s.compare.length);
  useEffect(() => {
    const t = window.setTimeout(() => void sync(), 400);
    return () => window.clearTimeout(t);
  }, [compareLen, sync]);

  return null;
}
