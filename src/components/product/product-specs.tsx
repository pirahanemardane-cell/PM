type SpecRow = { label: string; value: string };

/** جدول مشخصات — فشرده برای ستون خرید / کامل برای پایین صفحه */
export function ProductSpecs({
  rows,
  compact = false,
}: {
  rows: SpecRow[];
  compact?: boolean;
}) {
  if (!rows.length) return null;

  return (
    <div
      className={compact ? "" : "border-t pt-6"}
      dir="rtl"
      aria-label="مشخصات محصول"
    >
      {!compact ? (
        <h2 className="mb-3 text-lg font-semibold text-primary">مشخصات</h2>
      ) : (
        <p className="mb-2 text-sm font-semibold text-primary">مشخصات محصول</p>
      )}
      <div className="border-border overflow-hidden rounded-2xl border bg-card shadow-sm">
        <dl className="divide-border divide-y text-sm">
          {rows.map((r, i) => (
            <div
              key={`${r.label}-${i}`}
              className={
                "grid grid-cols-[minmax(6.5rem,36%)_1fr] items-start gap-3 px-3.5 py-2.5 sm:grid-cols-[9rem_1fr] " +
                (i % 2 === 1 ? "bg-muted/25" : "bg-card")
              }
            >
              <dt className="text-muted-foreground font-medium leading-6">
                {r.label}
              </dt>
              <dd className="text-foreground text-start font-medium leading-6">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
