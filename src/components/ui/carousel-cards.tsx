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
import type { CarouselCardItem } from "@/lib/product-to-carousel-item";

export type { CarouselCardItem };

type CarouselCardsProps = {
  items: CarouselCardItem[];
  title?: string;
  viewAllHref?: string;
  className?: string;
  slidesToShow?: number;
  leading?: React.ReactNode;
};

function formatPrice(price: number) {
  return toPersianDigits(price.toLocaleString("en-US")) + " تومان";
}

export function CarouselCards({
  items,
  title,
  viewAllHref,
  className,
  slidesToShow = 4,
  leading,
}: CarouselCardsProps) {
  if (!items?.length && !leading) return null;

  return (
    <section className={cn("w-full", className)}>
      {(title || viewAllHref) && (
        <div className="mb-5 flex items-end justify-between gap-4">
          {title ? (
            <h2 className="text-xl font-bold tracking-tight text-primary md:text-2xl">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              مشاهده همه
            </Link>
          ) : null}
        </div>
      )}

      <div className="relative px-10 md:px-12">
        <Carousel
          opts={{ align: "start", loop: false, direction: "rtl" }}
          className="w-full"
        >
          <CarouselContent className="-mr-4">
            {leading ? (
              <CarouselItem
                className={cn(
                  "pr-4",
                  slidesToShow === 2 && "basis-[85%]",
                  slidesToShow === 3 && "basis-[70%] md:basis-1/3",
                  slidesToShow === 4 &&
                    "basis-[75%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4",
                )}
              >
                {leading}
              </CarouselItem>
            ) : null}

            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className={cn(
                  "pr-4",
                  slidesToShow === 2 && "basis-[85%]",
                  slidesToShow === 3 && "basis-[70%] md:basis-1/3",
                  slidesToShow === 4 &&
                    "basis-[75%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4",
                )}
              >
                <Link
                  href={item.href}
                  className="group block h-full overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <Image
                      src={item.imageUrl || "/og-image.webp"}
                      alt={item.imageAlt || item.title}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {item.badge && (
                      <Badge className="absolute top-3 right-3">{item.badge}</Badge>
                    )}
                    {item.discountPercent != null && item.discountPercent > 0 && (
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
                      <p className="text-xs text-muted-foreground">{item.brand}</p>
                    )}
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-primary">
                      {item.title}
                    </h3>
                    {typeof item.rating === "number" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>{toPersianDigits(item.rating.toFixed(1))}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-baseline gap-2 pt-1">
                      <span className="font-bold">{formatPrice(item.price)}</span>
                      {item.originalPrice != null &&
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

export type CarouselLinkItem = {
  id: string;
  label: string;
  href: string;
};

export function CarouselLinks({
  items,
  title,
  viewAllHref,
  className,
}: {
  items: CarouselLinkItem[];
  title?: string;
  viewAllHref?: string;
  className?: string;
}) {
  if (!items?.length) return null;

  return (
    <section className={cn("w-full", className)}>
      {(title || viewAllHref) && (
        <div className="mb-5 flex items-end justify-between gap-4">
          {title ? (
            <h2 className="text-xl font-bold text-primary md:text-2xl">{title}</h2>
          ) : (
            <span />
          )}
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              مشاهده همه
            </Link>
          ) : null}
        </div>
      )}
      <div className="relative px-10 md:px-12">
        <Carousel
          opts={{ align: "start", loop: false, direction: "rtl" }}
          className="w-full"
        >
          <CarouselContent className="-mr-3">
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className="basis-[42%] pr-3 sm:basis-[30%] md:basis-1/4 lg:basis-1/6"
              >
                <Link
                  href={item.href}
                  className="bg-muted/40 hover:border-foreground/20 flex h-20 items-center justify-center rounded-2xl border px-3 text-center text-sm font-medium transition-colors hover:bg-muted/60"
                >
                  {item.label}
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
