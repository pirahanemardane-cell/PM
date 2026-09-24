"use client";

import { useEffect, useState } from "react";

export function HomeAfterHero({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    try {
      done = sessionStorage.getItem("pm-hero-intro-done") === "1";
    } catch {}
    if (done) {
      setReady(true);
      return;
    }
    const onDone = () => setReady(true);
    window.addEventListener("pm:hero-intro-done", onDone);
    return () => window.removeEventListener("pm:hero-intro-done", onDone);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
