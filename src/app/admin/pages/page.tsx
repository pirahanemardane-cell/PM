"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminGetAllContentPagesAction,
  adminSaveFaqAction,
  adminSaveTextPageAction,
} from "@/app/admin/actions/content-pages";
import type { FaqItem, TextPageContent } from "@/lib/content/static-pages";
import { LumaSpin } from "@/components/ui/luma-spin";

type Tab = "faq" | "terms" | "privacy" | "shipping" | "returns";

const TABS: { id: Tab; label: string }[] = [
  { id: "faq", label: "سوالات متداول" },
  { id: "terms", label: "شرایط استفاده" },
  { id: "privacy", label: "حریم خصوصی" },
  { id: "shipping", label: "ارسال و تحویل" },
  { id: "returns", label: "سیاست مرجوعی" },
];

export default function AdminContentPagesPage() {
  const [tab, setTab] = useState<Tab>("faq");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [pages, setPages] = useState<Record<string, TextPageContent>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminGetAllContentPagesAction();
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
            : "خطا در بارگذاری",
      );
      return;
    }
    setFaq(res.faq);
    setPages(res.pages);
    setTableMissing(!!res.tableMissing);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveFaq() {
    setBusy(true);
    setMsg(null);
    setError(null);
    const res = await adminSaveFaqAction(faq);
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "empty" ? "حداقل یک سوال و جواب لازم است" : "ذخیره ناموفق");
      return;
    }
    setMsg("ذخیره شد — ظاهر FAQ آکاردئون در سایت");
  }

  async function saveText(slug: Exclude<Tab, "faq">) {
    const content = pages[slug];
    if (!content) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    const res = await adminSaveTextPageAction(slug, content);
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "empty" ? "عنوان و حداقل یک پاراگراف لازم است" : "ذخیره ناموفق");
      return;
    }
    setMsg("صفحه ذخیره شد");
  }

  return (
    <div className="space-y-6 p-2 sm:p-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-primary">محتوای صفحات</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          متن از اینجا؛ ظاهر هر صفحه در سایت قالب مخصوص خودش را دارد
        </p>
      </div>

      {tableMissing ? (
        <p className="text-destructive text-sm">
          جدول site_settings در دسترس نیست.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              "rounded-lg border px-3 py-1.5 text-sm " +
              (tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border")
            }
            onClick={() => {
              setTab(t.id);
              setMsg(null);
              setError(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : tab === "faq" ? (
        <div className="space-y-4">
          {faq.map((item, idx) => (
            <div key={idx} className="border-border space-y-2 rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">#{idx + 1}</span>
                <button
                  type="button"
                  className="text-destructive text-xs"
                  onClick={() => setFaq((list) => list.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <input
                className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="سوال"
                value={item.q}
                onChange={(e) => {
                  const v = e.target.value;
                  setFaq((list) =>
                    list.map((it, i) => (i === idx ? { ...it, q: v } : it)),
                  );
                }}
              />
              <textarea
                className="border-border bg-background min-h-[5rem] w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="جواب"
                value={item.a}
                onChange={(e) => {
                  const v = e.target.value;
                  setFaq((list) =>
                    list.map((it, i) => (i === idx ? { ...it, a: v } : it)),
                  );
                }}
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="border-border rounded-lg border px-3 py-2 text-sm"
              onClick={() => setFaq((list) => [...list, { q: "", a: "" }])}
            >
              + سوال جدید
            </button>
            <button
              type="button"
              disabled={busy}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              onClick={() => void saveFaq()}
            >
              {busy ? "…" : "ذخیره FAQ"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const slug = tab;
            const content = pages[slug] || { title: "", paragraphs: [""] };
            return (
              <>
                <label className="block space-y-1 text-sm">
                  <span>عنوان صفحه</span>
                  <input
                    className="border-border bg-background w-full rounded-lg border px-3 py-2"
                    value={content.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPages((m) => ({
                        ...m,
                        [slug]: { ...content, title: v },
                      }));
                    }}
                  />
                </label>
                {(content.paragraphs.length ? content.paragraphs : [""]).map(
                  (p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          پاراگراف {idx + 1}
                        </span>
                        <button
                          type="button"
                          className="text-destructive"
                          onClick={() =>
                            setPages((m) => ({
                              ...m,
                              [slug]: {
                                ...content,
                                paragraphs: content.paragraphs.filter(
                                  (_, i) => i !== idx,
                                ),
                              },
                            }))
                          }
                        >
                          حذف
                        </button>
                      </div>
                      <textarea
                        className="border-border bg-background min-h-[6rem] w-full rounded-lg border px-3 py-2 text-sm"
                        value={p}
                        onChange={(e) => {
                          const v = e.target.value;
                          const next = [...content.paragraphs];
                          next[idx] = v;
                          setPages((m) => ({
                            ...m,
                            [slug]: { ...content, paragraphs: next },
                          }));
                        }}
                      />
                    </div>
                  ),
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="border-border rounded-lg border px-3 py-2 text-sm"
                    onClick={() =>
                      setPages((m) => ({
                        ...m,
                        [slug]: {
                          ...content,
                          paragraphs: [...content.paragraphs, ""],
                        },
                      }))
                    }
                  >
                    + پاراگراف
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                    onClick={() => void saveText(slug)}
                  >
                    {busy ? "…" : "ذخیره صفحه"}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
