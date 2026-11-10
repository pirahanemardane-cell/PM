"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/require-permission";

export type WarrantyClaimAdmin = {
  id: string;
  user_id: string;
  order_id: string | null;
  product_id: string | null;
  claim_type: string;
  status: string;
  body: string;
  admin_note: string | null;
  created_at: string;
  user?: { full_name: string | null; phone: string | null } | null;
  product?: { name: string; slug: string } | null;
};

export async function adminListWarrantyClaimsAction() {
  const gate = await requirePermission("admin.returns");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as WarrantyClaimAdmin[] };
  try {
    const { data, error } = await gate.supabase
      .from("warranty_claims")
      .select(
        "id, user_id, order_id, product_id, claim_type, status, body, admin_note, created_at, user:profiles(full_name, phone), product:products(name, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return { ok: true as const, items: (data ?? []) as unknown as WarrantyClaimAdmin[] };
  } catch (e) {
    console.error("[adminListWarrantyClaims]", e);
    return { ok: false as const, error: "server", items: [] as WarrantyClaimAdmin[] };
  }
}

export async function adminSetWarrantyClaimStatusAction(
  id: string,
  status: "pending" | "reviewing" | "approved" | "rejected" | "resolved",
  adminNote?: string,
) {
  const gate = await requirePermission("admin.returns");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNote !== undefined) patch.admin_note = adminNote;
    const { error } = await gate.supabase
      .from("warranty_claims")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/warranty");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}
