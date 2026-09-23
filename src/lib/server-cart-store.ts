"use client";

import { create } from "zustand";
import { getCartAction } from "@/app/(shop)/actions/shop";

export type ServerCartLine = {
  key: string;
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
  colorHex?: string;
  slug?: string;
};

type ServerCartState = {
  lines: ServerCartLine[];
  loading: boolean;
  hydrated: boolean;
  refresh: () => Promise<void>;
  setLines: (lines: ServerCartLine[]) => void;
  clear: () => void;
};

function mapItems(items: NonNullable<Awaited<ReturnType<typeof getCartAction>>["items"]>): ServerCartLine[] {
  return (items ?? []).map((l) => ({
    key: l.variantId || l.itemId,
    productId: l.productId,
    variantId: l.variantId,
    title: l.title,
    price: l.price,
    quantity: l.quantity,
    image: l.image,
    size: l.size,
    color: l.color,
    colorHex: (l as { colorHex?: string }).colorHex,
    slug: l.slug,
  }));
}

let inflight: Promise<void> | null = null;

export const useServerCartStore = create<ServerCartState>((set) => ({
  lines: [],
  loading: false,
  hydrated: false,
  setLines: (lines) => set({ lines, hydrated: true }),
  clear: () => set({ lines: [], hydrated: true }),
  refresh: async () => {
    if (inflight) return inflight;
    set({ loading: true });
    inflight = (async () => {
      try {
        const res = await getCartAction();
        if (res.ok) set({ lines: mapItems(res.items), hydrated: true });
        else set({ lines: [], hydrated: true });
      } catch (e) {
        console.error("[server-cart refresh]", e);
        set({ lines: [], hydrated: true });
      } finally {
        set({ loading: false });
        inflight = null;
      }
    })();
    return inflight;
  },
}));
