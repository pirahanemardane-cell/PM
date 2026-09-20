/** تبدیل ارقام فارسی/عربی به لاتین */
const FA_AR_TO_EN: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

const EN_TO_FA: Record<string, string> = {
  "0": "۰",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
};

export function toEnglishDigits(input: string): string {
  return String(input ?? "").replace(
    /[۰-۹٠-٩]/g,
    (ch) => FA_AR_TO_EN[ch] ?? ch,
  );
}

export function toPersianDigits(input: string | number): string {
  return String(input ?? "").replace(/[0-9]/g, (ch) => EN_TO_FA[ch] ?? ch);
}

/** فقط رقم (بعد از نرمال به لاتین) */
export function digitsOnly(input: string): string {
  return toEnglishDigits(input).replace(/\D/g, "");
}

/**
 * نرمال‌سازی موبایل ایران → 09xxxxxxxxx
 * قبول: ۰۹۱۲…، 0912، +98912، 0098912، 98912
 */
export function normalizeIranMobile(input: string): string | null {
  let d = digitsOnly(input);
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98")) d = d.slice(2);
  if (d.startsWith("9") && d.length === 10) d = `0${d}`;
  if (d.length === 10 && d.startsWith("9")) d = `0${d}`;
  if (!/^09\d{9}$/.test(d)) return null;
  return d;
}

export function isValidIranMobile(input: string): boolean {
  return normalizeIranMobile(input) !== null;
}

/** عدد اعشاری/صحیح از رشته با ارقام فارسی */
export function parseLocaleNumber(input: string): number | null {
  const n = toEnglishDigits(input).replace(/,/g, "").trim();
  if (!n || Number.isNaN(Number(n))) return null;
  return Number(n);
}
