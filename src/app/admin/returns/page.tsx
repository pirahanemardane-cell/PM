"use client";

import { useEffect, useState } from "react";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";
import {
  adminListReturnsAction,
  adminSetReturnStatusAction,
} from "@/app/admin/actions/support";

type Row = {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  created_at: string;
};

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  approved: "تأیید",
  rejected: "رد",
  received: "دریافت شد",
  refunded: "عودت وجه",
};

export default function AdminReturnsPage() {
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const res = await adminListReturnsAction();
    if (res.ok) setItems(res.items as Row[]);
  }

  useEffect(() => {
    void load();
  }, []);

  useRtEvent(RT.support, () => {
    void load();
  });

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">درخواست‌های مرجوعی</h1>
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-right">سفارش</th>
              <th className="p-3 text-right">دلیل</th>
              <th className="p-3 text-right">وضعیت</th>
              <th className="p-3 text-right">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3 font-mono text-xs">{r.order_id.slice(0, 8)}…</td>
                <td className="text-muted-foreground max-w-xs p-3 text-xs">
                  {r.reason}
                </td>
                <td className="p-3">
                  <select
                    className="border rounded-lg px-2 py-1 text-xs"
                    value={r.status}
                    onChange={(e) =>
                      void adminSetReturnStatusAction(
                        r.id,
                        e.target.value as Row["status"] &
                          "pending",
                      ).then(load)
                    }
                  >
                    {(
                      [
                        "pending",
                        "approved",
                        "rejected",
                        "received",
                        "refunded",
                      ] as const
                    ).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_FA[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="text-muted-foreground p-3 text-xs">
                  {new Date(r.created_at).toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground p-6 text-center">
                  درخواستی نیست
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
