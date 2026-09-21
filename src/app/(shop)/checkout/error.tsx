"use client";

import Link from "next/link";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center"
      dir="rtl"
    >
      <h2 className="text-lg font-semibold">خطا در تسویه‌حساب</h2>
      <p className="text-muted-foreground text-sm">
        ثبت سفارش موقتاً کامل نشد. سبد خرید حفظ شده است؛ می‌توانید دوباره تلاش
        کنید یا به فروشگاه برگردید.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <p className="text-destructive max-w-full truncate text-xs">
          {error.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="bg-secondary text-secondary-foreground rounded-xl px-4 py-2 text-sm font-medium"
        >
          تلاش مجدد
        </button>
        <Link
          href="/products"
          className="border-border rounded-xl border px-4 py-2 text-sm"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  );
}
