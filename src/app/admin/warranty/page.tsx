"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminListWarrantyClaimsAction,
  adminSetWarrantyClaimStatusAction,
  type WarrantyClaimAdmin,
} from "@/app/admin/actions/warranty";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  reviewing: "بررسی",
  approved: "تأیید",
  rejected: "رد",
  resolved: "حل‌شده",
};

const TYPE_FA: Record<string, string> = {
  warranty: "گارانتی دوخت",
  exchange: "تعویض آسان",
  stitching: "تعمیر دوخت",
};

export default function AdminWarrantyPage() {
  const [items, setItems] = useState<WarrantyClaimAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminListWarrantyClaimsAction();
    setLoading(false);
    if (!res.ok) {
      setError("بارگذاری ناموفق — مایگریشن ۰۶۷ را اعمال کنید");
      return;
    }
    setItems(res.items);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">گارانتی و ادعاها</h1>
        <p className="text-muted-foreground text-sm">
          درخواست‌های گارانتی دوخت / تعویض آسان. محتوای صفحات را از «محتوای صفحات» هم می‌توانید تنظیم کنید.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <LumaSpin />
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">ادعایی ثبت نشده</p>
          ) : (
            items.map((c) => (
              <article key={c.id} className="border-border space-y-2 rounded-xl border p-4 text-sm">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="font-medium">{TYPE_FA[c.claim_type] || c.claim_type}</span>
                  <span>{STATUS_FA[c.status] || c.status}</span>
                  <span className="text-muted-foreground">{formatJalaliDateTime(c.created_at)}</span>
                  <span>{c.user?.full_name || c.user?.phone || c.user_id.slice(0, 8)}</span>
                  {c.product?.name ? <span>{c.product.name}</span> : null}
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
                <textarea
                  className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  rows={2}
                  placeholder="یادداشت ادمین"
                  value={notes[c.id] ?? c.admin_note ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  {(["reviewing", "approved", "rejected", "resolved"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={busy === c.id}
                      className="border-border rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                      onClick={async () => {
                        setBusy(c.id);
                        await adminSetWarrantyClaimStatusAction(c.id, st, notes[c.id]);
                        setBusy(null);
                        void load();
                      }}
                    >
                      {STATUS_FA[st]}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
