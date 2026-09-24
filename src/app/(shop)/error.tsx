"use client";

export default function ShopError({
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
      <h2 className="text-lg font-semibold text-primary">خطا در این بخش</h2>
      <p className="text-muted-foreground text-sm">
        مشکلی پیش آمد. بقیهٔ سایت در دسترس است.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <p className="text-destructive max-w-full truncate text-xs">
          {error.message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm"
      >
        تلاش دوباره
      </button>
    </div>
  );
}
