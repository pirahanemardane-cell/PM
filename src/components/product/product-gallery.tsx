"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  const current = list[idx] ?? list[0];

  if (!list.length) {
    return (
      <div className="bg-muted text-muted-foreground relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl">
        بدون تصویر
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-2xl">
        <Image
          src={current!.url}
          alt={current!.alt ?? productName}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
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
    </div>
  );
}
