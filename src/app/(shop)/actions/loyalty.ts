"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMyLoyaltyAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false as const, error: "login_required", account: null, txs: [], rules: [] };

    const [{ data: account }, { data: txs }, { data: rules }] = await Promise.all([
      supabase
        .from("loyalty_accounts")
        .select("points, lifetime_points, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("loyalty_transactions")
        .select("id, points, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("loyalty_rules")
        .select("key, label, points, is_active")
        .eq("is_active", true),
    ]);

    return {
      ok: true as const,
      account: account ?? { points: 0, lifetime_points: 0, updated_at: null },
      txs: txs ?? [],
      rules: rules ?? [],
    };
  } catch (e) {
    console.error("[getMyLoyalty]", e);
    return { ok: false as const, error: "server", account: null, txs: [], rules: [] };
  }
}
