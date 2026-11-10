"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createWarrantyClaimAction,
  listMyWarrantyClaimsAction,
} from "@/app/(shop)/actions/warranty-claims";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate } from "@/lib/dates/jalali";

const TYPE_FA: Record<string, string> = {
  warranty: "گارانتی دوخت",
  exchange: "تعویض آسان",
  stitching: "تعمیر دوخت",
};

export function TabClaims() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [claimType, setClaimType] = useState<"warranty" | "exchange" | "stitching">("warranty");
  const [body, setBody] = useState("");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await listMyWarrantyClaimsAction();
    setLoading(false);
    if (res.ok) setItems(res.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createWarrantyClaimAction({
      claimType,
      body,
      orderId: orderId.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(
        res.error === "body_short"
          ? "توضیحات کامل‌تری بنویسید"
          : "ثبت ناموفق — مایگریشن ۰۶۷ را اعمال کنید",
      );
      return;
    }
    setBody("");
    setMsg("درخواست ثبت شد");
    void load();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-base font-bold text-primary">ادعا / گارانتی</h2>
        <p className="text-muted-foreground text-sm">
          جزئیات سیاست در{" "}
          <Link href="/گارانتی" className="underline">
            صفحه گارانتی
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="border-border space-y-3 rounded-xl border p-4">
        <select
          className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
          value={claimType}
          onChange={(e) => setClaimType(e.target.value as typeof claimType)}
        >
          <option value="warranty">گارانتی دوخت</option>
          <option value="exchange">تعویض آسان</option>
          <option value="stitching">تعمیر دوخت</option>
        </select>
        <input
          className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="شناسه سفارش (اختیاری)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          dir="ltr"
        />
        <textarea
          className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
          rows={4}
          placeholder="توضیح مشکل…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        {msg ? <p className="text-sm">{msg}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          ثبت ادعا
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <LumaSpin />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <article key={c.id} className="border-border rounded-xl border p-3 text-sm">
              <div className="text-muted-foreground mb-1 flex flex-wrap gap-2 text-xs">
                <span>{TYPE_FA[c.claim_type] || c.claim_type}</span>
                <span>{c.status}</span>
                <span>{formatJalaliDate(c.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap">{c.body}</p>
              {c.admin_note ? (
                <p className="bg-muted/40 mt-2 rounded p-2 text-xs">پاسخ: {c.admin_note}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
