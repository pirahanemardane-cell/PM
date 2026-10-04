"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RealtimeBridge = dynamic(
  () => import("@/components/providers/realtime-bridge").then((m) => m.RealtimeBridge),
  { ssr: false },
);

const WishlistSync = dynamic(
  () => import("@/components/providers/wishlist-sync").then((m) => m.WishlistSync),
  { ssr: false },
);

/** Realtime و wishlist را بعد از تعامل/۲ثانیه لود کن تا FCP/TTI بهتر شود */
export function DeferredRealtime() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const enable = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const t = window.setTimeout(enable, 2000);
    const onInteract = () => enable();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("scroll", onInteract, { once: true, passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("scroll", onInteract);
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
