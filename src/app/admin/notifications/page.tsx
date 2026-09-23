"use client";

import { useEffect, useState } from "react";
import { PREDEFINED_NOTIFICATIONS } from "@/lib/notifications/templates";
import {
  adminSendNotificationAction,
  adminListRecentNotificationsAction,
} from "@/app/admin/actions/notifications-admin";
import { toast } from "@/lib/toaster";
import { LumaSpin } from "@/components/ui/luma-spin";

export default function AdminNotificationsPage() {
  const [templateId, setTemplateId] = useState<string>(PREDEFINED_NOTIFICATIONS[0]?.id ?? "welcome");
  const [mode, setMode] = useState<"user" | "all">("user");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await adminListRecentNotificationsAction(40);
    if (res.ok) setRecent(res.items);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSend() {
    setBusy(true);
    const res = await adminSendNotificationAction({
      templateId,
      mode,
      target: mode === "user" ? target : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("ارسال ناموفق", String((res as any).error ?? ""));
      return;
    }
    toast.success("ارسال شد", mode === "all" ? `${(res as any).sent} کاربر` : "۱ کاربر");
    void load();
  }

  const tpl = PREDEFINED_NOTIFICATIONS.find((x) => x.id === templateId);

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">اعلان‌ها</h1>
        <p className="text-muted-foreground text-sm">
          ارسال قالب ازپیش‌تعریف‌شده برای یک مشتری یا همه کاربران
        </p>
      </div>

      <div className="border-border bg-card max-w-xl space-y-4 rounded-xl border p-4 shadow-sm">
        <label className="block text-sm font-medium">قالب</label>
        <select
          className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value as typeof templateId)}
        >
          {PREDEFINED_NOTIFICATIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        {tpl ? (
          <p className="text-muted-foreground rounded-lg bg-black/5 p-3 text-xs dark:bg-white/5">
            {tpl.body}
          </p>
        ) : null}

        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "user"}
              onChange={() => setMode("user")}
            />
            یک مشتری
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "all"}
              onChange={() => setMode("all")}
            />
            همه کاربران
          </label>
        </div>

        {mode === "user" ? (
          <input
            className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="موبایل مشتری (۰۹...)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            dir="ltr"
          />
        ) : (
          <p className="text-destructive text-xs">
            ارسال همگانی برای همه پروفایل‌ها انجام می‌شود — با احتیاط استفاده کنید.
          </p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void onSend()}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "در حال ارسال…" : "ارسال اعلان"}
        </button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold">آخرین اعلان‌های ثبت‌شده</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <LumaSpin />
          </div>
        ) : recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">موردی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((n) => (
              <li
                key={n.id}
                className="border-border rounded-lg border p-3 text-right text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString("fa-IR")
                      : ""}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{n.body}</p>
                <p className="text-muted-foreground mt-1 font-mono text-[10px]" dir="ltr">
                  user: {n.user_id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
