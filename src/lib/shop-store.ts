"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShopProduct = {
  id: string;
  title: string;
  price: number;
  image?: string;
  brand?: string;
  category?: string;
  color?: string;
  href?: string;
};

type ShopState = {
  cart: ShopProduct[];
  wishlist: ShopProduct[];
  compare: ShopProduct[];
  recentlyViewed: ShopProduct[];
  addToCart: (p: ShopProduct) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (p: ShopProduct) => void;
  toggleCompare: (p: ShopProduct) => void;
  addRecentlyViewed: (p: ShopProduct) => void;
  clearCart: () => void;
  counts: () => {
    cart: number;
    wishlist: number;
    compare: number;
    recentlyViewed: number;
  };
};

const MAX_RECENT = 20;
const MAX_COMPARE = 4;

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      compare: [],
      recentlyViewed: [],

      addToCart: (p) =>
        set((s) => {
          if (s.cart.some((x) => x.id === p.id)) return s;
          return { cart: [p, ...s.cart] };
        }),

      removeFromCart: (id) =>
        set((s) => ({ cart: s.cart.filter((x) => x.id !== id) })),

      toggleWishlist: (p) =>
        set((s) => {
          const exists = s.wishlist.some((x) => x.id === p.id);
          return {
            wishlist: exists
              ? s.wishlist.filter((x) => x.id !== p.id)
              : [p, ...s.wishlist],
          };
        }),

      toggleCompare: (p) =>
        set((s) => {
          const exists = s.compare.some((x) => x.id === p.id);
          if (exists) {
            return { compare: s.compare.filter((x) => x.id !== p.id) };
          }
          if (s.compare.length >= MAX_COMPARE) {
            return { compare: [p, ...s.compare.slice(0, MAX_COMPARE - 1)] };
          }
          return { compare: [p, ...s.compare] };
        }),

      addRecentlyViewed: (p) =>
        set((s) => {
          const rest = s.recentlyViewed.filter((x) => x.id !== p.id);
          return {
            recentlyViewed: [p, ...rest].slice(0, MAX_RECENT),
          };
        }),

      clearCart: () => set({ cart: [] }),

      counts: () => {
        const s = get();
        return {
          cart: s.cart.length,
          wishlist: s.wishlist.length,
          compare: s.compare.length,
          recentlyViewed: s.recentlyViewed.length,
        };
      },
    }),
    { name: "pm-shop-store-v1" }
  )
);
