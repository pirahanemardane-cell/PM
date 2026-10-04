"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/content/static-pages";
import { toPersianDigits } from "@/lib/numbers";

export function FaqView({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3" dir="rtl">
      <div className="mb-8 text-center">
        <p className="text-muted-foreground text-sm">
          پاسخ سریع به پرسش‌های پرتکرار خریداران
        </p>
      </div>
      {items.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={`${item.q}-${idx}`}
            className={
              "border-border overflow-hidden rounded-2xl border transition " +
              (isOpen ? "bg-card shadow-sm" : "bg-background hover:bg-muted/40")
            }
          >
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-4 text-right"
              onClick={() => setOpen(isOpen ? null : idx)}
              aria-expanded={isOpen}
            >
              <span className="bg-primary/10 text-primary mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {toPersianDigits(String(idx + 1))}
              </span>
              <span className="flex-1 font-semibold text-primary">{item.q}</span>
              <span className="text-muted-foreground mt-0.5 text-lg leading-none">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div className="text-muted-foreground border-border border-t px-4 py-4 pr-14 text-sm leading-7">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
