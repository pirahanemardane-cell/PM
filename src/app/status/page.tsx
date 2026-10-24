import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StatusPage() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatency = 0;
  let errorMsg: string | null = null;

  try {
    const supabase = await createClient();
    const t0 = Date.now();
    const { error } = await supabase.from("analytics_events").select("id", { count: "exact", head: true }).limit(1);
    dbLatency = Date.now() - t0;
    dbOk = !error;
    if (error) errorMsg = error.message;
  } catch (e: any) {
    errorMsg = e?.message || "خطای ناشناخته";
  }

  const totalMs = Date.now() - startedAt;
  const overallOk = dbOk;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">وضعیت سیستم</h1>
          <p className="text-sm text-muted-foreground mt-1">pirahanmardane.ir</p>
        </div>

        <div
          className={`rounded-2xl border p-6 text-center ${
            overallOk
              ? "border-green-500/40 bg-green-500/10"
              : "border-red-500/40 bg-red-500/10"
          }`}
        >
          <div
            className={`inline-flex h-4 w-4 rounded-full ${
              overallOk ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <p className="mt-3 text-xl font-semibold">
            {overallOk ? "همه چیز عادی است" : "مشکل در سرویس‌ها"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            آخرین بررسی: {new Date().toLocaleString("fa-IR")}
          </p>
        </div>

        <div className="rounded-2xl border bg-card divide-y">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm">سایت</span>
            <span className="text-sm font-medium text-green-600">آنلاین</span>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm">دیتابیس</span>
            <span
              className={`text-sm font-medium ${
                dbOk ? "text-green-600" : "text-red-600"
              }`}
            >
              {dbOk ? `سالم (${dbLatency}ms)` : "خطا"}
            </span>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm">زمان پاسخ کل</span>
            <span className="text-sm font-medium tabular-nums">{totalMs}ms</span>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-700 break-all">
            {errorMsg}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          این صفحه برای مانیتورینگ و بررسی سریع سلامت سیستم است.
        </p>
      </div>
    </div>
  );
}
