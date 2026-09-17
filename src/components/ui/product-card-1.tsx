"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ArrowLeftRight,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { toPersianDigits } from "@/lib/numbers";
import { cn } from "@/lib/utils";

export interface ProductCard1Props {
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
  brand?: string;
  brandHref?: string;
  isSpecialSale?: boolean;
  className?: string;
}

function formatToman(price: number) {
  return toPersianDigits(Math.round(price).toLocaleString("en-US")) + " تومان";
}

export function ProductCard1({
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddedToCart) return;
    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    }, 800);
  };

  const card = (
    <Card
      className={cn(
        "group bg-card text-foreground w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      {/* Image */}
      <div className="bg-muted/40 relative aspect-[4/5] max-h-[220px] overflow-hidden bg-muted/30 sm:max-h-[240px] lg:max-h-[260px]">

        {/* Like + Compare — left column only */}
        <div className="pointer-events-auto absolute top-2 left-2 z-30 flex w-9 flex-col items-center gap-1.5 sm:top-3 sm:left-3 sm:w-10 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={`h-8 w-8 shrink-0 rounded-full border-0 bg-background/90 p-0 shadow-sm backdrop-blur-sm ${
              isWishlisted ? "text-rose-500" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            aria-label="علاقه‌مندی"
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? "fill-rose-500" : ""}`}
            />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={`h-8 w-8 shrink-0 rounded-full border-0 bg-background/90 p-0 shadow-sm backdrop-blur-sm ${
              isCompared ? "text-primary" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCompared(!isCompared);
            }}
            aria-label="مقایسه"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges row — right side only, never overlaps left actions */}
        <div className="pointer-events-auto absolute top-2 right-2 z-20 flex max-w-[calc(100%-3.5rem)] flex-nowrap items-center justify-end gap-1 overflow-hidden sm:top-3 sm:right-3 sm:max-w-[calc(100%-4rem)] sm:gap-1.5">
          {isNew ? (
            <Badge className="shrink-0 border-0 bg-blue-500 px-2 py-0.5 text-[10px] leading-4 text-white hover:bg-blue-500/90 sm:text-xs">
              جدید
            </Badge>
          ) : null}
          {category ? (
            <button
              type="button"
              className="inline-flex min-w-0 max-w-[40%] shrink"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (categoryHref) router.push(categoryHref);
              }}
            >
              <Badge
                variant="secondary"
                className="w-full truncate border-0 bg-background/90 px-2 py-0.5 text-[10px] leading-4 text-foreground backdrop-blur-sm hover:bg-background sm:text-xs"
              >
                {category}
              </Badge>
            </button>
          ) : null}
          {brand ? (
            <button
              type="button"
              className="inline-flex min-w-0 max-w-[40%] shrink"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (brandHref) router.push(brandHref);
              }}
            >
              <Badge
                variant="outline"
                className="w-full truncate bg-background/90 px-2 py-0.5 text-[10px] leading-4 backdrop-blur-sm hover:bg-background sm:text-xs"
              >
                {brand}
              </Badge>
            </button>
          ) : null}
        </div>

        {/* فروش ویژه — پایین سمت راست تصویر */}
        {isSpecialSale ? (
          <div className="pointer-events-none absolute bottom-2 right-2 z-20 sm:bottom-3 sm:right-3">
            <Badge className="border-0 bg-rose-600 px-2 py-0.5 text-[10px] leading-4 text-white shadow-sm hover:bg-rose-600/90 sm:text-xs">
              فروش ویژه
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
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
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
      <CardContent className="space-y-3 p-3.5 sm:p-4">
        <div className="space-y-1">
          {brand ? (
            <p className="text-muted-foreground text-[11px] leading-4 tracking-wide">
              {brand}
            </p>
          ) : null}
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-semibold sm:text-[15px]">
            {name}
          </h3>

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
            {formatToman(price)}
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
                    : "hover:ring-muted-foreground/30 hover:ring-1"
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
                    : "bg-muted/70 text-foreground hover:bg-muted"
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

      <CardFooter className="border-0 bg-white p-4 pt-4">
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
      <Link href={href} className="block w-full outline-none">
        {card}
      </Link>
    );
  }

  return card;
}