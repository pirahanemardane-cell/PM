"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-bold">خطای غیرمنتظره</h1>
          <p className="text-sm opacity-80">لطفاً صفحه را دوباره بارگذاری کنید.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  );
}
