/** نرمال‌سازی اسلاگ محصول برای URL و DB */
export function normalizeProductSlug(raw: string): string {
  let s = (raw || "").trim();
  for (let i = 0; i < 2; i++) {
    try {
      const d = decodeURIComponent(s);
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  s = s.replace(/[\u200c\u200e\u200f\ufeff]/g, "");
  try {
    s = s.normalize("NFC");
  } catch {
    /* ignore */
  }
  return s.trim();
}
