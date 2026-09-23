"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

export type GalleryImage = {
  url: string;
  alt?: string | null;
  variant_id?: string | null;
};

type VariantLite = { id: string; color?: string | null };

function colorNorm(c: string | null | undefined) {
  return (c || "").trim().replace(/^#/, "").toLowerCase();
}

const FILE_HINTS: Record<string, string[]> = {
  سفید: ["white"],
  سفيد: ["white"],
  مشکی: ["black"],
  مشکي: ["black"],
  سیاه: ["black"],
  آبی: ["blue"],
  ابي: ["blue"],
};

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

    if (variants.length) {
      const ids = new Set(
        variants.filter((v) => colorNorm(v.color) === want).map((v) => v.id),
      );
      const byVar = all.filter(
        (img) => img.variant_id && ids.has(img.variant_id),
      );
      if (byVar.length) return byVar;
    }

    const hints = FILE_HINTS[activeColor.trim()] ?? FILE_HINTS[want] ?? [];
    if (hints.length) {
      const byUrl = all.filter((img) =>
        hints.some((h) => img.url.toLowerCase().includes(h)),
      );
      if (byUrl.length) return byUrl;
    }
    return all;
  }, [images, variants, activeColor]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  // فوری ریست ایندکس وقتی رنگ عوض شد
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
      <div className="bg-muted text-muted-foreground relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl">
        بدون تصویر
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-muted relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-2xl border-0 p-0 text-left"
        aria-label="بزرگ‌نمایی تصویر"
      >
        {/* key=url → تعویض فوری بدون crossfade کند */}
        <Image
          key={current!.url}
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
                "relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                i === idx ? "border-secondary" : "border-transparent opacity-80",
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
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
          {list.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute top-1/2 right-3 z-[101] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="بعدی"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute top-1/2 left-3 z-[101] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="قبلی"
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
              key={current!.url}
              src={current!.url}
              alt={current!.alt ?? productName}
              className="max-h-[90vh] max-w-[95vw] object-contain"
              style={{ filter: "none" }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
