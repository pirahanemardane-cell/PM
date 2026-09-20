"use server";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "login_required", supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role;
  if (role && role !== "admin") {
    return { ok: false as const, error: "forbidden", supabase };
  }
  return { ok: true as const, supabase };
}

export async function adminListDiscountsAction(limit = 50) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("discounts")
      .select(
        "id, code, type, value, min_order_amount, max_uses, used_count, starts_at, ends_at, is_active, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListDiscounts]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminSetDiscountActiveAction(id: string, isActive: boolean) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("discounts")
      .update({ is_active: isActive })
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminSetDiscountActive]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminCreateDiscountAction(input: {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_amount?: number | null;
  max_uses?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const code = (input.code || "").trim().toUpperCase();
  if (!code || code.length < 2) return { ok: false as const, error: "bad_code" };
  if (!Number.isFinite(input.value) || input.value <= 0) {
    return { ok: false as const, error: "bad_value" };
  }
  if (input.type === "percentage" && input.value > 100) {
    return { ok: false as const, error: "bad_percent" };
  }

  try {
    const { data, error } = await gate.supabase
      .from("discounts")
      .insert({
        code,
        type: input.type,
        value: input.value,
        min_order_amount: input.min_order_amount ?? 0,
        max_uses: input.max_uses ?? null,
        used_count: 0,
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at ?? null,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true as const, id: data.id as string };
  } catch (e) {
    console.error("[adminCreateDiscount]", e);
    return { ok: false as const, error: "server" };
  }
}
