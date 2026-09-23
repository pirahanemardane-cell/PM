"use client";

import { useCallback, useState } from "react";
import { ProductGallery, type GalleryImage } from "@/components/product/product-gallery";
import {
  ProductBuyBox,
  type VariantOpt,
} from "@/components/product/product-buy-box";

type Props = {
  productId: string;
  productName: string;
  href: string;
  images: GalleryImage[];
  variants: VariantOpt[];
  fallbackImage?: string;
};

export function ProductPdpMedia({
  productId,
  productName,
  href,
  images,
  variants,
  fallbackImage,
}: Props) {
  const [activeColor, setActiveColor] = useState<string | null>(
    variants.find((v) => v.color)?.color ?? null,
  );

  const onColorChange = useCallback((c: string) => {
    setActiveColor(c || null);
  }, []);

  return (
    <>
      <ProductGallery
        productName={productName}
        images={images}
        variants={variants.map((v) => ({ id: v.id, color: v.color }))}
        activeColor={activeColor}
      />
      {/* buy-box در ستون راست صفحه قرار می‌گیرد — این کامپوننت فقط state را نگه می‌دارد
          اگر buy-box جدا رندر شود، از همین state از طریق props مشترک استفاده کنید.
          برای سادگی: فقط gallery اینجا؛ buy-box از page با onColorChange جدا. */}
    </>
  );
}

/** نسخهٔ یکپارچه: گالری + باکس خرید با state مشترک رنگ */
export function ProductPdpGalleryAndBuy({
  productId,
  productName,
  href,
  images,
  variants,
  fallbackImage,
  childrenBeforeBuy,
  childrenAfterBuy,
}: Props & {
  childrenBeforeBuy?: React.ReactNode;
  childrenAfterBuy?: React.ReactNode;
}) {
  const [activeColor, setActiveColor] = useState<string | null>(
    variants.find((v) => v.color)?.color ?? null,
  );

  const onColorChange = useCallback((c: string) => {
    setActiveColor(c || null);
  }, []);

  // تصویر پیش‌فرض سبد = اولین تصویر رنگ فعال
  const cartImage = (() => {
    if (!activeColor) return fallbackImage;
    const want = activeColor.trim().replace(/^#/, "").toLowerCase();
    const ids = new Set(
      variants
        .filter(
          (v) =>
            (v.color || "").trim().replace(/^#/, "").toLowerCase() === want,
        )
        .map((v) => v.id),
    );
    const hit = images.find((i) => i.variant_id && ids.has(i.variant_id));
    return hit?.url ?? fallbackImage;
  })();

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery
        productName={productName}
        images={images}
        variants={variants.map((v) => ({ id: v.id, color: v.color }))}
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
