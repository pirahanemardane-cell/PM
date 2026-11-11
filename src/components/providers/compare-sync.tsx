"use client";

import { useCallback, useEffect } from "react";
import { getCompareProductsAction } from "@/app/(shop)/actions/compare";
import { useShopStore } from "@/lib/shop-store";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

export function CompareSync() {
  const sync = useCallback(async () => {
    try {
      const list = useShopStore.getState().compare || [];
      if (!list.length) return;
      const ids = list.map((x) => x.id).filter(Boolean);
      const res = await getCompareProductsAction(ids);
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
          category: x.category,
          href: x.href,
          colors: x.colors,
          sizes: x.sizes,
          attrs: x.attrs,
        }));
      const prev = useShopStore.getState().compare;
      const same =
        prev.length === next.length &&
        prev.every((p, i) => {
          const n = next[i];
          if (!n) return false;
          return (
            p.id === n.id &&
            p.price === n.price &&
            p.title === n.title &&
            (p.image || "") === (n.image || "") &&
            (p.category || "") === (n.category || "") &&
            JSON.stringify(p.colors || []) === JSON.stringify(n.colors || []) &&
            JSON.stringify(p.sizes || []) === JSON.stringify(n.sizes || []) &&
            JSON.stringify((p as { attrs?: unknown }).attrs || []) ===
              JSON.stringify(n.attrs || [])
          );
        });
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
