"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminSettingsStatusAction, adminChangePasswordAction } from "@/app/admin/actions/settings";
import { LumaSpin } from "@/components/ui/luma-spin";

type Checks = {
  supabaseUrl: boolean;
  supabaseAnon: boolean;
  supabaseService: boolean;
  r2Account: boolean;
  r2Access: boolean;
  r2Secret: boolean;
  r2Bucket: boolean;
  r2Public: boolean;
};

function Badge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400"
          : "rounded-lg bg-destructive/15 text-destructive px-2 py-0.5 text-xs"
      }
    >
      {ok ? "تنظیم شده" : "نیست"}
    </span>
  );
}


function AdminPasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (next.length < 8) {
      setErr("رمز جدید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (next !== confirm) {
      setErr("تکرار رمز با رمز جدید یکی نیست");
      return;
    }
    setBusy(true);
    const res = await adminChangePasswordAction(current, next);
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        bad_current: "رمز فعلی نادرست است",
        weak: "رمز جدید ضعیف است",
        login_required: "نشست منقضی شده؛ دوباره وارد شوید",
        forbidden: "دسترسی ندارید",
        server: "خطای سرور",
      };
      setErr(map[res.error] || "تغییر رمز ناموفق");
      return;
    }
    setMsg("رمز با موفقیت تغییر کرد");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <form onSubmit={onSubmit} className="border-border space-y-3 rounded-2xl border p-4">
      <h2 className="font-semibold">تغییر رمز عبور</h2>
      <label className="block space-y-1 text-sm">
        <span>رمز فعلی</span>
        <input
          type="password"
          className="border-border bg-background w-full rounded-lg border px-3 py-2"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>رمز جدید</span>
        <input
          type="password"
          className="border-border bg-background w-full rounded-lg border px-3 py-2"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>تکرار رمز جدید</span>
        <input
          type="password"
          className="border-border bg-background w-full rounded-lg border px-3 py-2"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
      </label>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy ? "در حال ذخیره…" : "ذخیره رمز جدید"}
      </button>
    </form>
  );
}


export default function AdminSettingsPage() {
  const [env, setEnv] = useState<string>("—");
  const [checks, setChecks] = useState<Checks | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await adminSettingsStatusAction();
      setLoading(false);
      if (!res.ok) {
        setError(
          res.error === "login_required"
            ? "ورود لازم است"
            : res.error === "forbidden"
              ? "دسترسی ادمین ندارید"
              : "خطا در خواندن وضعیت",
        );
        return;
      }
      setEnv(res.env);
      setChecks(res.checks);
    })();
  }, []);

  const supabaseOk = useMemo(() => {
    if (!checks) return false;
    return checks.supabaseUrl && checks.supabaseAnon && checks.supabaseService;
  }, [checks]);

  const r2Ok = useMemo(() => {
    if (!checks) return false;
    return (
      checks.r2Account &&
      checks.r2Access &&
      checks.r2Secret &&
      checks.r2Bucket &&
      checks.r2Public
    );
  }, [checks]);

  const supabaseRows: { label: string; key: keyof Checks }[] = [
    { label: "Supabase URL", key: "supabaseUrl" },
    { label: "Supabase Anon Key", key: "supabaseAnon" },
    { label: "Supabase Service Role", key: "supabaseService" },
  ];

  const r2Rows: { label: string; key: keyof Checks }[] = [
    { label: "R2 Account ID", key: "r2Account" },
    { label: "R2 Access Key", key: "r2Access" },
    { label: "R2 Secret Key", key: "r2Secret" },
    { label: "R2 Bucket Name", key: "r2Bucket" },
    { label: "R2 Public Base URL", key: "r2Public" },
  ];

  return (
    <div className="bg-background min-h-screen p-6" dir="rtl">
      <div className="w-full max-w-none space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">تنظیمات محیط</h1>
            <p className="text-muted-foreground text-sm">
              وضعیت متغیرهای سرور — مقادیر secret نمایش داده نمی‌شوند
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            داشبورد
          </Link>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <LumaSpin />
          </div>
        ) : checks ? (
          <>
            <p className="text-muted-foreground text-sm">
              محیط اجرا: <span className="text-foreground font-medium">{env}</span>
            </p>

            <div
              className={`rounded-2xl border p-4 text-sm ${
                supabaseOk
                  ? "border-emerald-300/60 bg-emerald-500/10"
                  : "border-amber-300/60 bg-amber-500/10"
              }`}
            >
              <p className="font-medium">
                Supabase: {supabaseOk ? "آماده" : "ناقص — فروشگاه/ادمین کار نمی‌کند"}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 text-sm ${
                r2Ok
                  ? "border-emerald-300/60 bg-emerald-500/10"
                  : "border-amber-300/60 bg-amber-500/10"
              }`}
            >
              <p className="font-medium">
                Cloudflare R2:{" "}
                {r2Ok
                  ? "آماده — آپلود تصویر محصول از ادمین فعال است"
                  : "ناقص — آپلود تصویر تا پر شدن هر ۵ کلید کار نمی‌کند"}
              </p>
              {!r2Ok ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  در Vercel → Settings → Environment Variables این کلیدها را پر کنید:
                  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
                  R2_BUCKET_NAME, R2_PUBLIC_BASE_URL
                </p>
              ) : null}
            </div>

            <section className="border-border space-y-2 rounded-2xl border p-4">
              <h2 className="font-semibold">Supabase</h2>
              <ul className="space-y-2">
                {supabaseRows.map((r) => (
                  <li
                    key={r.key}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>{r.label}</span>
                    <Badge ok={!!checks[r.key]} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-border space-y-2 rounded-2xl border p-4">
              <h2 className="font-semibold">Cloudflare R2 (تصاویر)</h2>
              <ul className="space-y-2">
                {r2Rows.map((r) => (
                  <li
                    key={r.key}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>{r.label}</span>
                    <Badge ok={!!checks[r.key]} />
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-muted-foreground text-xs">
              تصویر فعلی کاتالوگ ممکن است هنوز مسیر محلی باشد
              (<code className="mx-1">/products/…</code>).
              آپلودهای جدید از مسیر ادمین به R2 می‌روند (webp چندسایزه).
            </p>
          </>
        ) : null}
      </div>
    </div>

      <AdminPasswordForm />

  );
}
