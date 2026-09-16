"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { toPersianDigits } from "@/lib/numbers";

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
  currencyLabel?: string;
}

function formatToman(price: number) {
  return toPersianDigits(price.toLocaleString("en-US")) + " تومان";
}

export function ProductCard1({
  href,
  name = "محصول",
  brand,
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
}: ProductCard1Props) {
  const safeImages = images.length > 0 ? images : ["/brand/logo-light-transparent.webp"];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const body = (
    <Card className="group bg-card text-foreground w-full max-w-sm overflow-hidden rounded-md shadow-xl transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-[3/4] overflow-hidden">
        <motion.img
          key={currentImageIndex}
          src={safeImages[currentImageIndex]}
          alt={`${name} - ${currentImageIndex + 1}`}
          className="h-full w-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {safeImages.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="bg-background/80 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm"
              onClick={prevImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="bg-background/80 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm"
              onClick={nextImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {safeImages.length > 1 && (
          <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5">
            {safeImages.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-primary w-4"
                    : "bg-primary/30 w-1.5"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 start-3 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-blue-500 hover:bg-blue-500/90">جدید</Badge>
          )}
          {isBestSeller && (
            <Badge className="bg-amber-500 hover:bg-amber-500/90">
              پرفروش
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-rose-500 hover:bg-rose-500/90">
              ٪{toPersianDigits(String(discount))}-
            </Badge>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={`bg-background/80 absolute top-3 end-3 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm ${
            isWishlisted ? "text-rose-500" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted((v) => !v);
          }}
        >
          <Heart
            className={`h-4 w-4 ${isWishlisted ? "fill-rose-500" : ""}`}
          />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            {brand ? (
              <p className="text-muted-foreground text-xs">{brand}</p>
            ) : null}
            <h3 className="line-clamp-1 font-medium">{name}</h3>
            <div className="mt-1 flex items-center gap-2">
              {rating > 0 && (
                <div className="flex items-center">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="me-1 text-sm font-medium">
                    {toPersianDigits(rating.toFixed(1))}
                  </span>
                </div>
              )}
              {reviewCount > 0 && (
                <span className="text-muted-foreground text-xs">
                  ({toPersianDigits(String(reviewCount))} نظر)
                </span>
              )}
              {freeShipping && (
                <span className="ms-auto text-xs text-emerald-600">
                  ارسال رایگان
                </span>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{formatToman(price)}</span>
            {originalPrice != null && originalPrice > price && (
              <span className="text-muted-foreground text-sm line-through">
                {formatToman(originalPrice)}
              </span>
            )}
          </div>

          {(colors.length > 0 || sizes.length > 0) && (
            <div className="space-y-3">
              {colors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-muted-foreground text-xs">رنگ</div>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-6 w-6 rounded-full transition-all ${
                          selectedColor === color
                            ? "ring-primary ring-2 ring-offset-2"
                            : "ring-muted hover:ring-primary ring-1"
                        }`}
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
                </div>
              )}

              {sizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-muted-foreground text-xs">سایز</div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`h-8 min-w-[2.5rem] rounded-md px-2 text-xs font-medium transition-all ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 hover:bg-muted"
                        }`}
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
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          type="button"
          className="w-full"
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
              به سبد اضافه شد
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
      <Link href={href} className="block w-full max-w-sm">
        {body}
      </Link>
    );
  }

  return body;
}
