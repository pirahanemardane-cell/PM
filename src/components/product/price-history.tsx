import { toPersianDigits } from "@/lib/numbers";

type Point = { price: number; recorded_at: string };

function fmt(n: number) {
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

/** بلوک تاریخچه قیمت — شبیه ترب: کمینه/بیشینه + sparkline ساده + لیست */
export function PriceHistory({ points }: { points: Point[] }) {
  if (!points.length) return null;

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const last = points[points.length - 1]!;
  const first = points[0]!;
  const range = max - min || 1;

  // sparkline: 80x28 viewBox, points left→right
  const w = 160;
  const h = 36;
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 4) + 2;
    const y = h - 4 - ((p.price - min) / range) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const poly = coords.join(" ");

  const delta = last.price - first.price;
  const deltaLabel =
    Math.abs(delta) < 1
      ? "بدون تغییر از اولین ثبت"
      : delta < 0
        ? `${fmt(Math.abs(delta))} کاهش از اولین ثبت`
        : `${fmt(delta)} افزایش از اولین ثبت`;

  return (
    <div className="border-border space-y-3 rounded-2xl border p-4" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">تاریخچه قیمت</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">{deltaLabel}</p>
        </div>
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={poly}
          />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="bg-muted/50 rounded-xl px-3 py-2">
          <p className="text-muted-foreground">کمینه</p>
          <p className="font-medium">{fmt(min)}</p>
        </div>
        <div className="bg-muted/50 rounded-xl px-3 py-2">
          <p className="text-muted-foreground">بیشینه</p>
          <p className="font-medium">{fmt(max)}</p>
        </div>
        <div className="bg-muted/50 col-span-2 rounded-xl px-3 py-2 sm:col-span-1">
          <p className="text-muted-foreground">آخرین</p>
          <p className="font-medium">{fmt(last.price)}</p>
        </div>
      </div>
      {points.length > 1 ? (
        <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs">
          {[...points].reverse().slice(0, 12).map((p, i) => (
            <li
              key={`${p.recorded_at}-${i}`}
              className="text-muted-foreground flex justify-between gap-2 border-b border-dashed py-1 last:border-0"
            >
              <span>{fmtDate(p.recorded_at)}</span>
              <span className="text-foreground font-medium">{fmt(p.price)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
