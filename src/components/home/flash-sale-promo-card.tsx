"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { toPersianDigits } from "@/lib/numbers";
import { cn } from "@/lib/utils";

type Props = {
  endsAt?: string | null;
  href?: string;
  className?: string;
};

function pad(n: number) {
  return toPersianDigits(String(Math.max(0, n)).padStart(2, "0"));
}

function useCountdown(endsAt: string | null | undefined) {
  const target = useMemo(() => {
    if (!endsAt) return null;
    const t = new Date(endsAt).getTime();
    return Number.isNaN(t) ? null : t;
  }, [endsAt]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = Math.max(0, target - now);
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

export function FlashSalePromoCard({
  endsAt,
  href = "/products?featured=true",
  className,
}: Props) {
  const cd = useCountdown(endsAt);

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full min-h-[360px] w-full flex-col overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500 text-white shadow-sm transition-transform hover:-translate-y-0.5 dark:border-rose-900/50",
        className,
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5 fill-current" />
          فروش ویژه
        </span>
        <div className="space-y-1">
          <h3 className="font-iranyekan-heavy text-xl leading-8 sm:text-2xl">
            پیشنهاد شگفت‌انگیز
          </h3>
          <p className="text-sm leading-6 text-white/90">
            تا پایان زمان، تخفیف‌های محدود
          </p>
        </div>
        {cd && !cd.done ? (
          <div className="grid w-full max-w-[220px] grid-cols-4 gap-1.5" dir="ltr">
            {[
              { label: "روز", value: pad(cd.days) },
              { label: "ساعت", value: pad(cd.hours) },
              { label: "دقیقه", value: pad(cd.minutes) },
              { label: "ثانیه", value: pad(cd.seconds) },
            ].map((u) => (
              <div
                key={u.label}
                className="rounded-xl bg-black/20 px-1 py-2 backdrop-blur-sm"
              >
                <div className="font-iranyekan-heavy text-base tabular-nums sm:text-lg">
                  {u.value}
                </div>
                <div className="mt-0.5 text-[10px] text-white/80">{u.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-black/20 px-3 py-2 text-xs text-white/90">
            {endsAt ? "این فروش به پایان رسیده" : "زمان‌بندی به‌زودی"}
          </p>
        )}
        <span className="mt-1 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition group-hover:bg-white/95">
          مشاهده همه
        </span>
      </div>
    </Link>
  );
}
