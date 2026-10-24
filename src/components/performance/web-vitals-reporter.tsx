"use client";

import { useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

type Metric = {
  name: string;
  value: number;
  id: string;
  rating?: string;
  delta?: number;
  navigationType?: string;
};

function sendToApi(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    path: typeof window !== "undefined" ? window.location.pathname : "",
  });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/vitals", blob);
      return;
    }
  } catch {
    /* fall through */
  }
  void fetch("/api/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * جمع‌آوری CWV در production + Vercel Speed Insights
 * آماده‌سازی قبل از ایندکس — بدون وابستگی به Storybook
 */
export function WebVitalsReporter() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import("web-vitals");
        if (cancelled) return;
        const report = (m: Metric) => sendToApi(m);
        onCLS(report);
        onINP(report);
        onLCP(report);
        onFCP(report);
        onTTFB(report);
      } catch (e) {
        console.warn("[web-vitals]", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <SpeedInsights />;
}
