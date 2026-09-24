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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] lg:gap-8 lg:items-start">
      <div className="min-w-0 w-full overflow-hidden w-full">
        <div className="min-w-0 w-full overflow-hidden">
        <ProductGallery
        productName={productName}
        images={images}
        variants={variants}
        activeColor={activeColor}
      />
        </div>
        </div>
      <div className="space-y-6 w-full max-w-xl lg:justify-self-start lg:max-w-none">
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
