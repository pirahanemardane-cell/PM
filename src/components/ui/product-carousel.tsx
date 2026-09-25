"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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

export function ProductCarousel({
  products,
  title,
  viewAllHref,
  className,
  slidesToShow = 4,
  leading,
}: ProductCarouselProps) {
  if (!products?.length && !leading) return null;

  const itemClass = cn(
    "pr-4",
    slidesToShow === 2 && "basis-[85%]",
    slidesToShow === 3 && "basis-[70%] md:basis-1/3",
    slidesToShow === 4 &&
      "basis-[75%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4",
  );

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
          opts={{
            align: "start",
            loop: false,
            direction: "rtl",
          }}
          className="w-full"
        >
          <CarouselContent className="-mr-4">
            {leading ? (
              <CarouselItem className={itemClass}>{leading}</CarouselItem>
            ) : null}

            {products.map((product) => (
              <CarouselItem key={product.id} className={itemClass}>
                <ProductCard product={product} />
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
