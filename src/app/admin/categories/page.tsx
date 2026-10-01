"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminBulkBar } from "@/components/admin/bulk-bar";
import {
  adminArchiveCategoriesAction,
  adminHardDeleteCategoriesAction,
  adminRestoreCategoriesAction,
} from "@/app/admin/actions/lifecycle";
import {
  adminCreateCategoryAction,
  adminListCategoriesAction,
  adminUpdateCategoryAction,
} from "@/app/admin/actions/catalog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LumaSpin } from "@/components/ui/luma-spin";

type Row = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  parent_id?: string | null;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [creating, setCreating] = useState(false);

  
  function toggleSelectAll(ids: string[]) {
    setSelected((prev) =>
      prev.length === ids.length && ids.every((id) => prev.includes(id))
        ? []
        : [...ids],
    );
  }
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  async function runBulkArchive() {
    if (!selected.length) return;
    if (!confirm("آرشیو موارد انتخاب‌شده؟")) return;
    setBulkBusy(true);
    const res = await adminArchiveCategoriesAction(selected);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    setSelected([]);
    void load();
  }
  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await adminHardDeleteCategoriesAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
      has_products: "حذف ممکن نیست: هنوز محصول وابسته دارد",
      has_children: "حذف ممکن نیست: زیردسته دارد",
      has_orders: "حذف ممکن نیست: سفارش ثبت‌شده دارد",
      forbidden: "دسترسی کافی نیست",
      auth: "دسترسی کافی نیست",
      login_required: "دسترسی کافی نیست",
      empty: "موردی انتخاب نشده",
      server: "خطای سرور — کنسول را ببین",
    };
      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");
      return;
    }
    setSelected([]);
    void load();
  }
  async function archiveOne(id: string, name: string) {
    if (!confirm(`آرشیو «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminArchiveCategoriesAction([id]);
    setBulkBusy(false);
    if (!res.ok) { setError("آرشیو ناموفق"); return; }
    void load();
  }
  async function hardDeleteOne(id: string, name: string) {
    if (!confirm(`حذف دائمی «${name}»؟`)) return;
    setBulkBusy(true);
    const res = await adminHardDeleteCategoriesAction([id]);
    setBulkBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
      has_products: "حذف ممکن نیست: هنوز محصول وابسته دارد",
      has_children: "حذف ممکن نیست: زیردسته دارد",
      has_orders: "حذف ممکن نیست: سفارش ثبت‌شده دارد",
      forbidden: "دسترسی کافی نیست",
      auth: "دسترسی کافی نیست",
      login_required: "دسترسی کافی نیست",
      empty: "موردی انتخاب نشده",
      server: "خطای سرور — کنسول را ببین",
    };
      setError(map[String(res.error)] ?? "حذف دائمی ناموفق");
      return;
    }
    void load();
  }

  async function restoreOne(id: string, name: string) {
    if (!confirm(`بازگردانی «${name}» از بایگانی؟`)) return;
    setBulkBusy(true);
    const res = await adminRestoreCategoriesAction([id]);
    setBulkBusy(false);
    if (!res.ok) { setError("بازگردانی ناموفق"); return; }
    void load();
  }
  async function runBulkRestore() {
    if (!selected.length) return;
    if (!confirm("بازگردانی موارد انتخاب‌شده از بایگانی؟")) return;
    setBulkBusy(true);
    const res = await adminRestoreCategoriesAction(selected);
    setBulkBusy(false);
    if (!res.ok) { setError("بازگردانی ناموفق"); return; }
    setSelected([]);
    void load();
  }
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListCategoriesAction();
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "فقط ادمین"
            : "خطا در بارگذاری",
      );
      setItems([]);
      return;
    }
    setItems((res.items as Row[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await adminCreateCategoryAction({ name, parent_id: parentId || null });
    setCreating(false);
    if (!res.ok) {
      setError(
        res.error === "bad_name" ? "نام نامعتبر" : "ایجاد ناموفق (slug تکراری؟)",
      );
      return;
    }
    setName("");
      setParentId("");
    void load();
  }

  async function save(
    id: string,
    patch: { name?: string; sort_order?: number; is_active?: boolean },
  ) {
    setBusyId(id);
    const res = await adminUpdateCategoryAction(id, patch);
    setBusyId(null);
    if (!res.ok) {
      setError("ذخیره ناموفق");
      return;
    }
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="w-full max-w-none">
        <AdminPageHeader
          title={showArchived ? "بایگانی دسته‌بندی‌ها" : "دسته‌بندی‌ها"}
          description=""
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setShowArchived((v) => !v); setSelected([]); }}
                className={
                  showArchived
                    ? "bg-amber-600 text-white rounded-xl px-4 py-2 text-sm font-medium"
                    : "border-border rounded-xl border px-4 py-2 text-sm"
                }
              >
                {showArchived ? "خروج از بایگانی" : "بایگانی"}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="border-border rounded-xl border px-4 py-2 text-sm"
              >
                تازه‌سازی
              </button>
            </div>
          }
        />

        {error ? <p className="text-destructive mb-4 text-sm">{error}</p> : null}

        <form
          onSubmit={onCreate}
          className="border-border bg-card mb-6 flex flex-wrap gap-2 rounded-2xl border p-4"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام دسته جدید"
            className="border-input bg-background h-10 min-w-[12rem] flex-1 rounded-xl border px-3 text-sm"
            required
          />
          <select
            className="border-border bg-background h-10 rounded-xl border px-3 text-sm"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">بدون والد (ریشه)</option>
            {items
              .filter((c) => !c.parent_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-primary-foreground h-10 rounded-xl px-5 text-sm font-medium disabled:opacity-60"
          >
            {creating ? "…" : "افزودن"}
          </button>
        </form>

        <AdminBulkBar
          count={selected.length}
          total={items.length}
          onSelectAll={() => toggleSelectAll(items.map((x) => x.id))}
          busy={bulkBusy}
          onArchive={() => void (showArchived ? runBulkRestore() : runBulkArchive())}
          onHardDelete={() => void runBulkHardDelete()}
          onClear={() => setSelected([])}
          archiveLabel={showArchived ? "بازگردانی" : "آرشیو"}
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <LumaSpin />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            دسته‌ای نیست.
          </p>
        ) : (
          <div className="table-scroll border-border overflow-x-auto rounded-2xl border">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">نام</th>
                  <th className="p-3 font-medium">slug</th>
                  <th className="p-3 font-medium">ترتیب</th>
                  <th className="p-3 font-medium">فعال</th>
                </tr>
              </thead>
              <tbody>
                {(showArchived ? items.filter((x) => !x.is_active) : items).map((r) => (
                  <tr key={r.id} className={"border-border border-t " + (!r.is_active ? "bg-amber-50/80 dark:bg-amber-950/30 opacity-80" : "")}>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} />
                          <button type="button" className="text-muted-foreground text-xs" onClick={() => void (showArchived || !r.is_active ? restoreOne(r.id, r.name) : archiveOne(r.id, r.name))}>{showArchived || !r.is_active ? "بازگردانی" : "آرشیو"}</button>
                          <button type="button" className="text-destructive text-xs" onClick={() => void hardDeleteOne(r.id, r.name)}>حذف دائمی</button>
                        </span>
                        <input
                        defaultValue={r.name}
                        disabled={busyId === r.id}
                        className="border-input bg-background h-9 w-full min-w-[8rem] rounded-lg border px-2 text-sm font-medium"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== r.name) void save(r.id, { name: v });
                        }}
                      />
                      </div>
                    </td>
                    <td className="text-muted-foreground p-3 font-mono text-xs">
                      {r.slug}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        defaultValue={r.sort_order}
                        disabled={busyId === r.id}
                        className="border-input bg-background h-9 w-20 rounded-lg border px-2 text-sm tabular-nums"
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n !== r.sort_order) {
                            void save(r.id, { sort_order: n });
                          }
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={!!r.is_active}
                        disabled={busyId === r.id}
                        onChange={(e) =>
                          void save(r.id, { is_active: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
