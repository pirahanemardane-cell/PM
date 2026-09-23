"use client";

import { useMemo, useState } from "react";
import { toPersianDigits } from "@/lib/numbers";

export type PricePoint = { price: number; recorded_at: string };

function fmtPrice(n: number) {
  return toPersianDigits(Math.round(n).toLocaleString("en-US")) + " تومان";
}

function fmtDateShort(iso: string) {
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
 * نمودار شبیه ترب:
 * محور افقی = تاریخ  |  محور عمودی = قیمت
 */
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
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const priceSpan = max - min || 1;

  // فضای رسم با padding برای برچسب محور
  const W = 400;
  const H = 200;
  const padL = 52;
  const padR = 12;
  const padT = 16;
  const padB = 36;

  const times = filtered.map((p) => new Date(p.recorded_at).getTime());
  const tMin = times[0]!;
  const tMax = times[times.length - 1]!;
  const tSpan = tMax - tMin || 1;

  const coords = filtered.map((p) => {
    const t = new Date(p.recorded_at).getTime();
    const x = padL + ((t - tMin) / tSpan) * (W - padL - padR);
    const y = padT + (1 - (p.price - min) / priceSpan) * (H - padT - padB);
    return { x, y, ...p };
  });

  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = [
    `${coords[0]!.x.toFixed(1)},${(H - padB).toFixed(1)}`,
    ...coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`),
    `${coords[coords.length - 1]!.x.toFixed(1)},${(H - padB).toFixed(1)}`,
  ].join(" ");

  const delta = last.price - first.price;
  const trendDown = delta < -0.5;
  const trendUp = delta > 0.5;

  // برچسب‌های محور Y (۳ سطح)
  const yTicks = [min, (min + max) / 2, max];
  // برچسب‌های محور X (اول / وسط / آخر)
  const xTicks =
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

      <div className="bg-muted/20 relative w-full overflow-hidden rounded-xl">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-48 w-full"
          role="img"
          aria-label="نمودار قیمت در زمان"
        >
          {/* شبکه افقی */}
          {yTicks.map((v, i) => {
            const y =
              padT + (1 - (v - min) / priceSpan) * (H - padT - padB);
            return (
              <g key={i}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.55"
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9 }}
                >
                  {toPersianDigits(
                    Math.round(v).toLocaleString("en-US"),
                  )}
                </text>
              </g>
            );
          })}

          {/* ناحیه زیر خط */}
          <polygon
            points={area}
            className={
              trendDown
                ? "fill-emerald-500/15"
                : trendUp
                  ? "fill-rose-500/15"
                  : "fill-sky-500/15"
            }
          />

          {/* خط قیمت */}
          <polyline
            fill="none"
            points={line}
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

          {/* برچسب تاریخ محور X */}
          {xTicks.map((p, i) => {
            const t = new Date(p.recorded_at).getTime();
            const x = padL + ((t - tMin) / tSpan) * (W - padL - padR);
            return (
              <text
                key={i}
                x={x}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {fmtDateShort(p.recorded_at)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          {Math.abs(delta) < 1
            ? "در این بازه تغییر محسوسی ثبت نشده است."
            : delta < 0
              ? `کاهش ${fmtPrice(Math.abs(delta))} نسبت به ابتدای بازه`
              : `افزایش ${fmtPrice(delta)} نسبت به ابتدای بازه`}
        </span>
        <span>میانگین: {fmtPrice(avg)}</span>
      </div>

      {filtered.length > 1 ? (
        <ul className="max-h-36 space-y-0 overflow-y-auto rounded-xl border text-xs">
          {[...filtered]
            .reverse()
            .slice(0, 12)
            .map((p, i) => (
              <li
                key={`${p.recorded_at}-${i}`}
                className="flex items-center justify-between gap-2 border-b px-3 py-2 last:border-0"
              >
                <span className="text-muted-foreground">
                  {fmtDateShort(p.recorded_at)}
                </span>
                <span className="font-medium">{fmtPrice(p.price)}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}
