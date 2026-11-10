"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteSizeGuideAction,
  adminListSizeGuidesFullAction,
  adminSaveSizeGuideAction,
  type SizeGuideAdminRow,
} from "@/app/admin/actions/size-guides";
import { LumaSpin } from "@/components/ui/luma-spin";

type RowDraft = {
  size_label: string;
  chest_cm: string;
  waist_cm: string;
  shoulder_cm: string;
  sleeve_cm: string;
  length_cm: string;
  neck_cm: string;
};

const emptyRow = (): RowDraft => ({
  size_label: "",
  chest_cm: "",
  waist_cm: "",
  shoulder_cm: "",
  sleeve_cm: "",
  length_cm: "",
  neck_cm: "",
});

export default function AdminSizeGuidesPage() {
  const [items, setItems] = useState<SizeGuideAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<RowDraft[]>([emptyRow()]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminListSizeGuidesFullAction();
    setLoading(false);
    if (!res.ok) {
      setError("بارگذاری ناموفق");
      return;
    }
    setItems(res.items);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startNew() {
    setEditId(null);
    setName("");
    setDescription("");
    setRows([emptyRow(), emptyRow()]);
  }

  function startEdit(g: SizeGuideAdminRow) {
    setEditId(g.id);
    setName(g.name);
    setDescription(g.description || "");
    setRows(
      g.rows.length
        ? g.rows.map((r) => ({
            size_label: r.size_label,
            chest_cm: r.chest_cm != null ? String(r.chest_cm) : "",
            waist_cm: r.waist_cm != null ? String(r.waist_cm) : "",
            shoulder_cm: r.shoulder_cm != null ? String(r.shoulder_cm) : "",
            sleeve_cm: r.sleeve_cm != null ? String(r.sleeve_cm) : "",
            length_cm: r.length_cm != null ? String(r.length_cm) : "",
            neck_cm: r.neck_cm != null ? String(r.neck_cm) : "",
          }))
        : [emptyRow()],
    );
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    const res = await adminSaveSizeGuideAction({
      id: editId || undefined,
      name,
      description,
      rows: rows.map((r, i) => ({
        size_label: r.size_label,
        chest_cm: r.chest_cm ? Number(r.chest_cm) : null,
        waist_cm: r.waist_cm ? Number(r.waist_cm) : null,
        shoulder_cm: r.shoulder_cm ? Number(r.shoulder_cm) : null,
        sleeve_cm: r.sleeve_cm ? Number(r.sleeve_cm) : null,
        length_cm: r.length_cm ? Number(r.length_cm) : null,
        neck_cm: r.neck_cm ? Number(r.neck_cm) : null,
        sort_order: i,
      })),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "name_required" ? "نام راهنما لازم است" : "ذخیره ناموفق");
      return;
    }
    startNew();
    void load();
  }

  async function onDelete(id: string) {
    if (!confirm("حذف این راهنمای سایز؟")) return;
    setBusy(true);
    await adminDeleteSizeGuideAction(id);
    setBusy(false);
    if (editId === id) startNew();
    void load();
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">راهنمای سایز</h1>
        <p className="text-muted-foreground text-sm">
          جداول سایز را بسازید و به محصولات در ویرایشگر محصول وصل کنید. خریدار از «سایز من» اندازه‌ها را ذخیره می‌کند.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LumaSpin />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border-border space-y-3 rounded-xl border p-4">
            <h2 className="font-semibold">{editId ? "ویرایش راهنما" : "راهنمای جدید"}</h2>
            <input
              className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="نام (مثلاً پیراهن رسمی)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="توضیح کوتاه"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div key={idx} className="grid grid-cols-7 gap-1 text-xs">
                  {(
                    [
                      ["size_label", "سایز"],
                      ["chest_cm", "سینه"],
                      ["waist_cm", "کمر"],
                      ["shoulder_cm", "شانه"],
                      ["sleeve_cm", "آستین"],
                      ["length_cm", "قد"],
                      ["neck_cm", "گردن"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="space-y-0.5">
                      <span className="text-muted-foreground">{label}</span>
                      <input
                        className="border-input bg-background w-full rounded border px-1 py-1"
                        value={r[key]}
                        onChange={(e) => {
                          const next = [...rows];
                          next[idx] = { ...next[idx], [key]: e.target.value };
                          setRows(next);
                        }}
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="border-border rounded-lg border px-3 py-1.5 text-sm"
                onClick={() => setRows((p) => [...p, emptyRow()])}
              >
                + ردیف
              </button>
              <button
                type="button"
                disabled={busy}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm disabled:opacity-50"
                onClick={() => void onSave()}
              >
                ذخیره
              </button>
              {editId ? (
                <button type="button" className="text-sm underline" onClick={startNew}>
                  انصراف
                </button>
              ) : null}
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>

          <div className="border-border overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 text-right font-medium">نام</th>
                  <th className="p-3 text-right font-medium">ردیف‌ها</th>
                  <th className="p-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-muted-foreground p-6 text-center">
                      هنوز راهنمایی نیست
                    </td>
                  </tr>
                ) : (
                  items.map((g) => (
                    <tr key={g.id} className="border-border border-t">
                      <td className="p-3 font-medium">{g.name}</td>
                      <td className="p-3">{g.rows.length}</td>
                      <td className="space-x-2 space-x-reverse p-3">
                        <button type="button" className="text-primary text-xs underline" onClick={() => startEdit(g)}>
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="text-destructive text-xs underline"
                          onClick={() => void onDelete(g.id)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
