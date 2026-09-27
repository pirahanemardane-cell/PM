"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { adminSendNotificationAction } from "@/app/admin/actions/notifications-admin";
import { PREDEFINED_NOTIFICATIONS } from "@/lib/notifications/templates";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";

export default function AdminNotificationsPage() {
  const templates = useMemo(
    () => (Array.isArray(PREDEFINED_NOTIFICATIONS) ? [...PREDEFINED_NOTIFICATIONS] : []),
    [],
  );
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
    setMsg("ارسال شد: " + toPersianDigits(String(sent)) + " مورد");
    if (mode === "user") setTarget("");
  }

  const selectedTpl = templates.find((t) => t.id === templateId);

  return (
    <div className="bg-background min-h-screen space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">اعلان‌ها</h1>
          <p className="text-muted-foreground text-sm">ارسال اعلان از قالب‌های از پیش تعریف‌شده</p>
        </div>
        <Link href="/admin" className="text-sm text-primary underline-offset-4 hover:underline">
          بازگشت به داشبورد
        </Link>
      </div>

      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="text-destructive text-sm">{err}</p> : null}

      <form onSubmit={onSend} className="border-border bg-card max-w-lg space-y-4 rounded-xl border p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">قالب</label>
          <select
            className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title ?? t.id}
              </option>
            ))}
          </select>
          {selectedTpl && "body" in selectedTpl && selectedTpl.body ? (
            <p className="text-muted-foreground mt-2 text-xs whitespace-pre-wrap">{String(selectedTpl.body)}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">گیرنده</label>
          <div className="flex gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "user"}
                onChange={() => setMode("user")}
              />
              یک کاربر
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "all"}
                onChange={() => setMode("all")}
              />
              همه کاربران
            </label>
          </div>
        </div>

        {mode === "user" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">شماره موبایل یا شناسه کاربر</label>
            <input
              className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="09xxxxxxxxx"
              dir="ltr"
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy || !templateId}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? <LumaSpin className="h-5 w-5" /> : "ارسال اعلان"}
        </button>
      </form>
    </div>
  );
}
