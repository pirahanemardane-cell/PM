import { format as formatJalali } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

/**
 * فرمت تاریخ شمسی
 * مثال خروجی: ۱۴۰۳/۰۶/۲۵
 */
export function formatJalaliDate(
  date: Date | string | number,
  pattern: string = "yyyy/MM/dd"
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return formatJalali(d, pattern, { locale: faIR });
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
