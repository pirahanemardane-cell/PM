"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import NumberFlow from "@number-flow/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toPersianDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

function formatTomanLabel(v: number) {
  const withSep = Math.round(v)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return toPersianDigits(withSep);
}

export type PriceRangeSlider06Props = {
  min?: number;
  max?: number;
  step?: number;
  steps?: number;
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  className?: string;
  /** commit on every change (filters) — default true */
  live?: boolean;
};

export function PriceRangeSlider06({
  min = 0,
  max = 50_000_000,
  step = 50_000,
  steps = 5,
  value,
  defaultValue,
  onValueChange,
  className,
}: PriceRangeSlider06Props) {
  const labels = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < steps; i++) {
      const raw = min + (i * (max - min)) / Math.max(steps - 1, 1);
      const rounded = Math.round((raw - min) / step) * step + min;
      if (!out.includes(rounded)) out.push(rounded);
    }
    return out;
  }, [min, max, step, steps]);

  const fallbackLow = Math.max(
    min,
    Math.min(max, Math.round((min + (max - min) * 0.0) / step) * step)
  );
  const fallbackHigh = max;

  const [range, setRange] = useState<number[]>(
    value ?? defaultValue ?? [fallbackLow, fallbackHigh]
  );
  const [preview, setPreview] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setRange(value);
  }, [value?.[0], value?.[1]]);

  const [low, high] = range;
  const isDefault = low <= min && high >= max;

  const toPct = (v: number) => ((v - min) / (max - min)) * 100;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    // RTL: mirror
    const rawPct = 1 - (e.clientX - rect.left) / rect.width;
    const raw = rawPct * (max - min) + min;
    setPreview(
      Math.max(min, Math.min(max, Math.round((raw - min) / step) * step + min))
    );
  };

  const commit = (next: number[]) => {
    const pair: [number, number] = [
      Math.min(next[0], next[1]),
      Math.max(next[0], next[1]),
    ];
    setRange(pair);
    onValueChange?.(pair);
  };

  const lowPct = toPct(low);
  const highPct = toPct(high);
  const previewPct = preview !== null ? toPct(preview) : null;

  let ghostLeft = 0;
  let ghostWidth = 0;
  if (previewPct !== null) {
    if (previewPct < lowPct) {
      ghostLeft = previewPct;
      ghostWidth = lowPct - previewPct;
    } else if (previewPct > highPct) {
      ghostLeft = highPct;
      ghostWidth = previewPct - highPct;
    }
  }

  return (
    <div className={cn("mx-auto w-full space-y-4", className)} dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide">
            محدوده قیمت
          </p>
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-foreground text-lg font-bold tabular-nums">
              <NumberFlow value={low} locales="fa-IR" />
            </span>
            <span className="text-muted-foreground text-xs">تومان</span>
            <span className="text-muted-foreground">–</span>
            <span className="text-foreground text-lg font-bold tabular-nums">
              <NumberFlow value={high} locales="fa-IR" />
            </span>
            <span className="text-muted-foreground text-xs">تومان</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => commit([min, max])}
          disabled={isDefault}
          className="text-muted-foreground hover:text-foreground h-8 shrink-0 gap-1 px-2 text-xs"
        >
          <X className="size-3" />
          پاک کردن
        </Button>
      </div>

      <div className="space-y-2">
        <div
          ref={rootRef}
          className="relative w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setPreview(null)}
        >
          <Slider
            value={range}
            onValueChange={(val) => {
              const arr = Array.isArray(val) ? val : [val, val];
              commit([arr[0], arr[1] ?? arr[0]]);
            }}
            min={min}
            max={max}
            step={step}
            minStepsBetweenThumbs={1}
            className="**:data-[slot=slider-track]:h-2 **:[[role=slider]]:transition-transform **:[[role=slider]]:hover:scale-125"
            dir="rtl"
          />
          {previewPct !== null && ghostWidth > 0 ? (
            <div
              className="bg-secondary/30 pointer-events-none absolute top-1/2 z-[1] h-2 -translate-y-1/2 rounded-full transition-[left,width] duration-75"
              style={{
                right: `${ghostLeft}%`,
                width: `${ghostWidth}%`,
                left: "auto",
              }}
            />
          ) : null}
        </div>
        <div className="text-muted-foreground/60 flex justify-between select-none text-[10px] font-medium">
          {labels.map((val) => (
            <span key={val}>{formatTomanLabel(val)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PriceRangeSlider06;
