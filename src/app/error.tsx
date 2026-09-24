"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center"
      dir="rtl"
    >
      <h2 className="text-2xl font-bold text-primary">خطایی رخ داد</h2>
      <p className="text-muted-foreground">متأسفانه مشکلی پیش آمده است.</p>
      {process.env.NODE_ENV === "development" ? (
        <p className="text-destructive max-w-lg truncate text-xs">{error.message}</p>
      ) : null}
      <Button type="button" onClick={() => reset()}>
        تلاش مجدد
      </Button>
    </div>
  );
}
