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
