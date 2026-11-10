"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMyMeasurementsAction,
  saveMyMeasurementsAction,
  type MeasurementsDTO,
} from "@/app/(shop)/actions/measurements";
import { LumaSpin } from "@/components/ui/luma-spin";

const FIELDS: { key: keyof MeasurementsDTO; label: string }[] = [
  { key: "chest_cm", label: "دور سینه (سانتی‌متر)" },
  { key: "waist_cm", label: "دور کمر" },
  { key: "shoulder_cm", label: "شانه" },
  { key: "sleeve_cm", label: "آستین" },
  { key: "length_cm", label: "قد لباس" },
  { key: "neck_cm", label: "دور گردن" },
];

export function TabMySize() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<MeasurementsDTO>({
    chest_cm: null,
    waist_cm: null,
    shoulder_cm: null,
    sleeve_cm: null,
    length_cm: null,
    neck_cm: null,
    preferred_size: null,
    notes: null,
  });

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await getMyMeasurementsAction();
      setLoading(false);
      if (res.ok && res.data) setForm({ ...form, ...res.data });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await saveMyMeasurementsAction(form);
    setBusy(false);
    setMsg(res.ok ? "ذخیره شد" : "ذخیره ناموفق — مایگریشن ۰۶۷ را اعمال کنید");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LumaSpin />
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="mx-auto max-w-lg space-y-4" dir="rtl">
      <h2 className="text-base font-bold text-primary">سایز من</h2>
      <p className="text-muted-foreground text-sm">
        اندازه‌های خود را ذخیره کنید و با{" "}
        <Link href="/size-guide" className="underline">
          راهنمای سایز
        </Link>{" "}
        تطبیق دهید.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block space-y-1 text-sm">
            <span>{f.label}</span>
            <input
              className="border-input bg-background w-full rounded-lg border px-3 py-2"
              inputMode="decimal"
              value={form[f.key] ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [f.key]: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <label className="block space-y-1 text-sm">
        <span>سایز ترجیحی (مثلاً L)</span>
        <input
          className="border-input bg-background w-full rounded-lg border px-3 py-2"
          value={form.preferred_size ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, preferred_size: e.target.value }))}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>یادداشت</span>
        <textarea
          className="border-input bg-background w-full rounded-lg border px-3 py-2"
          rows={2}
          value={form.notes ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
      </label>
      {msg ? <p className="text-sm">{msg}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        ذخیره اندازه‌ها
      </button>
    </form>
  );
}
