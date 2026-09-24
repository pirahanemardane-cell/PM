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
  childrenBelowGallery?: ReactNode;
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
  childrenBelowGallery,
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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-8 lg:items-start">
      {/* موبایل order-2 | دسکتاپ ستون تصویر */}
      <div className="max-lg:order-2 min-w-0 w-full overflow-hidden">
        <ProductGallery
          productName={productName}
          images={images}
          variants={variants}
          activeColor={activeColor}
        />
        {childrenBelowGallery}
      </div>

      {/* موبایل: contents تا order روی فرزندان | دسکتاپ: ستون محتوا */}
      <div className="max-lg:contents w-full max-w-xl space-y-6 lg:justify-self-start lg:max-w-none">
        <div className="max-lg:order-1 space-y-6">{childrenBeforeBuy}</div>
        <div className="max-lg:order-3">
          <ProductBuyBox
            productId={productId}
            title={productName}
            image={cartImage}
            href={href}
            variants={variants}
            onColorChange={onColorChange}
          />
        </div>
        <div className="max-lg:order-4">{childrenAfterBuy}</div>
      </div>
    </div>
  );
}
