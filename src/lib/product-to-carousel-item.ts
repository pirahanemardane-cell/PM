import type { ProductWithRelations } from "@/repositories/product.repository";

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

const FALLBACK_IMAGE = "/og-image.webp";

function brandName(product: ProductWithRelations): string | undefined {
  const b = product.brand as
    | { name?: string }
    | { name?: string }[]
    | null
    | undefined;
  if (!b) return undefined;
  if (Array.isArray(b)) return b[0]?.name;
  return b.name;
}

export function productToCarouselCardItem(
  product: ProductWithRelations,
): CarouselCardItem {
  try {
    const images = (product.images ?? [])
      .slice()
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
    const imageUrl = images[0]?.url || FALLBACK_IMAGE;

    const variants = (product.variants ?? []).filter(
      (v) => v.is_active !== false,
    );
    const prices = variants
      .map((v) => Number(v.price))
      .filter((n) => !Number.isNaN(n));
    const price = prices.length ? Math.min(...prices) : 0;

    const originals = variants
      .map((v) => Number(v.original_price))
      .filter((n) => !Number.isNaN(n) && n > 0);
    const originalPrice = originals.length ? Math.max(...originals) : undefined;

    let discountPercent: number | undefined;
    if (originalPrice && originalPrice > price && price > 0) {
      discountPercent = Math.round(
        ((originalPrice - price) / originalPrice) * 100,
      );
    }

    const inStock =
      variants.length === 0
        ? true
        : variants.some((v) => Number(v.stock_quantity ?? 0) > 0);

    let badge: string | undefined;
    if (product.is_new) badge = "جدید";
    else if (product.is_bestseller) badge = "پرفروش";
    else if (product.is_featured) badge = "ویژه";

    const img0 = images[0] as
      | { alt_text?: string | null; alt?: string | null }
      | undefined;
    const alt = img0?.alt_text || img0?.alt || product.name;

    return {
      id: product.id,
      title: product.name,
      brand: brandName(product),
      href: `/products/${product.slug}`,
      imageUrl,
      imageAlt: alt,
      price,
      originalPrice:
        originalPrice && originalPrice > price ? originalPrice : undefined,
      discountPercent,
      badge,
      inStock,
    };
  } catch {
    return {
      id: product.id || "unknown",
      title: product.name || "محصول",
      href: product.slug ? `/products/${product.slug}` : "/products",
      imageUrl: FALLBACK_IMAGE,
      price: 0,
    };
  }
}
