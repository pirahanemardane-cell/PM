"use client";

import Link from "next/link";
import { ProductCard1 as ProductCardUI } from "@/components/ui/product-card-1";
import type { ProductWithRelations } from "@/repositories/product.repository";

type Props = {
  product: ProductWithRelations;
};

export function ProductCard({ product }: Props) {
  const images =
    (product.images ?? [])
      .slice()
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((img) => img.url)
      .filter(Boolean) || [];

  const variants = product.variants?.filter((v) => v.is_active) ?? [];
  const prices = variants
    .map((v) => Number(v.price))
    .filter((n) => !Number.isNaN(n));
  const price = prices.length ? Math.min(...prices) : 0;

  const compares = variants
    .map((v) =>
      Number((v as { compare_at_price?: number | null }).compare_at_price)
    )
    .filter((n) => !Number.isNaN(n) && n > 0);
  const originalPrice = compares.length ? Math.max(...compares) : price;

  let discount = 0;
  if (originalPrice > price && originalPrice > 0) {
    discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const sizes = [
    ...new Set(
      variants
        .map((v) => (v as { size?: string | null }).size)
        .filter((s): s is string => Boolean(s))
    ),
  ];

  const colors = [
    ...new Set(
      variants
        .map((v) => (v as { color_hex?: string | null }).color_hex)
        .filter((c): c is string => Boolean(c))
    ),
  ];

  
  const categoryName =
    (product as { category?: { name?: string; slug?: string } | null }).category?.name ||
    (product as { categories?: { name?: string; slug?: string }[] }).categories?.[0]?.name;

  const categorySlug =
    (product as { category?: { slug?: string } | null }).category?.slug ||
    (product as { categories?: { slug?: string }[] }).categories?.[0]?.slug;

  const categoryHref = categorySlug
    ? `/products?category=${categorySlug}`
    : categoryName
      ? `/products?category=${encodeURIComponent(categoryName)}`
      : undefined;

  return (
    <Link href={`/products/${product.slug}`} className="block w-full max-w-sm">
      <ProductCardUI

        category={categoryName}
        categoryHref={categoryHref}
                name={product.name}
        price={price}
        originalPrice={originalPrice}
        rating={4.8}
        reviewCount={0}
        images={
          images.length
            ? images
            : [
                "https://cdn.21st.dev/assets/mirror/ad/ade63a3c4df44b7c8e7277a749d732494e317e8289fd2ed72d57de841ff63896.jpg",
              ]
        }
        colors={
          colors.length
            ? colors
            : ["#1e293b", "#a855f7", "#0ea5e9", "#84cc16"]
        }
        sizes={sizes.length ? sizes : ["S", "M", "L", "XL"]}
        isNew={Boolean(product.is_new)}
        isBestSeller={Boolean(product.is_bestseller)}
        discount={discount}
        freeShipping
      />
    </Link>
  );
}
