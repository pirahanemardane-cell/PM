"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateBrandAction,
  adminListBrandsAction,
  adminUpdateBrandAction,
} from "@/app/admin/actions/catalog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LumaSpin } from "@/components/ui/luma-spin";

type Row = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function AdminBrandsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListBrandsAction();
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
    const res = await adminCreateBrandAction({ name });
    setCreating(false);
    if (!res.ok) {
      setError(
        res.error === "bad_name" ? "نام نامعتبر" : "ایجاد ناموفق (slug تکراری؟)",
      );
      return;
    }
    setName("");
    void load();
  }

  async function save(
    id: string,
    patch: { name?: string; is_active?: boolean },
  ) {
    setBusyId(id);
    const res = await adminUpdateBrandAction(id, patch);
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
          title="برندها"
          description="مدیریت برندهای فروشگاه — ویرایش نام"
          actions={
            <button
              type="button"
              onClick={() => void load()}
              className="border-border rounded-xl border px-4 py-2 text-sm"
            >
              تازه‌سازی
            </button>
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
            placeholder="نام برند جدید"
            className="border-input bg-background h-10 min-w-[12rem] flex-1 rounded-xl border px-3 text-sm"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-primary-foreground h-10 rounded-xl px-5 text-sm font-medium disabled:opacity-60"
          >
            {creating ? "…" : "افزودن"}
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <LumaSpin />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            برندی نیست.
          </p>
        ) : (
          <div className="table-scroll border-border overflow-x-auto rounded-2xl border">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">نام</th>
                  <th className="p-3 font-medium">slug</th>
                  <th className="p-3 font-medium">فعال</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-border border-t">
                    <td className="p-3">
                      <input
                        defaultValue={r.name}
                        disabled={busyId === r.id}
                        className="border-input bg-background h-9 w-full min-w-[8rem] rounded-lg border px-2 text-sm font-medium"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== r.name) void save(r.id, { name: v });
                        }}
                      />
                    </td>
                    <td className="text-muted-foreground p-3 font-mono text-xs">
                      {r.slug}
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
