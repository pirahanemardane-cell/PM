"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

export async function adminListReviewsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("reviews")
      .select(
        "id, rating, title, body, is_approved, created_at, product:products(name), user:profiles(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);
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
