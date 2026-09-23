"use client";

import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { toast } from "@/lib/toaster";
import { useShopStore } from "@/lib/shop-store";
import { toggleWishlistAction, addToCartAction } from "@/app/(shop)/actions/shop";
import { useServerCartStore } from "@/lib/server-cart-store";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardFooter } from "@/components/ui/card";


import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Heart,
  ArrowLeftRight,
  ShoppingCart,
  Star,
  Loader2,
  Check,
} from "lucide-react";
import { toPersianDigits } from "@/lib/numbers";
import { cn } from "@/lib/utils";

export interface ProductCard1Props {
  variantOptions?: { id: string; size?: string | null; color?: string | null; price?: number }[];
  productId?: string;
  href?: string;
  name?: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  discount?: number;
  freeShipping?: boolean;
  category?: string;
  categoryHref?: string;
  brandHref?: string;
  isSpecialSale?: boolean;
  className?: string;
}

function formatToman(price: number) {
  return toPersianDigits(Math.round(price).toLocaleString("en-US")) + " تومان";
}

export function ProductCard1({
  productId,
  variantOptions = [],
  href,
  name = "محصول",
  price = 0,
  originalPrice,
  rating = 0,
  reviewCount = 0,
  images = [],
  colors = [],
  sizes = [],
  isNew = false,
  isBestSeller = false,
  discount = 0,
  freeShipping = false,
  category,
  categoryHref,
  className,
  brand,
  brandHref,
  isSpecialSale = false,
}: ProductCard1Props) {
  const safeImages =
    images.length > 0 ? images : [];
  const hasImage = safeImages.length > 0;

    const router = useRouter();
  const toggleWishlistStore = useShopStore((s) => s.toggleWishlist);
  const toggleCompareStore = useShopStore((s) => s.toggleCompare);
  const addToCartStore = useShopStore((s) => s.addToCart);
  const refreshServerCart = useServerCartStore((s) => s.refresh);
  const compare = useShopStore((s) => s.compare);
  const wishlist = useShopStore((s) => s.wishlist);
  const isWishlisted = productId
    ? wishlist.some((x) => x.id === productId)
    : false;
  const isCompared = productId
    ? compare.some((x) => x.id === productId)
    : false;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
      const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasImage) return;
    setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasImage) return;
    setCurrentImageIndex(
      (prev) => (prev - 1 + safeImages.length) % safeImages.length
    );
  };

      async function handleAddToCart(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!productId) {
      toast.error("محصول نامعتبر است");
      return;
    }
    if ((sizes?.length ?? 0) > 0 && !selectedSize) {
      toast.error("سایز را انتخاب کنید");
      return;
    }
    // match variant
    const opts = variantOptions ?? [];
    let variantId: string | undefined;
    if (opts.length) {
      const match = opts.find((v) => {
        const sizeOk = !selectedSize || !v.size || v.size === selectedSize;
        const colorOk =
          !selectedColor ||
          !v.color ||
          v.color === selectedColor ||
          v.color?.toLowerCase() === selectedColor?.toLowerCase();
        return sizeOk && colorOk;
      });
      variantId = match?.id ?? opts[0]?.id;
    }
    if (!variantId) {
      toast.error("این ترکیب موجود نیست");
      return;
    }
    setIsAddingToCart(true);
    try {
      // optimistic UI
      addToCartStore({
        id: productId,
        title: name ?? "محصول",
        price: price ?? 0,
        image: (images && images[0]) || undefined,
        href: href,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        colors: colors?.length ? colors : undefined,
        sizes: sizes?.length ? sizes : undefined,
        quantity: 1,
        variantId,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("pm:open-panel", { detail: { tab: "cart" } })
        );
      }
      console.log("addCart", { variantId, selectedSize, selectedColor, optsLen: opts.length });
      const res = await addToCartAction(variantId, 1);
            if (res.ok) {
        void refreshServerCart();
        window.dispatchEvent(new CustomEvent("pm:cart-changed"));
      }
// مهمان: فقط local — لاگین اجباری نیست
      if (!res.ok && res.error !== "login_required") {
        toast.error(res.error ? `سبد: ${res.error}` : "خطا در افزودن به سبد");
      } else {
        setIsAddedToCart(true);
        toast.success("به سبد خرید اضافه شد");
        setTimeout(() => setIsAddedToCart(false), 1500);
      }
    } finally {
      setIsAddingToCart(false);
    }
  }



  const card = (
    <Card
      className={cn(
        "w-full overflow-hidden rounded-2xl border bg-card text-foreground shadow-sm p-0 gap-0",
        className
      )}
    >
      {/* Image */}
 <div className="m-0 p-0 relative - h-[220px] w-full overflow-hidden bg-neutral-200">

        {/* Like + Compare — left column only */}
        <div className="pointer-events-auto absolute top-2 left-2 z-30 flex w-9 flex-col items-center gap-1.5 sm:top-3 sm:left-3 sm:w-10 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={`h-8 w-8 shrink-0 rounded-full border-0 bg-background/90 p-0 shadow-sm backdrop-blur-sm ${
              isWishlisted ? "text-rose-500" : ""
            } text-foreground hover:!bg-primary hover:!text-primary-foreground`}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!productId) {
                toast.error("محصول نامعتبر است");
                return;
              }
              const item = {
                id: productId,
                title: name ?? "محصول",
                price: price ?? 0,
                image: (images && images[0]) || undefined,
                href: href,
              };
              // همیشه UI هدر / پنل کناری
              toggleWishlistStore(item);
              const nowIn = useShopStore.getState().wishlist.some((x) => x.id === productId);
              // اگر لاگین باشد، همزمان DB
              try {
                const res = await toggleWishlistAction(productId);
                
      if (res.ok && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pm:wishlist-changed"));
      }
if (res.ok === false && res.error === "login_required") {
                  // مهمان: فقط store — درست است
                  toast.success(
                    nowIn ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد"
                  );
                  return;
                }
                if (res.ok === false) {
                  toast.error("خطا در همگام‌سازی سرور");
                  return;
                }
                toast.success(
                  res.added ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد"
                );
              } catch {
                toast.success(
                  nowIn ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد"
                );
              }
            }}
            aria-label="علاقه‌مندی"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
            />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={`h-8 w-8 shrink-0 rounded-full border-0 bg-background/90 p-0 shadow-sm backdrop-blur-sm ${
              isCompared ? "text-primary" : ""
            } text-foreground hover:!bg-primary hover:!text-primary-foreground`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!productId) {
                toast.error("محصول نامعتبر است");
                return;
              }
              const item = {
                id: productId,
                title: name ?? "محصول",
                price: price ?? 0,
                image: (images && images[0]) || undefined,
                href: href,
              };
              toggleCompareStore(item);
              const nowIn = useShopStore.getState().compare.some((x) => x.id === productId);
              toast.success(
                nowIn ? "به لیست مقایسه اضافه شد" : "از لیست مقایسه حذف شد"
              );
            }}
            aria-label="مقایسه"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges — vertical stack, right-aligned, full text */}
        <div className="pointer-events-auto absolute top-2 right-2 z-20 flex flex-col items-end gap-1.5 sm:top-3 sm:right-3">
          {category ? (
            <button
              type="button"
              className="me-auto inline-flex w-fit shrink-0 self-start"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (categoryHref) router.push(categoryHref);
              }}
            >
              <Badge
                variant="secondary"
                className="me-auto w-fit self-start border-0 bg-violet-100 px-2.5 py-1 text-left text-[10px] leading-tight whitespace-nowrap text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 sm:text-xs"
              >
                {category}
              </Badge>
            </button>
          ) : null}
          {brand ? (
            <button
              type="button"
              className="me-auto inline-flex w-fit shrink-0 self-start"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (brandHref) router.push(brandHref);
              }}
            >
              <Badge
                variant="outline"
                className="me-auto w-fit self-start border-0 bg-emerald-100 px-2.5 py-1 text-left text-[10px] leading-tight whitespace-nowrap text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 sm:text-xs"
              >
                {brand}
              </Badge>
            </button>
          ) : null}
        </div>

        {/* شگفت‌انگیز — پایین سمت راست تصویر */}
        {isSpecialSale ? (
          <div className="pointer-events-none absolute bottom-2 right-2 z-20 sm:bottom-3 sm:right-3">
            <Badge className="me-auto w-fit self-start border-0 bg-rose-100 px-2.5 py-1 text-left text-[10px] leading-tight whitespace-nowrap text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 sm:text-xs">
              شگفت‌انگیز
            </Badge>
          </div>
        ) : null}


        {/* Actions: like on top, compare under — all breakpoints */}
        {/* Badges: ONE horizontal row — New | Category | Brand (no wrap on mobile) */}
        {/* بج‌ها افقی: جدید | دسته | برند */}
        {/* لایک + مقایسه کنار هم */}
        {hasImage ? (
          <motion.img
            key={currentImageIndex}
            src={safeImages[currentImageIndex]}
            alt={name}
            className="z-0 absolute inset-0 h-full w-full object-cover object-top"
            
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center px-4 text-center text-sm">
            بدون تصویر
          </div>
        )}
{/* Badges — start (RTL right) */}
        {/* Wishlist — end (RTL left) */}
        </div>

      {/* Content — balanced spacing */}
      <CardContent className="space-y-3 bg-white p-3 dark:bg-[#2A2E32] sm:space-y-2.5">
        <div className="space-y-1">
          {brand ? (
            <p className="text-muted-foreground text-[11px] leading-4 tracking-wide">
              {brand}
            </p>
          ) : null}
          <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="block w-full max-w-full cursor-default text-start">
                        <span className="font-iranyekan-heavy block w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 sm:text-[15px] block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          {name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        {name}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

          {(rating > 0 || freeShipping) && (
            <div className="flex items-center gap-2 pt-0.5">
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-medium">
                    {toPersianDigits(rating.toFixed(1))}
                  </span>
                  {reviewCount > 0 && (
                    <span className="text-muted-foreground text-[11px]">
                      ({toPersianDigits(String(reviewCount))})
                    </span>
                  )}
                </div>
              )}
              {freeShipping && (
                <span className="ms-auto text-[11px] font-medium text-emerald-600">
                  ارسال رایگان
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold tracking-tight sm:text-[17px]">
            <span className="price font-bold">{formatToman(price)}</span>
          </span>
          {originalPrice != null && originalPrice > price && (
            <span className="text-muted-foreground text-xs line-through">
              {formatToman(originalPrice)}
            </span>
          )}
        </div>

        {/* Colors / sizes — compact, only if data exists */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {colors.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "h-5 w-5 rounded-full border border-black/5 transition-all",
                  selectedColor === color
                    ? "ring-primary ring-2 ring-offset-1"
                    : ""
                )}
                style={{ backgroundColor: color }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedColor(color);
                }}
                aria-label={`رنگ ${color}`}
              />
            ))}
          </div>
        )}

        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sizes.slice(0, 6).map((size) => (
              <button
                key={size}
                type="button"
                className={cn(
                  "h-7 min-w-[2rem] rounded-md px-1.5 text-[11px] font-medium transition-all",
                  selectedSize === size
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-foreground
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSize(size);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-0 bg-white p-3 pt-0 dark:bg-[#2A2E32]">
        <Button
          type="button"
          className="h-10 w-full rounded-xl text-sm font-medium"
          onClick={handleAddToCart}
          disabled={isAddingToCart || isAddedToCart}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="ms-2 h-4 w-4 animate-spin" />
              در حال افزودن...
            </>
          ) : isAddedToCart ? (
            <>
              <Check className="ms-2 h-4 w-4" />
              اضافه شد
            </>
          ) : (
            <>
              <ShoppingCart className="ms-2 h-4 w-4" />
              افزودن به سبد
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full outline-none no-underline hover:no-underline">
        {card}
      </Link>
    );
  }

  return card;
}