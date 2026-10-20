"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminHealthCheckAction } from "@/app/admin/actions/health";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

type Health = {
  healthy: boolean;
  latencyMs: number;
  region: string;
  ts: string;
  checks: Record<string, string>;
};

const LABEL: Record<string, string> = {
  app: "اپلیکیشن",
  supabase: "دیتابیس (Supabase)",
  rateLimit: "محدودیت نرخ",
  r2: "فایل‌ها (R2)",
  sentry: "مانیتورینگ (Sentry)",
  cronBackup: "کرون بک‌آپ",
  sms: "پیامک (ملی‌پیامک)",
  searchIndex: "ایندکس گوگل",
};

function badge(v: string) {
  const ok =
    v === "ok" ||
    v === "upstash" ||
    v === "configured" ||
    v === "indexable";
  const warn =
    v === "missing-env" ||
    v === "memory-fallback" ||
    v === "noindex" ||
    v === "skip";
  const cls = ok
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : warn
      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
      : "bg-red-500/15 text-red-700 dark:text-red-400";
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>
      {v}
    </span>
  );
}

export default function AdminHealthPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminHealthCheckAction();
    setLoading(false);
    if (!res.ok || !res.health) {
      setError("بررسی سلامت ناموفق بود");
      setHealth(null);
      return;
    }
    setHealth(res.health as Health);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">سلامت سیستم</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            وضعیت سرویس‌های حیاتی فروشگاه
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="border-border rounded-xl border px-3 py-1.5 text-sm"
          >
            تازه‌سازی
          </button>
          <Link
            href="/admin/dashboard"
            className="border-border rounded-xl border px-3 py-1.5 text-sm"
          >
            داشبورد
          </Link>
          <Link
            href="/admin/reports"
            className="border-border rounded-xl border px-3 py-1.5 text-sm"
          >
            گزارش فروش
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : health ? (
        <>
          <div
            className={`rounded-xl border p-4 ${
              health.healthy
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-red-500/40 bg-red-500/10"
            }`}
          >
            <p className="font-semibold">
              {health.healthy ? "سیستم سالم است" : "مشکل در یک یا چند سرویس"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              تأخیر: {toPersianDigits(String(health.latencyMs))} ms · منطقه:{" "}
              {health.region} ·{" "}
              {health.ts ? formatJalaliDateTime(health.ts) : ""}
            </p>
          </div>

          <ul className="space-y-2">
            {Object.entries(health.checks).map(([k, v]) => (
              <li
                key={k}
                className="border-border flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
              >
                <span>{LABEL[k] || k}</span>
                {badge(v)}
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground text-xs leading-6">
            <strong>noindex</strong> یعنی سایت هنوز برای گوگل ایندکس نمی‌شود
            (عمدی تا لانچ). <strong>missing-env</strong> یعنی متغیر محیطی در
            Vercel تنظیم نشده. پیامک تا تکمیل فاز ۱۷ و پترن‌ها کامل عملیاتی
            نیست.
          </p>
        </>
      ) : null}
    </div>
  );
}
