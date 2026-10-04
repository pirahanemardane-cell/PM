"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminSendNotificationAction,
  adminListRecentNotificationsAction,
} from "@/app/admin/actions/notifications-admin";
import { LumaSpin } from "@/components/ui/luma-spin";
import { toPersianDigits } from "@/lib/numbers";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

type View = "menu" | "create" | "list";

type NotifRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
};

export default function AdminNotificationsPage() {
  const [view, setView] = useState<View>("menu");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"all" | "user">("all");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<NotifRow[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setErr(null);
    const res = await adminListRecentNotificationsAction(80);
    setListLoading(false);
    if (!res.ok) {
      setErr("بارگذاری اعلان‌ها ناموفق بود");
      setItems([]);
      return;
    }
    setItems((res.items ?? []) as NotifRow[]);
  }, []);

  useEffect(() => {
    if (view === "list") void loadList();
  }, [view, loadList]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      setErr("عنوان و توضیحات الزامی است");
      return;
    }
    if (mode === "user" && !target.trim()) {
      setErr("شماره موبایل یا شناسه کاربر را وارد کنید");
      return;
    }
    setBusy(true);
    setMsg(null);
    setErr(null);
    const res = await adminSendNotificationAction({
      mode,
      target: mode === "user" ? target.trim() : undefined,
      customTitle: t,
      customBody: b,
    });
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        auth: "ورود لازم است",
        forbidden: "دسترسی ادمین ندارید",
        template: "عنوان و توضیحات را کامل کنید",
        target_required: "گیرنده لازم است",
        user_not_found: "کاربر پیدا نشد",
      };
      setErr(map[String(res.error)] ?? String(res.error ?? "ارسال ناموفق"));
      return;
    }
    const sent = "sent" in res ? Number(res.sent) : 1;
    setMsg("ارسال شد: " + toPersianDigits(String(sent)) + " مورد");
    setTitle("");
    setBody("");
    setTarget("");
  }

  return (
    <div className="bg-background min-h-screen space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">اعلان‌ها</h1>
        <Link
          href="/admin"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          بازگشت به داشبورد
        </Link>
      </div>

      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="text-destructive text-sm">{err}</p> : null}

      {view === "menu" ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium"
            onClick={() => {
              setMsg(null);
              setErr(null);
              setView("create");
            }}
          >
            افزودن اعلان جدید
          </button>
          <button
            type="button"
            className="border-border bg-card rounded-lg border px-4 py-2.5 text-sm font-medium"
            onClick={() => {
              setMsg(null);
              setErr(null);
              setView("list");
            }}
          >
            مشاهده اعلان‌ها
          </button>
        </div>
      ) : null}

      {view === "create" ? (
        <div className="space-y-4">
          <button
            type="button"
            className="text-muted-foreground text-sm hover:underline"
            onClick={() => setView("menu")}
          >
            ← بازگشت
          </button>
          <form
            onSubmit={onSend}
            className="border-border bg-card max-w-lg space-y-4 rounded-xl border p-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">عنوان اعلان</label>
              <input
                className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">توضیحات</label>
              <textarea
                className="border-border bg-background min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ارسال به</label>
              <div className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "all"}
                    onChange={() => setMode("all")}
                  />
                  همه
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "user"}
                    onChange={() => setMode("user")}
                  />
                  کاربر
                </label>
              </div>
            </div>
            {mode === "user" ? (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  شماره موبایل یا شناسه کاربر
                </label>
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
              disabled={busy}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {busy ? <LumaSpin className="h-5 w-5" /> : "ارسال"}
            </button>
          </form>
        </div>
      ) : null}

      {view === "list" ? (
        <div className="space-y-4">
          <button
            type="button"
            className="text-muted-foreground text-sm hover:underline"
            onClick={() => setView("menu")}
          >
            ← بازگشت
          </button>
          {listLoading ? (
            <div className="flex justify-center py-10">
              <LumaSpin />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">اعلانی ثبت نشده.</p>
          ) : (
            <ul className="max-w-2xl space-y-2">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="border-border bg-card rounded-xl border p-3 text-sm"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="font-medium">{n.title}</span>
                    <span className="text-muted-foreground shrink-0 text-[11px]">
                      {formatJalaliDateTime(n.created_at)}
                    </span>
                  </div>
                  {n.body ? (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {n.body}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    {n.read_at ? "خوانده‌شده" : "خوانده‌نشده"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
