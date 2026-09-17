"use client";
import { Heart, GitCompareArrows, ShoppingCart, Eye } from "lucide-react";
import { useShopStore, type ShopProduct } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

export function ProductActions({ product, className }: { product: ShopProduct; className?: string }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const toggleCompare = useShopStore((s) => s.toggleCompare);
  const addRecentlyViewed = useShopStore((s) => s.addRecentlyViewed);
  const wishlist = useShopStore((s) => s.wishlist);
  const compare = useShopStore((s) => s.compare);
  const liked = wishlist.some((x) => x.id === product.id);
  const inCompare = compare.some((x) => x.id === product.id);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} dir="rtl">
      <button type="button" className="bg-primary text-primary-foreground inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs" onClick={() => addToCart(product)}>
        <ShoppingCart className="h-4 w-4" /> افزودن به سبد
      </button>
      <button type="button" className={cn("inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs", liked ? "border-primary text-primary" : "border-border")} onClick={() => toggleWishlist(product)}>
        <Heart className={cn("h-4 w-4", liked && "fill-current")} /> علاقه‌مندی
      </button>
      <button type="button" className={cn("inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs", inCompare ? "border-primary text-primary" : "border-border")} onClick={() => toggleCompare(product)}>
        <GitCompareArrows className="h-4 w-4" /> مقایسه
      </button>
      <button type="button" className="border-border inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs" onClick={() => addRecentlyViewed(product)}>
        <Eye className="h-4 w-4" /> ثبت بازدید
      </button>
    </div>
  );
}
