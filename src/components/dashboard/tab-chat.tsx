"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function toWhatsAppDigits(raw: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  let s = raw.trim().replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  s = s.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (s.startsWith("0") && !s.startsWith("00")) s = `98${s.slice(1)}`;
  if (s.startsWith("+")) s = s.slice(1);
  return s;
}

export function TabChat() {
  const [wa, setWa] = useState<string | null>(null);
  const [label, setLabel] = useState("مشاوره واتساپ");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/store-contact", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setWa(data.whatsapp || "");
          if (data.chatLabel) setLabel(data.chatLabel);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  const digits = wa ? toWhatsAppDigits(wa) : "";
  const href = digits ? `https://wa.me/${digits}` : null;

  return (
    <div className="mx-auto max-w-md space-y-4" dir="rtl">
      <h2 className="text-base font-bold text-primary">مشاوره فروش</h2>
      <p className="text-muted-foreground text-sm">
        برای راهنمایی سایز، موجودی و سفارش با تیم فروش گفتگو کنید.
      </p>
      {loading ? (
        <p className="text-sm">…</p>
      ) : href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 inline-flex rounded-xl px-4 py-3 text-sm font-medium text-white"
        >
          {label}
        </a>
      ) : (
        <p className="text-muted-foreground text-sm">
          لینک واتساپ هنوز توسط فروشگاه تنظیم نشده. از{" "}
          <Link href="/داشبورد?tab=tickets" className="underline">
            تیکت پشتیبانی
          </Link>{" "}
          یا{" "}
          <Link href="/تماس" className="underline">
            تماس
          </Link>{" "}
          استفاده کنید.
        </p>
      )}
    </div>
  );
}
