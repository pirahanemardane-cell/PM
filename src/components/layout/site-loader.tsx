"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LumaSpin } from "@/components/ui/luma-spin";

/**
 * لودینگ تمام‌صفحه در سراسر فروشگاه:
 * — بک‌گراند = secondary
 * — اسپین = primary
 * تا وقتی روشن است، روی همه‌چیز (هدر/فوتر/محتوا) می‌نشیند.
 */
export function SiteLoader() {
  const pathname = usePathname();
  const [show, setShow] = useState(true);

  // ورود اول
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  // هر تغییر مسیر
  useEffect(() => {
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 500);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (!show) return null;

  return (
    <div
      className="bg-secondary fixed inset-0 z-[9999] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری"
    >
      <LumaSpin />
    </div>
  );
}
