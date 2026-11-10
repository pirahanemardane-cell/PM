"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/require-permission";

export type InventoryRow = {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  size: string | null;
  color_name: string | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  is_active: boolean;
};

export async function adminListInventoryAction(opts?: {
  q?: string;
  lowOnly?: boolean;
}) {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as InventoryRow[] };
  try {
    const { data, error } = await gate.supabase
      .from("product_variants")
      .select(
        "id, product_id, size, color_name, sku, stock_quantity, low_stock_threshold, is_active, product:products(name, slug)",
      )
      .order("stock_quantity", { ascending: true })
      .limit(500);
    if (error) throw error;

    let items: InventoryRow[] = (data ?? []).map((v: any) => ({
      id: v.id,
      product_id: v.product_id,
      product_name: v.product?.name ?? "—",
      product_slug: v.product?.slug ?? "",
      size: v.size,
      color_name: v.color_name,
      sku: v.sku,
      stock_quantity: Number(v.stock_quantity ?? 0),
      low_stock_threshold: v.low_stock_threshold,
      is_active: !!v.is_active,
    }));

    const q = (opts?.q || "").trim().toLowerCase();
    if (q) {
      items = items.filter(
        (i) =>
          i.product_name.toLowerCase().includes(q) ||
          (i.sku || "").toLowerCase().includes(q) ||
          (i.size || "").toLowerCase().includes(q) ||
          (i.color_name || "").toLowerCase().includes(q),
      );
    }
    if (opts?.lowOnly) {
      items = items.filter((i) => {
        const thr = i.low_stock_threshold ?? 3;
        return i.stock_quantity <= thr;
      });
    }
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListInventory]", e);
    return { ok: false as const, error: "server", items: [] as InventoryRow[] };
  }
}

export async function adminUpdateVariantStockAction(
  variantId: string,
  stock: number,
  isActive?: boolean,
) {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const qty = Math.max(0, Math.round(Number(stock) || 0));
  try {
    const patch: Record<string, unknown> = { stock_quantity: qty };
    if (typeof isActive === "boolean") patch.is_active = isActive;
    const { error } = await gate.supabase
      .from("product_variants")
      .update(patch)
      .eq("id", variantId);
    if (error) throw error;
    revalidatePath("/admin/inventory");
    revalidatePath("/products");
    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateVariantStock]", e);
    return { ok: false as const, error: "server" };
  }
}
