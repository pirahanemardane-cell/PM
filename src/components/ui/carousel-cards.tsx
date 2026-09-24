"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/numbers";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type CarouselCardItem = {
  id: string;
  title: string;
  brand?: string;
  href: string;
  imageUrl: string;
  imageAlt?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
};

type CarouselCardsProps = {
  items: CarouselCardItem[];
  title?: string;
  className?: string;
  slidesToShow?: number;
};

function formatPrice(price: number) {
  return toPersianDigits(price.toLocaleString("en-US")) + " تومان";
}

export function CarouselCards({
  items,
  title,
  className,
  slidesToShow = 4,
}: CarouselCardsProps) {
  if (!items?.length) return null;

  return (
    <section className={cn("w-full", className)}>
      {title && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl text-primary">
            {title}
          </h2>
        </div>
      )}

      <div className="relative px-12">
        <Carousel
          opts={{
            align: "start",
            loop: false,
            direction: "rtl",
          }}
          className="w-full"
        >
          <CarouselContent className="-mr-4">
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className={cn(
                  "pr-4",
                  slidesToShow === 2 && "basis-[85%]",
                  slidesToShow === 3 && "md:basis-1/3",
                  slidesToShow === 4 && "sm:basis-[85%] md:basis-1/3 lg:basis-[22.22%]"
                )}
              >
                <Link
                  href={item.href}
                  className="group block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt || item.title}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {item.badge && (
                      <Badge className="absolute top-3 right-3">
                        {item.badge}
                      </Badge>
                    )}
                    {item.discountPercent && item.discountPercent > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute top-3 left-3"
                      >
                        ٪{toPersianDigits(item.discountPercent)}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 p-3">
                    {item.brand && (
                      <p className="text-xs text-muted-foreground">
                        {item.brand}
                      </p>
                    )}
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-primary">
                      {item.title}
                    </h3>

                    {typeof item.rating === "number" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>{toPersianDigits(item.rating.toFixed(1))}</span>
                        {item.reviewCount !== undefined && (
                          <span>({toPersianDigits(item.reviewCount)})</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-baseline gap-2 pt-1">
                      <span className="font-bold">
                        {formatPrice(item.price)}
                      </span>
                      {item.originalPrice &&
                        item.originalPrice > item.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                    </div>

                    {item.inStock === false && (
                      <p className="text-xs text-destructive">ناموجود</p>
                    )}
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="right-0 left-auto" />
          <CarouselNext className="left-0 right-auto" />
        </Carousel>
      </div>
    </section>
  );
}
