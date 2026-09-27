"use client";

/**
 * قبلاً تا رویداد intro هیرو null می‌داد و اگر event از دست می‌رفت
 * کل بدنه صفحه اصلی برای همیشه مخفی می‌ماند.
 * الان فقط children را پاس می‌دهد؛ منطق/استایل هیرو و اسکرول‌اسکراب دست نخورده است.
 */
export function HomeAfterHero({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
