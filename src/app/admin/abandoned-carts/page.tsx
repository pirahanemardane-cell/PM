"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminListAbandonedCartNudgesAction,
  adminListStaleCartsAction,
  adminRunAbandonedCartNudgeAction,
  type AbandonedNudgeRow,
} from "@/app/admin/actions/abandoned-carts";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

export default function AdminAbandonedCartsPage() {
  const [nudges, setNudges] = useState<AbandonedNudgeRow[]>([]);
  const [stale, setStale] = useState<
    { id: string; user_id: string | null; updated_at: string; item_count: number; full_name: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [n, s] = await Promise.all([
      adminListAbandonedCartNudgesAction(),
      adminListStaleCartsAction(),
    ]);
    setLoading(false);
    if (n.ok) setNudges(n.items);
    if (s.ok) setStale(s.items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">سبدهای رهاشده</h1>
          <p className="text-muted-foreground text-sm">
            سبدهای بدون تغییر بیش از ۶ ساعت — اعلان درون‌برنامه‌ای و ایمیل (در صورت وجود)
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            const res = await adminRunAbandonedCartNudgeAction();
            setBusy(false);
            if (!res.ok) {
              setMsg("اجرا ناموفق — مایگریشن ۰۶۸ را اعمال کنید");
              return;
            }
            setMsg(`اسکن ${res.scanned} · اعلان ${res.notified}`);
            void load();
          }}
        >
          اجرای دستی اعلان
        </button>
      </div>

      {msg ? <p className="text-sm">{msg}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">سبدهای کهنه (هنوز اعلان نشده ممکن است)</h2>
            <div className="border-border overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="p-3 text-right">کاربر</th>
                    <th className="p-3 text-right">اقلام</th>
                    <th className="p-3 text-right">آخرین تغییر</th>
                  </tr>
                </thead>
                <tbody>
                  {!stale.length ? (
                    <tr>
                      <td colSpan={3} className="text-muted-foreground p-6 text-center">
                        موردی نیست
                      </td>
                    </tr>
                  ) : (
                    stale.map((c) => (
                      <tr key={c.id} className="border-border border-t">
                        <td className="p-3">{c.full_name || c.user_id?.slice(0, 8) || "—"}</td>
                        <td className="p-3">{c.item_count}</td>
                        <td className="p-3">{formatJalaliDateTime(c.updated_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">اعلان‌های ارسال‌شده</h2>
            <div className="border-border overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="p-3 text-right">کاربر</th>
                    <th className="p-3 text-right">کانال</th>
                    <th className="p-3 text-right">زمان</th>
                    <th className="p-3 text-right">جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {!nudges.length ? (
                    <tr>
                      <td colSpan={4} className="text-muted-foreground p-6 text-center">
                        هنوز اعلانی ثبت نشده
                      </td>
                    </tr>
                  ) : (
                    nudges.map((n) => (
                      <tr key={n.id} className="border-border border-t">
                        <td className="p-3">
                          {n.user?.full_name || n.user_id?.slice(0, 8) || "—"}
                        </td>
                        <td className="p-3">{n.channel}</td>
                        <td className="p-3">{formatJalaliDateTime(n.notified_at)}</td>
                        <td className="p-3 text-xs">
                          {String((n.meta as any)?.preview || (n.meta as any)?.item_count || "—")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
