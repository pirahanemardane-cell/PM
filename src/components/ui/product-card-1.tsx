"use client";

import { useState } from "react";
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
  GitCompareArrows,
} from "lucide-react";

export interface ProductCardProps {
  name?: string;
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
  brand?: string;
  isSpecialSale?: boolean;
}

export function ProductCard({
  name = "Premium Wool Sweater",
  price = 89.99,
  originalPrice = 129.99,
  rating = 4.8,
  reviewCount = 142,
  images = ["/logo.svg", "/logo.svg", "/logo.svg"],
  colors = ["#1e293b", "#a855f7", "#0ea5e9", "#84cc16"],
  sizes = ["XS", "S", "M", "L", "XL"],
  isNew = true,
  isBestSeller = true,
  discount = 30,
  freeShipping = true,
  category,
  brand,
  isSpecialSale = false,
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    if (isAddedToCart) return;
    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    }, 800);
  };

  return (
    <Card className="group bg-white text-foreground w-full max-w-sm overflow-hidden rounded-md shadow-xl transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-[4/5] max-h-[220px] overflow-hidden bg-muted/30 sm:max-h-[240px] lg:max-h-[260px]">
        <motion.img
          key={currentImageIndex}
          src={images[currentImageIndex]}
          alt={`${name} - View ${currentImageIndex + 1}`}
          className="h-full w-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/80 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/80 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`h-1.5 rounded-full transition-all ${
                index === currentImageIndex
                  ? "bg-primary w-4"
                  : "bg-primary/30 w-1.5"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
            />
          ))}
        </div>

        {/* بالا چپ: جدید → دسته → برند (زیر هم) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
          {isNew && (
            <Badge className="bg-blue-500 hover:bg-blue-500/90">جدید</Badge>
          )}
          {category ? (
            <Badge
              variant="secondary"
              className="bg-background/90 text-foreground max-w-[9rem] truncate backdrop-blur-sm"
            >
              {category}
            </Badge>
          ) : null}
          {brand ? (
            <Badge
              variant="outline"
              className="bg-background/90 max-w-[9rem] truncate backdrop-blur-sm"
            >
              {brand}
            </Badge>
          ) : null}
        </div>

        {/* بالا راست: لایک + مقایسه (کنار هم) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={`bg-background/80 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm ${
              isWishlisted ? "text-rose-500" : ""
            }`}
            onClick={(e) => {
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
            className={`bg-background/80 h-8 w-8 rounded-full shadow-sm backdrop-blur-sm ${
              isCompared ? "text-primary" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsCompared(!isCompared);
            }}
            aria-label="مقایسه"
          >
            <GitCompareArrows className="h-4 w-4" />
          </Button>
        </div>

        {/* پایین چپ تصویر: فروش ویژه */}
        {isSpecialSale && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="bg-rose-600 shadow-sm hover:bg-rose-600/90">
              فروش ویژه
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="bg-white space-y-2 p-3">
        <div className="space-y-2">
          <div>
            <h3 className="line-clamp-1 font-medium">{name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="ml-1 text-sm font-medium">{rating}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                ({reviewCount} reviews)
              </span>
              {freeShipping && (
                <span className="ml-auto text-xs text-emerald-600">
                  Free shipping
                </span>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">${price.toFixed(2)}</span>
            {originalPrice > price && (
              <span className="text-muted-foreground text-sm line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs">Colors</div>
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
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-muted-foreground text-xs">Sizes</div>
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
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-0 bg-white p-3 pt-2">
        <Button
          className="w-full"
          onClick={handleAddToCart}
          disabled={isAddingToCart || isAddedToCart}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : isAddedToCart ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
