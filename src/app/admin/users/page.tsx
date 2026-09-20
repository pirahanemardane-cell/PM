"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListUsersAction,
  adminUpdateUserRoleAction,
} from "@/app/admin/actions/users";
import { LumaSpin } from "@/components/ui/luma-spin";

const ROLES = ["customer", "staff", "admin"] as const;

const ROLE_FA: Record<string, string> = {
  customer: "مشتری",
  staff: "کارمند",
  admin: "ادمین",
};

type Row = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListUsersAction(80);
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
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

  async function changeRole(id: string, role: string) {
    setBusyId(id);
    const res = await adminUpdateUserRoleAction(
      id,
      role as "customer" | "staff" | "admin",
    );
    setBusyId(null);
    if (!res.ok) {
      setError(
        res.error === "cannot_demote_self"
          ? "نمی‌توانید نقش خودتان را از ادمین بردارید"
          : "تغییر نقش ناموفق بود",
      );
      return;
    }
    setItems((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  return (
    <div className="bg-background min-h-screen p-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">کاربران</h1>
            <p className="text-muted-foreground text-sm">نقش و مشخصات پروفایل</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="border-border rounded-xl border px-4 py-2 text-sm"
            >
              تازه‌سازی
            </button>
            <Link
              href="/admin/dashboard"
              className="border-border rounded-xl border px-4 py-2 text-sm"
            >
              داشبورد
            </Link>
          </div>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <LumaSpin />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            کاربری یافت نشد.
          </p>
        ) : (
          <div className="border-border overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">نام</th>
                  <th className="p-3 font-medium">موبایل</th>
                  <th className="p-3 font-medium">نقش</th>
                  <th className="p-3 font-medium">عضویت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-border border-t">
                    <td className="p-3">
                      <div>{u.full_name || "—"}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {u.id.slice(0, 8)}…
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs" dir="ltr">
                      {u.phone || "—"}
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => void changeRole(u.id, e.target.value)}
                        className="border-input bg-background h-9 rounded-lg border px-2 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_FA[r] ?? r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-muted-foreground p-3 text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("fa-IR")}
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
