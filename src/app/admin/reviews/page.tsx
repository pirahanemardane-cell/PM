"use client";

import { useEffect, useState } from "react";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";
import {
  adminListReviewsAction,
  adminSetReviewApprovedAction,
} from "@/app/admin/actions/reviews";

type Row = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  is_approved: boolean;
  created_at: string;
  product?: { name: string } | null;
  user?: { full_name: string | null } | null;
};

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const res = await adminListReviewsAction();
    if (res.ok) setItems(res.items as Row[]);
  }

  useEffect(() => {
    void load();
  }, []);

  useRtEvent(RT.reviews, () => {
    void load();
  });

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">نظرات محصولات</h1>
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-right">محصول</th>
              <th className="p-3 text-right">کاربر</th>
              <th className="p-3 text-right">امتیاز</th>
              <th className="p-3 text-right">متن</th>
              <th className="p-3 text-right">تأیید</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">{r.product?.name ?? "—"}</td>
                <td className="p-3">{r.user?.full_name ?? "—"}</td>
                <td className="p-3">{r.rating}</td>
                <td className="text-muted-foreground max-w-xs p-3 text-xs">
                  {r.title ? <strong>{r.title} — </strong> : null}
                  {r.body}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    className="border rounded-lg px-2 py-1 text-xs"
                    onClick={() =>
                      void adminSetReviewApprovedAction(r.id, !r.is_approved).then(
                        load,
                      )
                    }
                  >
                    {r.is_approved ? "تأیید شده" : "در انتظار"}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground p-6 text-center">
                  نظری نیست
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
