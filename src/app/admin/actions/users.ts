"use server";

import { requireAdmin } from "@/lib/admin/require-admin";


type Role = "customer" | "admin" | "staff";


export async function adminListUsersAction(limit = 50) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListUsers]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminUpdateUserRoleAction(userId: string, role: Role) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  if (!["customer", "admin", "staff"].includes(role)) {
    return { ok: false as const, error: "bad_role" };
  }
  // جلوگیری از حذف نقش خودت از admin (اختیاری ولی ایمن)
  if (userId === gate.userId && role !== "admin") {
    return { ok: false as const, error: "cannot_demote_self" };
  }
  try {
    const { error } = await gate.supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateUserRole]", e);
    return { ok: false as const, error: "server" };
  }
}
