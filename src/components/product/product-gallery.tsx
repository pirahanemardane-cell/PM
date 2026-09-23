"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

export type GalleryImage = {
  url: string;
  alt?: string | null;
};

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const list = images.filter((i) => i.url);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const current = list[idx] ?? list[0];

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
      if (e.key === "ArrowRight") prev(); // RTL: راست = قبلی بصری
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
        className="bg-muted group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-2xl border-0 p-0 text-left"
        aria-label="بزرگ‌نمایی تصویر"
      >
        <Image
          src={current!.url}
          alt={current!.alt ?? productName}
          fill
          className="object-cover object-center transition group-hover:scale-[1.02]"
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
                alt={img.alt ?? `${productName} ${i + 1}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* لایت‌باکس تمام‌صفحه */}
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="تصویر کامل محصول"
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
                className="absolute top-1/2 right-3 z-[101] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-6"
                aria-label="تصویر بعدی"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute top-1/2 left-3 z-[101] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-6"
                aria-label="تصویر قبلی"
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
              src={current!.url}
              alt={current!.alt ?? productName}
              className="max-h-[90vh] max-w-[95vw] object-contain"
            />
          </div>

          {list.length > 1 ? (
            <p className="text-muted-foreground absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/80">
              {toPersianIndex(idx + 1)} / {toPersianIndex(list.length)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function toPersianIndex(n: number) {
  try {
    return n.toLocaleString("fa-IR");
  } catch {
    return String(n);
  }
}
