"use client";

import { useEffect, useState } from "react";
import { getMyLoyaltyAction } from "@/app/(shop)/actions/loyalty";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate } from "@/lib/dates/jalali";
import { toPersianDigits } from "@/lib/numbers";

export function TabLoyalty() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [life, setLife] = useState(0);
  const [txs, setTxs] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await getMyLoyaltyAction();
      setLoading(false);
      if (!res.ok) {
        setErr("باشگاه امتیاز در دسترس نیست — مایگریشن ۰۶۷ را اعمال کنید");
        return;
      }
      setPoints(Number(res.account?.points ?? 0));
      setLife(Number(res.account?.lifetime_points ?? 0));
      setTxs(res.txs || []);
      setRules(res.rules || []);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-base font-bold text-primary">باشگاه مشتریان</h2>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">امتیاز فعلی</p>
          <p className="text-2xl font-bold">{toPersianDigits(String(points))}</p>
        </div>
        <div className="border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">امتیاز تجمعی</p>
          <p className="text-2xl font-bold">{toPersianDigits(String(life))}</p>
        </div>
      </div>
      {rules.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">قوانین فعال</h3>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {rules.map((r) => (
              <li key={r.key}>
                {r.label}: {toPersianDigits(String(r.points))} امتیاز
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <h3 className="mb-2 text-sm font-semibold">تاریخچه</h3>
        {!txs.length ? (
          <p className="text-muted-foreground text-sm">هنوز تراکنشی نیست</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {txs.map((t) => (
              <li key={t.id} className="border-border flex justify-between rounded-lg border px-3 py-2">
                <span>{t.reason}</span>
                <span>
                  {t.points > 0 ? "+" : ""}
                  {toPersianDigits(String(t.points))} · {formatJalaliDate(t.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
