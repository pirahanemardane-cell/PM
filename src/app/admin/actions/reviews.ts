"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

export async function adminListReviewsAction(opts?: {
  approved?: "all" | "yes" | "no";
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    let query = gate.supabase
      .from("reviews")
      .select(
        "id, rating, title, body, is_approved, created_at, product:products(name), user:profiles(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (opts?.approved === "yes") query = query.eq("is_approved", true);
    if (opts?.approved === "no") query = query.eq("is_approved", false);

    const { data, error } = await query;
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListReviews]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminSetReviewApprovedAction(id: string, is_approved: boolean) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("reviews")
      .update({ is_approved })
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}
