"use client";

import { toPersianDigits } from "@/lib/numbers";

type Props = {
  count: number;
  total?: number;
  busy?: boolean;
  onArchive: () => void;
  onHardDelete: () => void;
  onClear: () => void;
  onSelectAll?: () => void;
  archiveLabel?: string;
  hardLabel?: string;
};

export function AdminBulkBar({
  count,
  total = 0,
  busy,
  onArchive,
  onHardDelete,
  onClear,
  onSelectAll,
  archiveLabel = "آرشیو",
  hardLabel = "حذف دائمی",
}: Props) {
  if (total <= 0 && count <= 0) return null;
  const allSelected = total > 0 && count === total;
  return (
    <div className="border-border bg-card sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-sm">
      {onSelectAll && total > 0 ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            disabled={busy}
          />
          <span>
            {allSelected ? "لغو همه" : "انتخاب همه"} (
            {toPersianDigits(String(total))})
          </span>
        </label>
      ) : null}
      {count > 0 ? (
        <>
          <span className="text-sm font-medium">
            {toPersianDigits(String(count))} مورد انتخاب‌شده
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={onArchive}
            className="bg-muted rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {archiveLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onHardDelete}
            className="bg-destructive text-destructive-foreground rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {hardLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClear}
            className="border-border rounded-lg border px-3 py-1.5 text-sm"
          >
            لغو انتخاب
          </button>
        </>
      ) : null}
    </div>
  );
}
