"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ProductGallery,
  type GalleryImage,
} from "@/components/product/product-gallery";
import {
  ProductBuyBox,
  type BuyVariant,
} from "@/components/product/product-buy-box";

function colorNorm(c: string | null | undefined) {
  return (c || "").trim().replace(/^#/, "").toLowerCase();
}

type Props = {
  productId: string;
  productName: string;
  href: string;
  fallbackImage?: string | null;
  images: GalleryImage[];
  variants: BuyVariant[];
  childrenBeforeBuy?: ReactNode;
  childrenAfterBuy?: ReactNode;
};

export function ProductPdpGalleryAndBuy({
  productId,
  productName,
  href,
  fallbackImage,
  images,
  variants,
  childrenBeforeBuy,
  childrenAfterBuy,
}: Props) {
  const firstColor =
    variants.find((v) => v.color)?.color?.trim() || null;

  const [activeColor, setActiveColor] = useState<string | null>(firstColor);

  // ست فوری — بدون debounce
  const onColorChange = useCallback((c: string) => {
    setActiveColor(c);
  }, []);

  const cartImage = useMemo(() => {
    if (!activeColor) return fallbackImage;
    const want = colorNorm(activeColor);
    const ids = new Set(
      variants.filter((v) => colorNorm(v.color) === want).map((v) => v.id),
    );
    const hit = images.find((i) => i.variant_id && ids.has(i.variant_id));
    if (hit?.url) return hit.url;
    const hints: Record<string, string[]> = {
      سفید: ["white"],
      مشکی: ["black"],
      آبی: ["blue"],
    };
    const h = hints[activeColor.trim()] ?? [];
    const byUrl = images.find((i) =>
      h.some((x) => i.url.toLowerCase().includes(x)),
    );
    return byUrl?.url ?? fallbackImage;
  }, [activeColor, variants, images, fallbackImage]);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery
        productName={productName}
        images={images}
        variants={variants}
        activeColor={activeColor}
      />
      <div className="space-y-6">
        {childrenBeforeBuy}
        <ProductBuyBox
          productId={productId}
          title={productName}
          image={cartImage}
          href={href}
          variants={variants}
          onColorChange={onColorChange}
        />
        {childrenAfterBuy}
      </div>
    </div>
  );
}
