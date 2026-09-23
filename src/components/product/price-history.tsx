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

/**
 * نمودار تغییر قیمت
 * محور X = قیمت  |  محور Y = تاریخ (طبق درخواست)
 */
export function PriceHistory({ points }: { points: PricePoint[] }) {
  const [range, setRange] = useState<RangeKey>("3m");

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

  const times = filtered.map((p) => new Date(p.recorded_at).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tRange = tMax - tMin || 1;

  // SVG: X = قیمت ، Y = تاریخ (قدیمی‌تر بالا، جدیدتر پایین)
  const w = 320;
  const h = 160;
  const padL = 56; // جا برای برچسب تاریخ روی Y
  const padR = 12;
  const padT = 12;
  const padB = 36; // جا برای برچسب قیمت روی X

  const coords = filtered.map((p) => {
    const x =
      padL + ((p.price - min) / priceRange) * (w - padL - padR);
    const y =
      padT + ((new Date(p.recorded_at).getTime() - tMin) / tRange) * (h - padT - padB);
    return { x, y, ...p };
  });

  const linePoints = coords
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const delta = last.price - first.price;
  const trendDown = delta < -0.5;
  const trendUp = delta > 0.5;

  // برچسب‌های محور X (قیمت): کمینه، وسط، بیشینه
  const xTicks = [min, (min + max) / 2, max];
  // برچسب‌های محور Y (تاریخ): اول، وسط، آخر
  const yTicks =
    filtered.length === 1
      ? [filtered[0]!]
      : [
          filtered[0]!,
          filtered[Math.floor(filtered.length / 2)]!,
          filtered[filtered.length - 1]!,
        ];

  return (
    <section
      className="border-border bg-card space-y-4 rounded-2xl border p-4 shadow-sm"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">نمودار تغییر قیمت</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            محور افقی: قیمت · محور عمودی: تاریخ
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

      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-muted/30 to-transparent px-1 pt-1">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-40 w-full"
          role="img"
          aria-label="نمودار قیمت: محور افقی قیمت، محور عمودی تاریخ"
        >
          {/* خطوط راهنما افقی (تاریخ) */}
          {yTicks.map((pt, i) => {
            const y =
              padT +
              ((new Date(pt.recorded_at).getTime() - tMin) / tRange) *
                (h - padT - padB);
            return (
              <g key={`y-${i}`}>
                <line
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
                <text
                  x={padL - 4}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9 }}
                >
                  {fmtDate(pt.recorded_at)}
                </text>
              </g>
            );
          })}

          {/* خطوط راهنما عمودی (قیمت) */}
          {xTicks.map((price, i) => {
            const x = padL + ((price - min) / priceRange) * (w - padL - padR);
            return (
              <g key={`x-${i}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={padT}
                  y2={h - padB}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.35"
                />
                <text
                  x={x}
                  y={h - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9 }}
                >
                  {toPersianDigits(Math.round(price).toLocaleString("en-US"))}
                </text>
              </g>
            );
          })}

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
        <div className="text-muted-foreground flex justify-between px-2 pb-1 text-[10px]">
          <span>قیمت ←</span>
          <span>تاریخ ↓</span>
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
