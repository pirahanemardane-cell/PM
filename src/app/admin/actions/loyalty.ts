"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/require-permission";

export type LoyaltyRuleRow = {
  id: string;
  key: string;
  label: string;
  points: number;
  is_active: boolean;
};

export async function adminListLoyaltyRulesAction() {
  const gate = await requirePermission("admin.customers");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as LoyaltyRuleRow[] };
  try {
    const { data, error } = await gate.supabase
      .from("loyalty_rules")
      .select("id, key, label, points, is_active")
      .order("key");
    if (error) throw error;
    return { ok: true as const, items: (data ?? []) as LoyaltyRuleRow[] };
  } catch (e) {
    console.error("[adminListLoyaltyRules]", e);
    return { ok: false as const, error: "server", items: [] as LoyaltyRuleRow[] };
  }
}

export async function adminSaveLoyaltyRuleAction(input: {
  id: string;
  label: string;
  points: number;
  is_active: boolean;
}) {
  const gate = await requirePermission("admin.customers");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("loyalty_rules")
      .update({
        label: input.label.trim(),
        points: Math.round(Number(input.points) || 0),
        is_active: !!input.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) throw error;
    revalidatePath("/admin/club");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}

export async function adminAdjustLoyaltyPointsAction(input: {
  userId: string;
  points: number;
  reason: string;
}) {
  const gate = await requirePermission("admin.customers");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const pts = Math.round(Number(input.points) || 0);
  if (!input.userId || !pts) return { ok: false as const, error: "invalid" };
  try {
    const { data: acc } = await gate.supabase
      .from("loyalty_accounts")
      .select("points, lifetime_points")
      .eq("user_id", input.userId)
      .maybeSingle();
    const cur = Number(acc?.points ?? 0);
    const life = Number(acc?.lifetime_points ?? 0);
    const next = Math.max(0, cur + pts);
    const nextLife = pts > 0 ? life + pts : life;
    const { error: upErr } = await gate.supabase.from("loyalty_accounts").upsert(
      {
        user_id: input.userId,
        points: next,
        lifetime_points: nextLife,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (upErr) throw upErr;
    await gate.supabase.from("loyalty_transactions").insert({
      user_id: input.userId,
      points: pts,
      reason: (input.reason || "تعدیل ادمین").trim() || "تعدیل ادمین",
    });
    revalidatePath("/admin/club");
    return { ok: true as const, points: next };
  } catch (e) {
    console.error("[adminAdjustLoyaltyPoints]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminListLoyaltyAccountsAction() {
  const gate = await requirePermission("admin.customers");
  if (!gate.ok) {
    return {
      ok: false as const,
      error: gate.error,
      items: [] as { user_id: string; points: number; lifetime_points: number; full_name: string | null; phone: string | null }[],
    };
  }
  try {
    const { data, error } = await gate.supabase
      .from("loyalty_accounts")
      .select("user_id, points, lifetime_points, profile:profiles(full_name, phone)")
      .order("points", { ascending: false })
      .limit(100);
    if (error) throw error;
    const items = (data ?? []).map((r: any) => ({
      user_id: r.user_id as string,
      points: Number(r.points ?? 0),
      lifetime_points: Number(r.lifetime_points ?? 0),
      full_name: r.profile?.full_name ?? null,
      phone: r.profile?.phone ?? null,
    }));
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListLoyaltyAccounts]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}
