export function toPersianDigits(value: string | number): string {
  const str = String(value);
  const map: Record<string, string> = {
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
  return str.replace(/[0-9]/g, (d) => map[d] ?? d);
}

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Normalize Iranian mobile to 09xxxxxxxxx */
export function normalizePhone(input: string): string {
  let phone = toEnglishDigits(input).replace(/[\s\-()]/g, "");
  if (phone.startsWith("+98")) phone = "0" + phone.slice(3);
  if (phone.startsWith("98") && phone.length === 12) phone = "0" + phone.slice(2);
  return phone;
}

export function isValidIranianPhone(input: string): boolean {
  const phone = normalizePhone(input);
  return /^09\d{9}$/.test(phone);
}

/** Alias for checkout & forms — same as normalizePhone, null if invalid */
export function normalizeIranMobile(input: string): string | null {
  const phone = normalizePhone(input);
  return /^09\d{9}$/.test(phone) ? phone : null;
}

export function isValidIranMobile(input: string): boolean {
  return normalizeIranMobile(input) !== null;
}

