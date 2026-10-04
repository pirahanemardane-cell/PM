"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePhone, isValidIranianPhone } from "@/lib/numbers";

export function NewsletterSmsBox() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(false);
    const normalized = normalizePhone(phone);
    if (!isValidIranianPhone(normalized)) {
      setMsg("شماره موبایل معتبر نیست");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        status?: string;
        retryAfterSec?: number;
      };
      if (res.status === 429) {
        setMsg(
          data.retryAfterSec
            ? `تعداد درخواست زیاد است. ${data.retryAfterSec} ثانیه بعد دوباره تلاش کنید.`
            : "تعداد درخواست زیاد است. کمی بعد دوباره تلاش کنید.",
        );
        return;
      }
      if (!res.ok || !data.ok) {
        if (data.error === "invalid_phone") {
          setMsg("شماره موبایل معتبر نیست");
        } else {
          setMsg("ثبت ناموفق بود. دوباره تلاش کنید.");
        }
        return;
      }
      setOk(true);
      if (data.status === "already") {
        setMsg("این شماره از قبل عضو است.");
      } else if (data.status === "resubscribed") {
        setMsg("عضویت دوباره فعال شد.");
      } else {
        setMsg("با موفقیت عضو شدید. از تخفیف‌ها باخبرتان می‌کنیم.");
      }
      setPhone("");
    } catch {
      setMsg("خطای شبکه. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-card space-y-4 rounded-2xl border p-5">
      <h2 className="text-lg font-bold text-primary">از آخرین تخفیف‌ها باخبر شوید</h2>
      <p className="text-muted-foreground text-sm leading-7">
        شماره موبایل خود را وارد کنید تا از تخفیف‌ها و پیشنهادهای ویژه مطلع شوید.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          inputMode="tel"
          className="flex-1"
          disabled={busy}
          autoComplete="tel"
        />
        <Button type="submit" disabled={busy}>
          {busy ? "…" : "عضویت"}
        </Button>
      </form>
      {msg ? (
        <p
          className={
            ok
              ? "text-primary text-xs"
              : "text-muted-foreground text-xs text-destructive"
          }
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
