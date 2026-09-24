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
  const list = useMemo(() => {
    const all = images.filter((i) => i.url);
    if (!activeColor) return all;
    const want = colorNorm(activeColor);
    const key = colorKey(activeColor);

    // 1) variant_id
    if (variants.length) {
      const ids = new Set(
        variants
          .filter((v) => {
            if (!v.color) return false;
            return colorNorm(v.color) === want || colorKey(v.color) === key;
          })
          .map((v) => v.id),
      );
      const byVar = all.filter(
        (img) => img.variant_id && ids.has(img.variant_id),
      );
      if (byVar.length) return byVar;
    }

    // 2) url includes white/black/blue
    const byUrl = all.filter((img) => {
      const low = img.url.toLowerCase();
      return (
        low.includes(key) ||
        (key === "white" && low.includes("white")) ||
        (key === "black" && low.includes("black")) ||
        (key === "blue" && low.includes("blue"))
      );
    });
    if (byUrl.length) return byUrl;

    return all;
  }, [images, variants, activeColor]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIdx(0);
  }, [activeColor]);

  const current = list[Math.min(idx, Math.max(0, list.length - 1))] ?? list[0];
  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(() => {
    setIdx((i) => (list.length ? (i - 1 + list.length) % list.length : 0));
  }, [list.length]);
  const next = useCallback(() => {
    setIdx((i) => (list.length ? (i + 1) % list.length : 0));
  }, [list.length]);

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

  if (!list.length) {
    return (
      <div className="bg-muted text-muted-foreground relative flex aspect-[3/4] w-full max-w-full items-center justify-center overflow-hidden rounded-xl">
        بدون تصویر
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-muted relative aspect-[3/4] w-full max-w-full cursor-zoom-in overflow-hidden rounded-xl border-0 p-0 text-left"
        aria-label="بزرگ‌نمایی تصویر"
      >
        <Image
          key={current!.url + String(activeColor)}
          src={current!.url}
          alt={current!.alt ?? productName}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <span className="bg-background/80 text-muted-foreground absolute bottom-3 left-3 rounded-lg px-2 py-1 text-[11px] backdrop-blur-sm">
          کلیک برای مشاهده کامل
        </span>
      </button>

      {list.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                "relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 p-0",
                i === idx ? "border-secondary" : "border-transparent opacity-80",
              )}
            >
              <Image src={img.url} alt="" fill className="object-cover p-0" sizes="56px" />
            </button>
          ))}
        </div>
      ) : null}

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
          <div
            className="relative flex max-h-[90vh] max-w-[95vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current!.url}
              src={current!.url}
              alt={current!.alt ?? productName}
              className="max-h-[90vh] max-w-[95vw] object-cover"
              style={{ filter: "none" }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
