import type { ProductImageSizeName } from "@/lib/process-product-image";

/**
 * از URL یا key مربوط به large، URL سایز دیگر را می‌سازد.
 * قرارداد: .../{ts}-large.webp → .../{ts}-{size}.webp
 */
export function productImageUrlForSize(
  largeUrlOrKey: string,
  size: ProductImageSizeName,
): string {
  return largeUrlOrKey.replace(
    /-(thumb|small|medium|large)\.webp(\?.*)?$/,
    `-${size}.webp`,
  );
}
