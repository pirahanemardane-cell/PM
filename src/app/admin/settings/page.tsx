"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminSettingsStatusAction } from "@/app/admin/actions/settings";

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

export default function AdminSettingsPage() {
  const [env, setEnv] = useState<string>("—");
  const [checks, setChecks] = useState<Checks | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await adminSettingsStatusAction();
      if (!res.ok) {
        setError(
          res.error === "login_required"
            ? "ورود لازم است"
            : res.error === "forbidden"
              ? "دسترسی ادمین ندارید"
              : "خطا",
        );
        return;
      }
      setEnv(res.env);
      setChecks(res.checks);
    })();
  }, []);

  const rows: { label: string; key: keyof Checks }[] = [
    { label: "Supabase URL", key: "supabaseUrl" },
    { label: "Supabase Anon", key: "supabaseAnon" },
    { label: "Supabase Service Role", key: "supabaseService" },
    { label: "R2 Account ID", key: "r2Account" },
    { label: "R2 Access Key", key: "r2Access" },
    { label: "R2 Secret", key: "r2Secret" },
    { label: "R2 Bucket", key: "r2Bucket" },
    { label: "R2 Public Base URL", key: "r2Public" },
  ];

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">تنظیمات</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          وضعیت پیکربندی سرور (بدون نمایش مقادیر محرمانه)
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="border-border rounded-xl border p-4 text-sm">
        <p>
          محیط اجرا: <strong>{env}</strong>
        </p>
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-right">مورد</th>
              <th className="p-3 text-right">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {checks
              ? rows.map((r) => (
                  <tr key={r.key} className="border-t">
                    <td className="p-3">{r.label}</td>
                    <td className="p-3">
                      <Badge ok={checks[r.key]} />
                    </td>
                  </tr>
                ))
              : (
                <tr>
                  <td colSpan={2} className="text-muted-foreground p-6 text-center">
                    در حال بارگذاری…
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      <div className="border-border rounded-xl border p-4 text-sm">
        <p className="mb-2 font-medium">لینک‌های سریع</p>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link className="text-primary underline" href="/admin/dashboard">
              داشبورد
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/products">
              محصولات
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/media">
              رسانه
            </Link>
          </li>
        </ul>
      </div>

      <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-xs leading-relaxed">
        <p className="mb-1 font-medium text-foreground">یادداشت نقشه راه</p>
        <p>
          OTP واقعی پیامک و درگاه پرداخت هنوز deferred هستند. SEO پیشرفته و
          hero جداگانه برنامه‌ریزی شده‌اند. مقادیر env فقط از `.env.local` /
          پنل میزبان خوانده می‌شوند.
        </p>
      </div>
    </div>
  );
}
