"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { colorNorm, colorKey } from "@/lib/variant-availability";

export type GalleryImage = {
  url: string;
  alt?: string | null;
  variant_id?: string | null;
};

type VariantLite = { id: string; color?: string | null };

/**
 * استاندارد فروشگاه‌های بزرگ:
 * - تامب‌نیل = تصاویر گالری محصول (ثابت، وابسته به رنگ نیست)
 * - تصویر بزرگ = عکس واریانت رنگ فعال، وگرنه تامب انتخاب‌شده / اول گالری
 * - لایت‌باکس = ورق زدن بین تصاویر گالری با فلش چپ/راست
 */
export function ProductGallery({
  images,
  productName,
  variants = [],
  activeColor = null,
}: {
  images: GalleryImage[];
  productName: string;
  variants?: VariantLite[];
  activeColor?: string | null;
}) {
  // --- تامب‌نیل: فقط گالری (بدون variant_id) ---
  const thumbs = useMemo(() => {
    const all = images.filter((i) => i.url);
    const galleryOnly = all.filter((i) => !i.variant_id);
    // اگر همه عکس‌ها variant_id دارند، همان all را نشان بده تا خالی نشود
    return galleryOnly.length > 0 ? galleryOnly : all;
  }, [images]);

  // --- عکس واریانت رنگ فعال (فقط برای تصویر بزرگ) ---
  const variantMain = useMemo(() => {
    if (!activeColor) return null;
    const want = colorNorm(activeColor);
    const key = colorKey(activeColor);
    const all = images.filter((i) => i.url);

    if (variants.length) {
      const ids = new Set(
        variants
          .filter((v) => {
            if (!v.color) return false;
            return colorNorm(v.color) === want || colorKey(v.color) === key;
          })
          .map((v) => v.id),
      );
      const byVar = all.find(
        (img) => img.variant_id && ids.has(img.variant_id),
      );
      if (byVar) return byVar;
    }

    // fallback: url شامل نام رنگ
    return (
      all.find((img) => {
        if (!img.variant_id) return false;
        const low = img.url.toLowerCase();
        return (
          low.includes(key) ||
          (key === "white" && low.includes("white")) ||
          (key === "black" && low.includes("black")) ||
          (key === "blue" && low.includes("blue"))
        );
      }) ?? null
    );
  }, [images, variants, activeColor]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  // کاربر خودش تامب زده → اولویت با تامب، نه واریانت
  const [preferThumb, setPreferThumb] = useState(false);

  // با عوض شدن رنگ: دوباره عکس واریانت اولویت دارد
  useEffect(() => {
    setPreferThumb(false);
  }, [activeColor]);

  // وقتی تعداد تامب عوض شد ایندکس را امن نگه دار
  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(0, thumbs.length - 1)));
  }, [thumbs.length]);

  const thumbCurrent =
    thumbs[Math.min(idx, Math.max(0, thumbs.length - 1))] ?? thumbs[0] ?? null;

  // تصویر بزرگ: اگر کاربر تامب نزده و واریانت عکس دارد → واریانت
  const main =
    (!preferThumb && variantMain) || thumbCurrent || variantMain || null;

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(() => {
    setPreferThumb(true);
    setIdx((i) => (thumbs.length ? (i - 1 + thumbs.length) % thumbs.length : 0));
  }, [thumbs.length]);
  const next = useCallback(() => {
    setPreferThumb(true);
    setIdx((i) => (thumbs.length ? (i + 1) % thumbs.length : 0));
  }, [thumbs.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") prev();
      if (e.key === "ArrowLeft") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, prev, next]);

  if (!main) {
    return (
      <div className="bg-muted text-muted-foreground relative flex aspect-[4/5] w-full max-w-full items-center justify-center overflow-hidden rounded-xl lg:aspect-[1/1]">
        بدون تصویر
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      {/* تصویر بزرگ */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-muted relative aspect-[4/5] w-full max-w-full cursor-zoom-in overflow-hidden rounded-xl border-0 p-0 text-left lg:aspect-[1/1]"
        aria-label="بزرگ‌نمایی تصویر"
      >
        <Image
          key={main.url + String(activeColor) + String(preferThumb)}
          src={main.url}
          alt={main.alt ?? productName}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <span className="bg-background/80 text-muted-foreground absolute bottom-3 left-3 rounded-lg px-2 py-1 text-[11px] backdrop-blur-sm">
          کلیک برای مشاهده کامل
        </span>
      </button>

      {/* تامب‌نیل‌ها — همیشه گالری، ثابت با تغییر رنگ */}
      {thumbs.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {thumbs.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => {
                setIdx(i);
                setPreferThumb(true);
              }}
              className={cn(
                "relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 p-0",
                preferThumb && i === idx
                  ? "border-secondary"
                  : "border-transparent opacity-80",
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover p-0"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* لایت‌باکس استاندارد با فلش چپ/راست */}
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 left-4 z-[101] rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="بستن"
          >
            <X className="h-6 w-6" />
          </button>

          {thumbs.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-3 top-1/2 z-[101] -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:right-6"
                aria-label="قبلی"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-3 top-1/2 z-[101] -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:left-6"
                aria-label="بعدی"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            </>
          ) : null}

          <div
            className="relative flex max-h-[90vh] max-w-[95vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={main.url}
              src={main.url}
              alt={main.alt ?? productName}
              className="max-h-[90vh] max-w-[95vw] object-contain"
            />
          </div>

          {thumbs.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-[101] -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {Math.min(idx + 1, thumbs.length)} / {thumbs.length}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
