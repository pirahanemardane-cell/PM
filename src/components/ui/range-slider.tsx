"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const valueToPercent = (value: number, min: number, max: number) => {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
};

function formatToman(value: number) {
  const n = Math.round(value);
  const withSep = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u066C");
  return withSep.replace(/\d/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[Number(d)]);
}

export interface PriceRangeSliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  data?: number[];
  min?: number;
  max?: number;
  step?: number;
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  showTitle?: boolean;
  showCards?: boolean;
}

const PriceRangeSlider = React.forwardRef<HTMLDivElement, PriceRangeSliderProps>(
  (
    {
      className,
      data,
      min = 0,
      max = 50_000_000,
      step = 50_000,
      value,
      defaultValue,
      onValueChange,
      showTitle = false,
      showCards = true,
      ...props
    },
    ref
  ) => {
    const initial: [number, number] = defaultValue ?? [min, max];
    const [localValues, setLocalValues] = React.useState<[number, number]>(value ?? initial);
    const [isMinThumbDragging, setIsMinThumbDragging] = React.useState(false);
    const [isMaxThumbDragging, setIsMaxThumbDragging] = React.useState(false);
    const sliderRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (value) setLocalValues(value);
    }, [value?.[0], value?.[1]]);

    const [minVal, maxVal] = localValues;
    const minPercent = valueToPercent(minVal, min, max);
    const maxPercent = valueToPercent(maxVal, min, max);

    const bars = React.useMemo(() => {
      if (data && data.length > 0) return data;
      const len = 40;
      const arr = Array.from({ length: len }, (_, i) => {
        const t = i / (len - 1);
        return 0.25 + 0.55 * Math.sin(Math.PI * t) + 0.15 * Math.sin(4 * Math.PI * t);
      });
      const m = Math.max(...arr, 0.01);
      return arr.map((v) => v / m);
    }, [data]);

    const handleValueChange = React.useCallback(
      (newValues: [number, number]) => {
        const clamped: [number, number] = [
          Math.max(min, Math.min(newValues[0], newValues[1] - step)),
          Math.min(max, Math.max(newValues[1], newValues[0] + step)),
        ];
        setLocalValues(clamped);
        onValueChange?.(clamped);
      },
      [onValueChange, min, max, step]
    );

    React.useEffect(() => {
      const handleMouseMove = (event: MouseEvent | TouchEvent) => {
        if (!sliderRef.current) return;
        if (!isMinThumbDragging && !isMaxThumbDragging) return;
        const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
        const rect = sliderRef.current.getBoundingClientRect();
        const raw = ((clientX - rect.left) / rect.width) * 100;
        const percent = Math.max(0, Math.min(100, 100 - raw));
        const newValue = Math.round((min + (percent / 100) * (max - min)) / step) * step;
        if (isMinThumbDragging) handleValueChange([Math.min(newValue, maxVal - step), maxVal]);
        if (isMaxThumbDragging) handleValueChange([minVal, Math.max(newValue, minVal + step)]);
      };
      const handleMouseUp = () => {
        setIsMinThumbDragging(false);
        setIsMaxThumbDragging(false);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleMouseMove, { passive: true } as AddEventListenerOptions);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("touchmove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }, [isMinThumbDragging, isMaxThumbDragging, min, max, step, minVal, maxVal, handleValueChange]);

    return (
      <div className={cn("w-full px-1", className)} {...props} ref={ref} dir="rtl">
        {showTitle ? (
          <div className="mb-4 text-center">
            <h3 className="text-foreground text-sm font-medium">محدوده قیمت</h3>
          </div>
        ) : null}
        <div className="relative h-16 w-full" ref={sliderRef}>
          <div className="absolute inset-x-0 bottom-3 top-0 flex items-end gap-px">
            {bars.map((v, index) => {
              const barPercent = (index / Math.max(bars.length - 1, 1)) * 100;
              const isInRange = barPercent >= minPercent && barPercent <= maxPercent;
              return (
                <div
                  key={index}
                  className={cn(
                    "w-full rounded-t-sm transition-colors duration-200",
                    isInRange ? "bg-secondary" : "bg-muted"
                  )}
                  style={{ height: `${Math.max(8, v * 100)}%` }}
                />
              );
            })}
          </div>
          <div className="bg-muted absolute inset-x-0 bottom-2 h-1 rounded-full" />
          <div
            className="bg-secondary absolute bottom-2 h-1 rounded-full"
            style={{ right: `${minPercent}%`, left: `${100 - maxPercent}%` }}
          />
          <button
            type="button"
            role="slider"
            aria-valuemin={min}
            aria-valuemax={maxVal - step}
            aria-valuenow={minVal}
            aria-label="حداقل قیمت"
            onMouseDown={() => setIsMinThumbDragging(true)}
            onTouchStart={() => setIsMinThumbDragging(true)}
            className="border-secondary bg-background absolute bottom-0 z-10 h-5 w-5 -translate-x-1/2 translate-y-1/2 cursor-pointer rounded-full border-2 shadow-sm"
            style={{ right: `${minPercent}%`, left: "auto" }}
          />
          <button
            type="button"
            role="slider"
            aria-valuemin={minVal + step}
            aria-valuemax={max}
            aria-valuenow={maxVal}
            aria-label="حداکثر قیمت"
            onMouseDown={() => setIsMaxThumbDragging(true)}
            onTouchStart={() => setIsMaxThumbDragging(true)}
            className="border-secondary bg-background absolute bottom-0 z-10 h-5 w-5 -translate-x-1/2 translate-y-1/2 cursor-pointer rounded-full border-2 shadow-sm"
            style={{ right: `${maxPercent}%`, left: "auto" }}
          />
        </div>
        {showCards ? (
          <div className="mt-5 grid grid-cols-2 items-center gap-3">
            <div className="bg-card rounded-lg border p-3 text-center">
              <p className="text-muted-foreground text-xs">حداقل</p>
              <p className="text-card-foreground mt-0.5 text-sm font-semibold tabular-nums">
                {formatToman(minVal)}
                <span className="text-muted-foreground mr-1 text-[10px] font-normal">تومان</span>
              </p>
            </div>
            <div className="bg-card rounded-lg border p-3 text-center">
              <p className="text-muted-foreground text-xs">حداکثر</p>
              <p className="text-card-foreground mt-0.5 text-sm font-semibold tabular-nums">
                {formatToman(maxVal)}
                <span className="text-muted-foreground mr-1 text-[10px] font-normal">تومان</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground mt-3 flex justify-between text-xs tabular-nums">
            <span>{formatToman(minVal)} ت</span>
            <span>{formatToman(maxVal)} ت</span>
          </div>
        )}
      </div>
    );
  }
);
PriceRangeSlider.displayName = "PriceRangeSlider";
export { PriceRangeSlider };
