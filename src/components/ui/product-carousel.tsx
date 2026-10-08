"use client";

import * as React from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/product/product-card";
import type { ProductWithRelations } from "@/repositories/product.repository";
import { loadProductsPage } from "@/app/(shop)/products/actions";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";

type LiveQuery = {
  featured?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  pageSize?: number;
  categorySlug?: string;
  brandSlug?: string;
};

type ProductCarouselProps = {
  products: ProductWithRelations[];
  title?: string;
  viewAllHref?: string;
  className?: string;
  slidesToShow?: number;
  leading?: React.ReactNode;
  /** اگر باشد، با تغییر کاتالوگ/موجودی بدون رفرش صفحه لیست را تازه می‌کند */
  liveQuery?: LiveQuery;
};

/** موبایل 1.5 · sm 2.5 · lg 3.5 — با فاصله pr-4 */
const SLIDE_BASIS =
  "basis-[calc((100%-0.5rem)/1.5)] pr-4 sm:basis-[calc((100%-1.5rem)/2.5)] lg:basis-[calc((100%-2.5rem)/3.5)]";

export function ProductCarousel({
  products: initialProducts,
  title,
  viewAllHref,
  className,
  leading,
  liveQuery,
}: ProductCarouselProps) {
  const [products, setProducts] = useState(initialProducts);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const reload = useCallback(() => {
    if (!liveQuery) return;
    startTransition(async () => {
      const result = await loadProductsPage({
        page: 1,
        pageSize: liveQuery.pageSize ?? 12,
        featured: liveQuery.featured,
        sort: liveQuery.sort ?? "newest",
        categorySlug: liveQuery.categorySlug,
        brandSlug: liveQuery.brandSlug,
      });
      if (result.success && result.products.length > 0) {
        setProducts(result.products);
      }
    });
  }, [liveQuery]);

  useRtEvent(RT.catalog, () => {
    if (liveQuery) reload();
  });
  useRtEvent(RT.stock, () => {
    if (liveQuery) reload();
  });

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
              <CarouselItem className={`${SLIDE_BASIS} h-full`}>{leading}</CarouselItem>
            ) : null}

            {products.map((product) => (
              <CarouselItem key={product.id} className={`${SLIDE_BASIS} h-full`}>
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
