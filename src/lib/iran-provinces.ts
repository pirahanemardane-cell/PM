/** ۳۱ استان ایران — برای چک‌اوت و پنل مناطق */
export const IRAN_PROVINCES = [
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "اصفهان",
  "البرز",
  "ایلام",
  "بوشهر",
  "تهران",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان رضوی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
] as const;

export type IranProvince = (typeof IRAN_PROVINCES)[number];

/** لینک رهگیری عمومی پست ایران */
export function iranPostTrackingUrl(code: string): string {
  const c = (code || "").trim();
  if (!c) return "https://tracking.post.ir/";
  return `https://tracking.post.ir/?id=${encodeURIComponent(c)}`;
}
