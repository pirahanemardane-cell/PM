"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  adminSendNotificationAction,
  PREDEFINED_NOTIFICATIONS,
} from "@/app/admin/actions/notifications-admin";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";

export default function AdminNotificationsPage() {
  const templates = useMemo(() => PREDEFINED_NOTIFICATIONS ?? [], []);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [mode, setMode] = useState<"user" | "all">("user");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    const res = await adminSendNotificationAction({
      templateId,
      mode,
      target: mode === "user" ? target : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        auth: "ورود لازم است",
        forbidden: "دسترسی ادمین ندارید",
        template: "قالب نامعتبر",
        target_required: "شماره یا شناسه کاربر لازم است",
        user_not_found: "کاربر پیدا نشد",
      };
      setErr(map[res.error] ?? res.error ?? "ارسال ناموفق");
      return;
    }
    const sent = "sent" in res ? Number(res.sent) : 1;
    setMsg(`ارسال شد: ${toPersianDigits(String(sent))} مورد`);
    if (mode === "user") setTarget("");
  }

  const selected = templates.find((t) => t.id === templateId);

  return (
    <div className="bg-background min-h-screen space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">اعلان‌ها</h1>
          <p className="text-muted-foreground text-sm">
            ارسال قالب‌های از پیش‌تعریف‌شده به کاربر یا همه
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="border-border rounded-xl border px-4 py-2 text-sm"
        >
          داشبورد
        </Link>
      </div>

      <form
        onSubmit={onSend}
        className="border-border space-y-4 rounded-2xl border p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">قالب</span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
              required
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">گیرنده</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "user" | "all")}
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
            >
              <option value="user">یک کاربر (موبایل / id)</option>
              <option value="all">همه کاربران (حداکثر ۵۰۰۰)</option>
            </select>
          </label>
        </div>

        {mode === "user" ? (
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">موبایل یا شناسه</span>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="09xxxxxxxxx"
              className="border-border bg-background w-full rounded-xl border px-3 py-2"
              dir="ltr"
              required
            />
          </label>
        ) : null}

        {selected ? (
          <div className="bg-muted/40 rounded-xl p-3 text-sm">
            <p className="font-medium">{selected.title}</p>
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
              {selected.body}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy || !templateId}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <LumaSpin /> در حال ارسال…
            </span>
          ) : (
            "ارسال"
          )}
        </button>
      </form>

      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? <p className="text-destructive text-sm">{err}</p> : null}

      <div className="border-border rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">قالب‌های موجود</h2>
        <ul className="text-muted-foreground space-y-1 text-sm">
          {templates.map((t) => (
            <li key={t.id}>
              <span className="text-foreground font-medium">{t.title}</span>
              {" — "}
              <span className="font-mono text-xs" dir="ltr">
                {t.id}
              </span>
            </li>
          ))}
          {!templates.length ? <li>قالبی تعریف نشده</li> : null}
        </ul>
      </div>
    </div>
  );
}
