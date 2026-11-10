"use client";

import { useCallback, useEffect, useState } from "react";
import {
  askProductQuestionAction,
  listProductQuestionsAction,
} from "@/app/(shop)/actions/product-qa";
import { ComposerInput } from "@/components/ui/composer-input";
import { formatJalaliDate } from "@/lib/dates/jalali";

type QAItem = {
  id: string;
  body: string;
  created_at: string;
  user?: { full_name: string | null } | null;
  answers?: { id: string; body: string; is_staff: boolean; created_at: string }[];
};

export function ProductQA({ productId }: { productId: string }) {
  const [items, setItems] = useState<QAItem[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await listProductQuestionsAction(productId);
    if (res.ok) setItems(res.items as QAItem[]);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSend(body: string) {
    setBusy(true);
    setMsg("");
    const res = await askProductQuestionAction(productId, body);
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        login_required: "برای پرسش وارد شوید",
        body_short: "سوال کوتاه است",
      };
      setMsg(map[res.error || ""] || res.error || "خطا");
      return;
    }
    setMsg("سوال ثبت شد و پس از تأیید نمایش داده می‌شود.");
    void load();
  }

  return (
    <section className="space-y-4 border-t pt-8" dir="rtl">
      <h2 className="text-xl font-bold text-primary">پرسش و پاسخ</h2>
      <div className="space-y-3">
        {items.map((q) => (
          <article key={q.id} className="border-border rounded-xl border p-4 text-sm">
            <div className="text-muted-foreground mb-1 flex gap-2 text-xs">
              <span>{q.user?.full_name || "خریدار"}</span>
              <time>{formatJalaliDate(q.created_at)}</time>
            </div>
            <p className="font-medium whitespace-pre-wrap">{q.body}</p>
            {(q.answers ?? []).map((a) => (
              <div key={a.id} className="bg-muted/40 mt-2 rounded-lg border-r-2 border-primary p-3 text-xs">
                <p className="mb-1 font-medium text-primary">{a.is_staff ? "پاسخ فروشگاه" : "پاسخ"}</p>
                <p className="whitespace-pre-wrap">{a.body}</p>
              </div>
            ))}
          </article>
        ))}
        {!items.length ? (
          <p className="text-muted-foreground text-sm">هنوز پرسش تأییدشده‌ای نیست.</p>
        ) : null}
      </div>
      <ComposerInput
        onSend={onSend}
        placeholder="سوال خود را درباره این محصول بپرسید…"
        sendLabel="ارسال سوال"
        disabled={busy}
      />
      {msg ? <p className="text-muted-foreground text-sm">{msg}</p> : null}
    </section>
  );
}
