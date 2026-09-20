"use client";

import { useEffect, useState } from "react";
import {
  adminListTicketsAction,
  adminSetTicketStatusAction,
  adminReplyTicketAction,
} from "@/app/admin/actions/support";

type Row = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
};

const STATUS_FA: Record<string, string> = {
  open: "باز",
  in_progress: "در حال بررسی",
  closed: "بسته",
};

export default function AdminTicketsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});

  async function load() {
    const res = await adminListTicketsAction();
    if (res.ok) setItems(res.items as Row[]);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">تیکت‌های پشتیبانی</h1>
      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.id} className="border-border rounded-xl border p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{t.subject}</p>
              <select
                className="border rounded-lg px-2 py-1 text-xs"
                value={t.status}
                onChange={(e) =>
                  void adminSetTicketStatusAction(
                    t.id,
                    e.target.value as "open" | "in_progress" | "closed",
                  ).then(load)
                }
              >
                {(["open", "in_progress", "closed"] as const).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_FA[s]}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {new Date(t.created_at).toLocaleString("fa-IR")} · {t.priority}
            </p>
            <div className="mt-2 flex gap-2">
              <input
                className="border-border flex-1 rounded-lg border px-2 py-1 text-sm"
                placeholder="پاسخ ادمین…"
                value={reply[t.id] ?? ""}
                onChange={(e) =>
                  setReply((r) => ({ ...r, [t.id]: e.target.value }))
                }
              />
              <button
                type="button"
                className="bg-primary text-primary-foreground rounded-lg px-3 py-1 text-xs"
                onClick={() =>
                  void adminReplyTicketAction(t.id, reply[t.id] ?? "").then(() => {
                    setReply((r) => ({ ...r, [t.id]: "" }));
                    void load();
                  })
                }
              >
                ارسال
              </button>
            </div>
          </div>
        ))}
        {!items.length ? (
          <p className="text-muted-foreground text-sm">تیکتی نیست</p>
        ) : null}
      </div>
    </div>
  );
}
