"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toEnglishDigits } from "@/lib/numbers";

export function OrderTrackBox() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = toEnglishDigits(code).trim();
    if (normalized.length < 4) {
      setMsg("کد رهگیری معتبر نیست");
      return;
    }
    // دمو — بعداً به API سفارش وصل می‌شود
    setMsg(`پیگیری «${normalized}» (حالت دمو)`);
  }

  return (
    <div className="bg-card space-y-4 rounded-2xl border p-5">
      <h2 className="text-lg font-bold">پیگیری سفارش</h2>
      <p className="text-muted-foreground text-sm leading-7">
        بدون ثبت‌نام، با کد رهگیری وضعیت سفارش را ببینید.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="کد رهگیری"
          className="flex-1"
        />
        <Button type="submit" variant="outline">
          پیگیری
        </Button>
      </form>
      {msg && <p className="text-muted-foreground text-xs">{msg}</p>}
    </div>
  );
}
