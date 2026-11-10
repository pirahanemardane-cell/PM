"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/require-permission";

export type ComplementAdminRow = {
  id: string;
  product_id: string;
  complement_product_id: string;
  label: string | null;
  sort_order: number;
  is_bundle: boolean;
  bundle_price: number | null;
  product?: { name: string; slug: string } | null;
  complement?: { name: string; slug: string } | null;
};

export async function adminListComplementsAction() {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as ComplementAdminRow[] };
  try {
    const { data, error } = await gate.supabase
      .from("product_complements")
      .select(
        "id, product_id, complement_product_id, label, sort_order, is_bundle, bundle_price, product:products!product_complements_product_id_fkey(name, slug), complement:products!product_complements_complement_product_id_fkey(name, slug)",
      )
      .order("sort_order")
      .limit(300);
    if (error) throw error;
    return { ok: true as const, items: (data ?? []) as unknown as ComplementAdminRow[] };
  } catch (e) {
    console.error("[adminListComplements]", e);
    return { ok: false as const, error: "server", items: [] as ComplementAdminRow[] };
  }
}

export async function adminAddComplementAction(input: {
  productId: string;
  complementProductId: string;
  label?: string;
  isBundle?: boolean;
  bundlePrice?: number | null;
}) {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  if (!input.productId || !input.complementProductId) {
    return { ok: false as const, error: "missing" };
  }
  if (input.productId === input.complementProductId) {
    return { ok: false as const, error: "same_product" };
  }
  try {
    const { error } = await gate.supabase.from("product_complements").insert({
      product_id: input.productId,
      complement_product_id: input.complementProductId,
      label: (input.label || "").trim() || null,
      is_bundle: !!input.isBundle,
      bundle_price: input.bundlePrice ?? null,
    });
    if (error) {
      if (error.code === "23505") return { ok: false as const, error: "duplicate" };
      throw error;
    }
    revalidatePath("/admin/bundles");
    return { ok: true as const };
  } catch (e) {
    console.error("[adminAddComplement]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminDeleteComplementAction(id: string) {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("product_complements")
      .delete()
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/bundles");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}

export async function adminSearchProductsForBundleAction(q: string) {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as { id: string; name: string; slug: string }[] };
  const term = (q || "").trim();
  if (term.length < 1) return { ok: true as const, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("products")
      .select("id, name, slug")
      .ilike("name", `%${term}%`)
      .eq("status", "published")
      .limit(20);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch {
    return { ok: false as const, error: "server", items: [] };
  }
}
