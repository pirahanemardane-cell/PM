"use client";

import { useMemo, useState } from "react";
import { toPersianDigits } from "@/lib/numbers";

export type PricePoint = { price: number; recorded_at: string };

function fmtPrice(n: number) {
  return toPersianDigits(Math.round(n).toLocaleString("en-US")) + " تومان";
}

function fmtDate(iso: string) {
  try {
    return toPersianDigits(
      new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    );
  } catch {
    return iso;
  }
}

type RangeKey = "1m" | "3m" | "6m" | "all";

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "1m", label: "۱ ماه", days: 30 },
  { key: "3m", label: "۳ ماه", days: 90 },
  { key: "6m", label: "۶ ماه", days: 180 },
  { key: "all", label: "همه", days: null },
];

/** استاندارد: محور X = تاریخ ، محور Y = قیمت (مشابه ترب) */
export function PriceHistory({ points }: { points: PricePoint[] }) {
  const [range, setRange] = useState<RangeKey>("all");

  const filtered = useMemo(() => {
    if (!points.length) return [];
    const sorted = [...points].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );
    const cfg = RANGES.find((r) => r.key === range);
    if (!cfg?.days) return sorted;
    const cutoff = Date.now() - cfg.days * 86400000;
    const sliced = sorted.filter(
      (p) => new Date(p.recorded_at).getTime() >= cutoff,
    );
    return sliced.length ? sliced : sorted.slice(-1);
  }, [points, range]);

  if (!points.length) return null;

  const prices = filtered.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const last = filtered[filtered.length - 1]!;
  const first = filtered[0]!;
  const priceRange = max - min || 1;

  const w = 320;
  const h = 140;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 28;

  const coords = filtered.map((p, i) => {
    const x =
      filtered.length === 1
        ? w / 2
        : padL + (i / (filtered.length - 1)) * (w - padL - padR);
    const y =
      h - padB - ((p.price - min) / priceRange) * (h - padT - padB);
    return { x, y, ...p };
  });

  const linePoints = coords
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const areaPoints = [
    `${coords[0]!.x.toFixed(1)},${(h - padB).toFixed(1)}`,
    ...coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`),
    `${coords[coords.length - 1]!.x.toFixed(1)},${(h - padB).toFixed(1)}`,
  ].join(" ");

  const delta = last.price - first.price;
  const trendDown = delta < -0.5;
  const trendUp = delta > 0.5;

  return (
    <section
      className="border-border bg-card space-y-4 rounded-2xl border p-4 shadow-sm"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">نمودار تغییر قیمت</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            محور افقی: تاریخ · محور عمودی: قیمت
          </p>
        </div>
        <div className="bg-muted/60 flex flex-wrap gap-1 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={
                range === r.key
                  ? "bg-background text-foreground rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground rounded-lg px-2.5 py-1 text-xs"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-muted/40 rounded-xl px-2 py-2.5">
          <p className="text-muted-foreground mb-0.5">کمترین</p>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            {fmtPrice(min)}
          </p>
        </div>
        <div className="bg-muted/40 rounded-xl px-2 py-2.5">
          <p className="text-muted-foreground mb-0.5">بیشترین</p>
          <p className="font-semibold text-rose-700 dark:text-rose-400">
            {fmtPrice(max)}
          </p>
        </div>
        <div className="bg-muted/40 rounded-xl px-2 py-2.5">
          <p className="text-muted-foreground mb-0.5">آخرین</p>
          <p className="font-semibold">{fmtPrice(last.price)}</p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-muted/30 to-transparent">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-36 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="نمودار قیمت"
        >
          {[0.25, 0.5, 0.75].map((g) => {
            const y = padT + g * (h - padT - padB);
            return (
              <line
                key={g}
                x1={padL}
                x2={w - padR}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
            );
          })}
          <polygon
            points={areaPoints}
            className={
              trendDown
                ? "fill-emerald-500/15"
                : trendUp
                  ? "fill-rose-500/15"
                  : "fill-sky-500/15"
            }
          />
          <polyline
            fill="none"
            points={linePoints}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className={
              trendDown
                ? "stroke-emerald-600 dark:stroke-emerald-400"
                : trendUp
                  ? "stroke-rose-600 dark:stroke-rose-400"
                  : "stroke-sky-600 dark:stroke-sky-400"
            }
          />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={i === coords.length - 1 ? 4 : 2.5}
              className={
                trendDown
                  ? "fill-emerald-600 dark:fill-emerald-400"
                  : trendUp
                    ? "fill-rose-600 dark:fill-rose-400"
                    : "fill-sky-600 dark:fill-sky-400"
              }
            />
          ))}
        </svg>
        <div className="text-muted-foreground flex justify-between px-2 pb-2 text-[10px]">
          <span>{fmtDate(first.recorded_at)}</span>
          <span>{fmtDate(last.recorded_at)}</span>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        {Math.abs(delta) < 1
          ? "در این بازه تغییر محسوسی ثبت نشده است."
          : delta < 0
            ? `کاهش ${fmtPrice(Math.abs(delta))} نسبت به ابتدای بازه`
            : `افزایش ${fmtPrice(delta)} نسبت به ابتدای بازه`}
      </p>

      {filtered.length > 1 ? (
        <ul className="max-h-36 space-y-0 overflow-y-auto rounded-xl border text-xs">
          {[...filtered]
            .reverse()
            .slice(0, 10)
            .map((p, i) => (
              <li
                key={`${p.recorded_at}-${i}`}
                className="flex items-center justify-between gap-2 border-b px-3 py-2 last:border-0"
              >
                <span className="text-muted-foreground">{fmtDate(p.recorded_at)}</span>
                <span className="font-medium">{fmtPrice(p.price)}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}
