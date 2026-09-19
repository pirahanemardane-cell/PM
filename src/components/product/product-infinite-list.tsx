"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ProductWithRelations } from "@/repositories/product.repository";
import {
  loadProductsPage,
  type LoadProductsResult,
} from "@/app/(shop)/products/actions";
import { ProductCard } from "./product-card";

type Props = {
  initialProducts: ProductWithRelations[];
  initialPage: number;
  initialHasMore: boolean;
  categorySlug?: string;
  brandSlug?: string;
  q?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  featured?: boolean;
  attrs?: Record<string, string>;
};

export function ProductInfiniteList({
  initialProducts,
  initialPage,
  initialHasMore,
  categorySlug,
  brandSlug,
  q,
  sort,
  featured,
  attrs,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // وقتی URL/فیلتر عوض شود، لیست از سرور دوباره می‌آید
  useEffect(() => {
    setProducts(initialProducts);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setError(null);
  }, [initialProducts, initialPage, initialHasMore]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    loadingRef.current = true;

    startTransition(async () => {
      const nextPage = page + 1;
      const result: LoadProductsResult = await loadProductsPage({
        page: nextPage,
        pageSize: 12,
        categorySlug,
        brandSlug,
        q,
        sort,
        featured,
        attrs,
      });

      if (!result.success) {
        setError(result.error ?? "خطا در بارگذاری");
        loadingRef.current = false;
        return;
      }

      setProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of result.products) {
          if (!ids.has(p.id)) merged.push(p);
        }
        return merged;
      });
      setPage(result.page);
      setHasMore(result.hasMore);
      setError(null);
      loadingRef.current = false;
    });
  }, [hasMore, page, categorySlug, brandSlug, q, sort, featured, attrs]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">محصولی یافت نشد.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div ref={sentinelRef} className="flex min-h-10 items-center justify-center">
        {isPending && (
          <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>
        )}
        {!hasMore && products.length > 0 && (
          <p className="text-muted-foreground text-sm">همه محصولات نمایش داده شد</p>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
}
