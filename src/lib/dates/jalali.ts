import { format as formatJalali, parse as parseJalali } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { toPersianDigits } from "@/lib/numbers";

function toDate(date: Date | string | number): Date | null {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;
  return d;
}

export function formatJalaliDate(
  date: Date | string | number,
  pattern: string = "yyyy/MM/dd"
): string {
  const d = toDate(date);
  if (!d) return "";
  return toPersianDigits(formatJalali(d, pattern, { locale: faIR }));
}

export function formatJalaliDateLong(date: Date | string | number): string {
  return formatJalaliDate(date, "d MMMM yyyy");
}

export function formatJalaliDateTime(date: Date | string | number): string {
  return formatJalaliDate(date, "yyyy/MM/dd - HH:mm");
}

/** input جلالی با رقم لاتین — مثال: 1404/07/06 15:30 */
export function toJalaliInputValue(
  date: Date | string | number | null | undefined
): string {
  const d = date == null ? null : toDate(date);
  if (!d) return "";
  return formatJalali(d, "yyyy/MM/dd HH:mm", { locale: faIR });
}

/** پارس input جلالی → ISO UTC */
export function jalaliInputToIso(value: string): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  const normalized = raw
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/-/g, "/")
    .replace(/\s+/g, " ");
  for (const pat of ["yyyy/MM/dd HH:mm", "yyyy/MM/dd HH:mm:ss", "yyyy/MM/dd"]) {
    const trial = parseJalali(normalized, pat, new Date());
    if (trial instanceof Date && !isNaN(trial.getTime())) {
      return trial.toISOString();
    }
  }
  return null;
}
