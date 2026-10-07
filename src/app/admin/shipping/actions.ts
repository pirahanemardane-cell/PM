"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function createShippingMethod(input: {
  title: string;
  description?: string;
  fee: number;
  sort_order?: number;
}) {
  const title = (input.title || "").trim();
  if (!title) return { error: "title_required" };
  const fee = Math.max(0, Math.floor(Number(input.fee) || 0));
  const supabase = createServiceClient();
  const { error } = await supabase.from("shipping_methods").insert({
    title,
    description: (input.description || "").trim() || null,
    fee,
    sort_order: input.sort_order ?? 99,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function updateShippingMethod(
  id: string,
  input: {
    title?: string;
    description?: string;
    fee?: number;
    is_active?: boolean;
    sort_order?: number;
  },
) {
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined)
    patch.description = input.description.trim() || null;
  if (input.fee !== undefined) patch.fee = Math.max(0, Math.floor(Number(input.fee) || 0));
  if (input.is_active !== undefined) patch.is_active = !!input.is_active;
  if (input.sort_order !== undefined) patch.sort_order = Number(input.sort_order) || 0;

  const { error } = await supabase
    .from("shipping_methods")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function deleteShippingMethod(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("shipping_methods").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { ok: true };
}
