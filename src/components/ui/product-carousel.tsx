"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/product/product-card";
import type { ProductWithRelations } from "@/repositories/product.repository";

type ProductCarouselProps = {
  products: ProductWithRelations[];
  title?: string;
  viewAllHref?: string;
  className?: string;
  slidesToShow?: number;
  leading?: React.ReactNode;
};

const CARD_WIDTH =
  "w-[min(100%,240px)] sm:w-[220px] lg:w-[calc((100%-2.25rem)/3.5)]";

export function ProductCarousel({
  products,
  title,
  viewAllHref,
  className,
  leading,
}: ProductCarouselProps) {
  if (!products?.length && !leading) return null;

  return (
    <section className={cn("w-full", className)}>
      {(title || viewAllHref) && (
        <div className="mb-5 flex items-end justify-between gap-4">
          {title ? (
            <h2 className="text-xl font-bold text-primary md:text-2xl">
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

      <div className="-mx-4">
        <Carousel
          opts={{
            align: "start",
            loop: false,
            direction: "rtl",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-mr-4 ml-0 px-4">
            {leading ? (
              <CarouselItem className="basis-auto pr-4">
                <div className={cn(CARD_WIDTH, "shrink-0")}>{leading}</div>
              </CarouselItem>
            ) : null}

            {products.map((product) => (
              <CarouselItem key={product.id} className="basis-auto pr-4">
                <div className={cn(CARD_WIDTH, "shrink-0")}>
                  <ProductCard product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
