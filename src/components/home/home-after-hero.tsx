"use client";

import { useEffect, useState } from "react";

export function HomeAfterHero({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onDone = () => setReady(true);
    window.addEventListener("pm:hero-intro-done", onDone);
    return () => window.removeEventListener("pm:hero-intro-done", onDone);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
