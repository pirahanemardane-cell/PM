"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center"
      dir="rtl"
    >
      <h2 className="text-lg font-semibold">خطا در پنل ادمین</h2>
      <p className="text-muted-foreground text-sm">
        این بخش موقتاً در دسترس نیست.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <p className="text-destructive text-xs">{error.message}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="border-border rounded-xl border px-4 py-2 text-sm"
      >
        تلاش دوباره
      </button>
    </div>
  );
}
