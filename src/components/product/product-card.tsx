import type { ProductWithRelations } from "@/repositories/product.repository";
import { ProductCard1 } from "@/components/ui/product-card-1";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const images = (product.images ?? [])
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((img) => img.url)
    .filter(Boolean);

  const activeVariants = product.variants?.filter((v) => v.is_active) ?? [];
  const prices = activeVariants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
  const minPrice = prices.length ? Math.min(...prices) : 0;

  const sizes = [
    ...new Set(
      activeVariants
        .map((v) => (v as { size?: string | null }).size)
        .filter((s): s is string => Boolean(s))
    ),
  ];

  const colors = [
    ...new Set(
      activeVariants
        .map((v) => (v as { color_hex?: string | null }).color_hex)
        .filter((c): c is string => Boolean(c))
    ),
  ];

  const compareAt = activeVariants
    .map((v) => Number((v as { compare_at_price?: number | null }).compare_at_price))
    .filter((n) => !Number.isNaN(n) && n > minPrice);
  const originalPrice = compareAt.length ? Math.max(...compareAt) : undefined;

  let discount = 0;
  if (originalPrice && originalPrice > minPrice) {
    discount = Math.round(((originalPrice - minPrice) / originalPrice) * 100);
  }

  return (
    <ProductCard1
      href={`/products/${product.slug}`}
      name={product.name}
      brand={product.brand?.name}
      price={minPrice}
      originalPrice={originalPrice}
      images={images}
      colors={colors}
      sizes={sizes}
      isNew={Boolean(product.is_new)}
      isBestSeller={Boolean(product.is_bestseller)}
      discount={discount}
      freeShipping={false}
      rating={0}
      reviewCount={0}
    />
  );
}
