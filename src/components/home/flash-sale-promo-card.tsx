"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Percent } from "lucide-react";
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
        "group bg-card border-border hover:border-primary flex h-full min-h-[360px] w-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors",
        className,
      )}
      dir="rtl"
    >
      <div className="from-primary/15 via-secondary/10 to-muted relative flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br p-5 text-center">
        <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-md ring-4 ring-primary/20 sm:size-20">
          <Percent className="size-8 sm:size-10" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
          <h3 className="text-primary text-xl font-black tracking-tight sm:text-2xl">
            فروش ویژه
          </h3>
          <p className="text-muted-foreground text-xs font-medium sm:text-sm">
            پیشنهاد شگفت‌انگیز · تا پایان زمان
          </p>
        </div>
      </div>

      <div className="border-border space-y-2 border-t px-3 py-3">
        <p className="text-muted-foreground text-center text-[11px] font-medium">
          {cd && cd.done ? "پایان یافته" : endsAt ? "زمان باقی‌مانده" : "زمان‌بندی به‌زودی"}
        </p>
        {cd && !cd.done ? (
          <div className="grid grid-cols-4 gap-1.5" dir="ltr">
            {[
              { label: "ثانیه", value: pad(cd.seconds) },
              { label: "دقیقه", value: pad(cd.minutes) },
              { label: "ساعت", value: pad(cd.hours) },
              { label: "روز", value: pad(cd.days) },
            ].map((u) => (
              <div
                key={u.label}
                className="bg-muted/70 flex flex-col items-center rounded-xl px-1 py-1.5"
              >
                <span className="text-foreground text-sm font-bold tabular-nums sm:text-base">
                  {u.value}
                </span>
                <span className="text-muted-foreground text-[10px]">{u.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center text-xs">
            {endsAt ? "این فروش به پایان رسیده" : "از پنل ادمین زمان پایان را تنظیم کنید"}
          </p>
        )}
        <span className="bg-primary text-primary-foreground mt-1 flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition-opacity group-hover:opacity-90">
          مشاهده همه
        </span>
      </div>
    </Link>
  );
}
