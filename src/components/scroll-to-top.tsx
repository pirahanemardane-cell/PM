"use client";

import { Suspense, useEffect, useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function forceScrollTop() {
  if (typeof window === "undefined") return;
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {}
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll("[data-scroll-root], [data-panel-scroll], main, .overflow-y-auto, .overflow-auto").forEach((el) => {
    try {
      (el as HTMLElement).scrollTop = 0;
    } catch {}
  });
}

function ScrollToTopInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = pathname + "?" + (searchParams?.toString() ?? "");

  useLayoutEffect(() => {
    forceScrollTop();
    const a = requestAnimationFrame(() => forceScrollTop());
    const t1 = window.setTimeout(forceScrollTop, 0);
    const t2 = window.setTimeout(forceScrollTop, 50);
    const t3 = window.setTimeout(forceScrollTop, 150);
    return () => {
      cancelAnimationFrame(a);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [key]);

  useEffect(() => {
    forceScrollTop();
  }, [key]);

  return null;
}

export function ScrollToTop() {
  return (
    <Suspense fallback={null}>
      <ScrollToTopInner />
    </Suspense>
  );
}
