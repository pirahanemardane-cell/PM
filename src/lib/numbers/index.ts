/**
 * تبدیل اعداد فارسی و عربی به لاتین
 */
export function toEnglishDigits(value: string): string {
  if (!value) return value;

  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  return value
    .split("")
    .map((char) => {
      const persianIndex = persianDigits.indexOf(char);
      if (persianIndex > -1) return String(persianIndex);

      const arabicIndex = arabicDigits.indexOf(char);
      if (arabicIndex > -1) return String(arabicIndex);

      return char;
    })
    .join("");
}

/**
 * تبدیل اعداد لاتین به فارسی
 */
export function toPersianDigits(value: string | number): string {
  if (value === null || value === undefined) return "";

  const str = String(value);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  return str.replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

/**
 * نرمال‌سازی شماره موبایل ایرانی
 * پشتیبانی از اعداد فارسی + حذف فاصله و خط تیره
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";

  let normalized = toEnglishDigits(phone);
  normalized = normalized.replace(/[\s\-\(\)]/g, "");

  // تبدیل +98 یا 98 به 0
  if (normalized.startsWith("+98")) {
    normalized = "0" + normalized.slice(3);
  } else if (normalized.startsWith("98") && normalized.length === 12) {
    normalized = "0" + normalized.slice(2);
  }

  return normalized;
}

/**
 * اعتبارسنجی شماره موبایل ایرانی (بعد از نرمال‌سازی)
 */
export function isValidIranianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^09\d{9}$/.test(normalized);
}
