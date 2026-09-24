type SpecRow = { label: string; value: string };

/** جدول مشخصات پیراهن — فقط اگر داده باشد */
export function ProductSpecs({ rows }: { rows: SpecRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="border-t pt-6" dir="rtl">
      <h2 className="mb-3 font-semibold text-primary">مشخصات</h2>
      <dl className="divide-border divide-y rounded-2xl border text-sm">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start justify-between gap-4 px-4 py-2.5"
          >
            <dt className="text-muted-foreground shrink-0">{r.label}</dt>
            <dd className="text-left font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
