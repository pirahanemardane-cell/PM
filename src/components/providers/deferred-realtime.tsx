"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RealtimeBridge = dynamic(
  () =>
    import("@/components/providers/realtime-bridge").then((m) => m.RealtimeBridge),
  { ssr: false },
);

const WishlistSync = dynamic(
  () =>
    import("@/components/providers/wishlist-sync").then((m) => m.WishlistSync),
  { ssr: false },
);

/** بعد از ۲.۵ثانیه یا اولین تعامل */
export function DeferredRealtime() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const enable = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const t = window.setTimeout(enable, 2500);
    window.addEventListener("pointerdown", enable, { once: true, passive: true });
    window.addEventListener("keydown", enable, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, []);

  if (!ready) return null;
  return (
    <>
      <RealtimeBridge />
      <WishlistSync />
    </>
  );
}
