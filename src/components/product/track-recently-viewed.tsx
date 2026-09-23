"use client";

import { useEffect } from "react";
import { useShopStore, type ShopProduct } from "@/lib/shop-store";

export function TrackRecentlyViewed(props: {
  id: string;
  title: string;
  price: number;
  image?: string;
  brand?: string;
  href?: string;
}) {
  const add = useShopStore((s) => s.addRecentlyViewed);

  useEffect(() => {
    if (!props.id) return;
    const item: ShopProduct = {
      id: props.id,
      title: props.title,
      price: props.price,
      image: props.image,
      brand: props.brand,
      href: props.href || `/products/${props.id}`,
    };
    add(item);
    try {
      const key = "pm-recently-viewed";
      const prev = JSON.parse(localStorage.getItem(key) || "[]") as ShopProduct[];
      const next = [item, ...prev.filter((x) => x.id !== item.id)].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }, [props.id, props.title, props.price, props.image, props.brand, props.href, add]);

  return null;
}
