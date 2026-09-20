"use server";

import { createClient } from "@/lib/supabase/server";
import { ProductRepository } from "@/repositories/product.repository";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "login_required" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role;
  if (role && role !== "admin") {
    return { ok: false as const, error: "forbidden" };
  }
  return { ok: true as const };
}

export async function adminListProductsAction(limit = 50) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const repo = new ProductRepository();
    const items = await repo.listAdmin(limit);
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListProducts]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminUpdateProductFlagsAction(
  id: string,
  flags: {
    status?: string;
    is_featured?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
  },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const repo = new ProductRepository();
    await repo.updateFlags(id, flags);
    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateProductFlags]", e);
    return { ok: false as const, error: "server" };
  }
}
