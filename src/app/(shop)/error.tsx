"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[shop error]", error);
  }, [error]);

  return (
    <main className="container mx-auto flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-bold">مشکلی پیش آمد</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        این بخش موقتاً در دسترس نیست. بقیه فروشگاه همچنان کار می‌کند.
      </p>
      <Button type="button" onClick={reset}>
        تلاش دوباره
      </Button>
    </main>
  );
}
