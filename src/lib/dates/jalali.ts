import { format as formatJalali } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { toPersianDigits } from "@/lib/numbers";

function toDate(date: Date | string | number): Date | null {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;
  return d;
}

/**
 * فرمت تاریخ شمسی
 * مثال خروجی: ۱۴۰۳/۰۶/۲۵
 */
export function formatJalaliDate(
  date: Date | string | number,
  pattern: string = "yyyy/MM/dd"
): string {
  const d = toDate(date);
  if (!d) return "";
  return toPersianDigits(formatJalali(d, pattern, { locale: faIR }));
}

/**
 * فرمت کامل‌تر تاریخ شمسی
 * مثال: ۲۵ شهریور ۱۴۰۳
 */
export function formatJalaliDateLong(date: Date | string | number): string {
  return formatJalaliDate(date, "d MMMM yyyy");
}

/**
 * فرمت تاریخ + ساعت شمسی
 * مثال: ۱۴۰۳/۰۶/۲۵ - ۱۴:۳۰
 */
export function formatJalaliDateTime(date: Date | string | number): string {
  return formatJalaliDate(date, "yyyy/MM/dd - HH:mm");
}
