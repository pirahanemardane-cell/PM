"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePhone, isValidIranianPhone } from "@/lib/numbers";

export function NewsletterSmsBox() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    if (!isValidIranianPhone(normalized)) {
      setMsg("شماره موبایل معتبر نیست");
      return;
    }
    // دمو — بعداً به سرویس SMS وصل می‌شود
    setMsg("ثبت شد (حالت دمو)");
  }

  return (
    <div className="bg-card space-y-4 rounded-2xl border p-5">
      <h2 className="text-lg font-bold">از آخرین تخفیف‌ها باخبر شوید</h2>
      <p className="text-muted-foreground text-sm leading-7">
        شماره موبایل خود را وارد کنید (اعداد فارسی هم پذیرفته می‌شود).
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          inputMode="tel"
          className="flex-1"
        />
        <Button type="submit">عضویت</Button>
      </form>
      {msg && <p className="text-muted-foreground text-xs">{msg}</p>}
    </div>
  );
}
