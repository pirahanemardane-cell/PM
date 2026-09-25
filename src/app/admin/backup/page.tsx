"use client";

import { useRef, useState } from "react";
import {
  adminBackupExportAction,
  adminBackupRestoreAction,
} from "@/app/admin/actions/backup";
import { toPersianDigits } from "@/lib/numbers";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

type Counts = Record<string, number>;
type ErrMap = Record<string, string>;

export default function AdminBackupPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [errors, setErrors] = useState<ErrMap | null>(null);
  const [confirm, setConfirm] = useState("");
  const [restoreResults, setRestoreResults] = useState<
    Record<string, { upserted: number; error?: string }> | null
  >(null);

  async function handleExport() {
    setLoading(true);
    setMsg(null);
    setCounts(null);
    setErrors(null);
    try {
      const res = await adminBackupExportAction();
      if (!res.ok) {
        setMsg(
          res.error === "login_required"
            ? "ورود لازم است"
            : res.error === "forbidden"
              ? "دسترسی ادمین ندارید"
              : "خطا در بک‌آپ",
        );
        return;
      }
      const payload = {
        version: res.version,
        exportedAt: res.exportedAt,
        rowLimit: res.rowLimit,
        counts: res.counts,
        errors: res.errors,
        tables: res.tables,
      };
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pm-backup-${res.exportedAt.replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setCounts(res.counts);
      const e = res.errors && Object.keys(res.errors).length ? res.errors : null;
      setErrors(e);
      setMsg(`بک‌آپ دانلود شد — ${formatJalaliDateTime(res.exportedAt)}`);
    } catch {
      setMsg("خطای غیرمنتظره در export");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestoreFile(file: File) {
    if (confirm.trim() !== "RESTORE") {
      setMsg('برای restore باید دقیقاً کلمه RESTORE را بنویسید');
      return;
    }
    setRestoreLoading(true);
    setMsg(null);
    setRestoreResults(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        version?: number;
        tables?: Record<string, Record<string, unknown>[]>;
      };
      if (!data.tables) {
        setMsg("فایل نامعتبر است (tables نیست)");
        return;
      }
      const res = await adminBackupRestoreAction({
        confirm: "RESTORE",
        version: data.version,
        tables: data.tables,
      });
      if (!res.ok) {
        setMsg(
          res.error === "confirm_required"
            ? "تأیید RESTORE لازم است"
            : res.error === "forbidden"
              ? "دسترسی ادمین ندارید"
              : "خطا در restore",
        );
        return;
      }
      setRestoreResults(res.results);
      setMsg(`Restore تمام شد — ${formatJalaliDateTime(res.restoredAt)}`);
      setConfirm("");
    } catch {
      setMsg("خواندن/parse فایل یا خطای سرور");
    } finally {
      setRestoreLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold">بک‌آپ و بازیابی</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          خروجی JSON جداول فروشگاه (حداکثر{" "}
          {toPersianDigits(10000)} ردیف/جدول). Restore با upsert روی{" "}
          <span className="font-mono">id</span> — دادهٔ موجود را بازنویسی
          می‌کند. قبل از restore حتماً یک export تازه بگیرید.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">۱) دانلود بک‌آپ</h2>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "در حال آماده‌سازی…" : "دانلود بک‌آپ JSON"}
        </button>
      </section>

      <section className="border-border space-y-3 border-t pt-6">
        <h2 className="font-semibold text-destructive">۲) بازیابی (خطرناک)</h2>
        <p className="text-muted-foreground text-xs">
          برای تأیید، کلمهٔ انگلیسی{" "}
          <span className="font-mono font-bold">RESTORE</span> را تایپ کنید.
        </p>
        <input
          className="border-input bg-background w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="RESTORE"
          autoComplete="off"
        />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="text-sm"
            disabled={restoreLoading || confirm.trim() !== "RESTORE"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleRestoreFile(f);
            }}
          />
        </div>
        {restoreLoading ? (
          <p className="text-sm">در حال restore…</p>
        ) : null}
      </section>

      {msg ? (
        <p className="text-sm font-medium" role="status">
          {msg}
        </p>
      ) : null}

      {counts ? (
        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2">جدول</th>
                <th className="p-2">تعداد export</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(counts).map(([name, n]) => (
                <tr key={name} className="border-border/60 border-t">
                  <td className="p-2 font-mono text-xs">{name}</td>
                  <td className="p-2">{toPersianDigits(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {errors ? (
        <div className="text-destructive space-y-1 text-xs">
          <p className="font-semibold">خطا / جدول غایب در export:</p>
          {Object.entries(errors).map(([k, v]) => (
            <p key={k}>
              <span className="font-mono">{k}</span>: {v}
            </p>
          ))}
        </div>
      ) : null}

      {restoreResults ? (
        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2">جدول</th>
                <th className="p-2">upsert</th>
                <th className="p-2">خطا</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(restoreResults).map(([name, r]) => (
                <tr key={name} className="border-border/60 border-t">
                  <td className="p-2 font-mono text-xs">{name}</td>
                  <td className="p-2">{toPersianDigits(r.upserted)}</td>
                  <td className="text-destructive p-2 text-xs">
                    {r.error ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
