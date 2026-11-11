"use server";

import { createClient } from "@/lib/supabase/server";
import {
  clampRedeemPreview,
  getLoyaltyBalance,
  getPointValueToman,
} from "@/lib/loyalty/award";

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

    const pointValueToman = await getPointValueToman();

    return {
      ok: true as const,
      account: account ?? { points: 0, lifetime_points: 0, updated_at: null },
      txs: txs ?? [],
      rules: rules ?? [],
      pointValueToman,
    };
  } catch (e) {
    console.error("[getMyLoyalty]", e);
    return { ok: false as const, error: "server", account: null, txs: [], rules: [] };
  }
}

export async function previewLoyaltyRedeemAction(input: {
  wantPoints: number;
  subtotalToman: number;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false as const, error: "login_required" as const, points: 0, discountToman: 0, balance: 0 };
    }
    const balance = await getLoyaltyBalance(user.id);
    const pointValueToman = await getPointValueToman();
    const clamped = clampRedeemPreview({
      balance,
      wantPoints: Number(input.wantPoints) || 0,
      subtotalToman: Number(input.subtotalToman) || 0,
      pointValueToman,
    });
    return {
      ok: true as const,
      ...clamped,
      balance,
      pointValueToman,
    };
  } catch (e) {
    console.error("[previewLoyaltyRedeem]", e);
    return { ok: false as const, error: "server" as const, points: 0, discountToman: 0, balance: 0 };
  }
}
