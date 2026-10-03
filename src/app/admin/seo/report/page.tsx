"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminSeoSiteReportAction,
  type SeoReportSummary,
} from "@/app/admin/actions/seo-report";
import { LumaSpin } from "@/components/ui/luma-spin";

export default function AdminSeoReportPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [report, setReport] = useState<SeoReportSummary | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await adminSeoSiteReportAction();
      setLoading(false);
      if (!res.ok) {
        setErr("خطا در بارگذاری گزارش");
        return;
      }
      setReport(res.report);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-primary text-2xl font-bold">گزارش SEO سایت</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/seo" className="border-border rounded-xl border px-3 py-1.5">
            سئو PLP
          </Link>
          <button
            type="button"
            className="bg-primary text-primary-foreground rounded-xl px-3 py-1.5"
            onClick={() => {
              setLoading(true);
              void adminSeoSiteReportAction().then((res) => {
                setLoading(false);
                if (res.ok) setReport(res.report);
              });
            }}
          >
            تازه‌سازی
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : err ? (
        <p className="text-destructive">{err}</p>
      ) : report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="کل صفحات" value={String(report.total)} />
            <Stat label="میانگین امتیاز" value={`${report.avgScore}/100`} warn={report.avgScore < 60} />
            <Stat label="بدون Title" value={String(report.missingTitle)} warn={report.missingTitle > 0} />
            <Stat label="بدون Description" value={String(report.missingDesc)} warn={report.missingDesc > 0} />
            <Stat label="بدون Keyphrase" value={String(report.missingKeyphrase)} warn={report.missingKeyphrase > 0} />
          </div>

          <p className="text-muted-foreground text-sm">
            noindex: {report.noindex} — لیست زیر ضعیف‌ترین‌ها از نظر متا است (حداکثر ۱۰۰ مورد).
          </p>

          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-right">
                <tr>
                  <th className="p-2 font-medium">نوع</th>
                  <th className="p-2 font-medium">عنوان</th>
                  <th className="p-2 font-medium">امتیاز</th>
                  <th className="p-2 font-medium">Title</th>
                  <th className="p-2 font-medium">Desc</th>
                  <th className="p-2 font-medium">KP</th>
                  <th className="p-2 font-medium">ایندکس</th>
                  <th className="p-2 font-medium">ویرایش</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={`${r.type}-${r.id}`} className="border-border border-t">
                    <td className="p-2">{r.type}</td>
                    <td className="p-2 max-w-[200px] truncate">{r.title}</td>
                    <td className="p-2 font-mono">{r.scoreHint}</td>
                    <td className="p-2">{r.hasMetaTitle ? "✓" : "✗"}</td>
                    <td className="p-2">{r.hasMetaDesc ? "✓" : "✗"}</td>
                    <td className="p-2">{r.hasKeyphrase ? "✓" : "✗"}</td>
                    <td className="p-2">{r.robotsIndex ? "index" : "noindex"}</td>
                    <td className="p-2">
                      <Link href={r.href} className="text-primary underline">
                        باز کردن
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="border-border rounded-xl border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`text-xl font-semibold ${warn ? "text-amber-600" : ""}`}>{value}</p>
    </div>
  );
}
