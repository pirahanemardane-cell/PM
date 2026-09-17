"use client";

import { Heart, GitCompareArrows, ShoppingCart, Eye } from "lucide-react";
import { useShopStore, type ShopProduct } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toaster";

export function ProductActions({
  product,
  className,
}: {
  product: ShopProduct;
  className?: string;
}) {
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const toggleCompare = useShopStore((s) => s.toggleCompare);
  const addRecentlyViewed = useShopStore((s) => s.addRecentlyViewed);
  const wishlist = useShopStore((s) => s.wishlist);
  const compare = useShopStore((s) => s.compare);

  const liked = wishlist.some((x) => x.id === product.id);
  const inCompare = compare.some((x) => x.id === product.id);

  return (
    <div className={cn("flex items-center gap-2", className)} dir="rtl">
      <button
        type="button"
        className="bg-primary text-primary-foreground inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs"
        onClick={() => {
          addToCart(product);
          try {
            showToast({ title: "سبد خرید", description: "به سبد اضافه شد", type: "success" });
          } catch {}
        }}
      >
        <ShoppingCart className="h-4 w-4" />
        سبد
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
          liked ? "border-primary text-primary" : "border-border"
        )}
        onClick={() => {
          toggleWishlist(product);
          try {
            showToast({
              title: liked ? "حذف از علاقه‌مندی" : "علاقه‌مندی",
              description: product.title,
              type: "success",
            });
          } catch {}
        }}
        aria-label="لایک"
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
          inCompare ? "border-primary text-primary" : "border-border"
        )}
        onClick={() => {
          toggleCompare(product);
          try {
            showToast({
              title: "مقایسه",
              description: inCompare ? "حذف شد" : "اضافه شد",
              type: "success",
            });
          } catch {}
        }}
        aria-label="مقایسه"
      >
        <GitCompareArrows className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="border-border inline-flex h-9 w-9 items-center justify-center rounded-lg border"
        onClick={() => addRecentlyViewed(product)}
        aria-label="ثبت بازدید"
      >
        <Eye className="h-4 w-4" />
      </button>
    </div>
  );
}
