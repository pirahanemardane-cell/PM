import { createServiceClient } from "@/lib/supabase/service";

const DEFAULT_POINT_VALUE_TOMAN = 1000;
const ORDER_PAID_PER_TOMAN = 100_000;

export async function getActiveLoyaltyRule(key: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("loyalty_rules")
    .select("id, key, label, points, is_active, meta")
    .eq("key", key)
    .maybeSingle();
  if (!data || !(data as { is_active?: boolean }).is_active) return null;
  return data as {
    id: string;
    key: string;
    label: string;
    points: number;
    is_active: boolean;
    meta: Record<string, unknown> | null;
  };
}

export async function getLoyaltyBalance(userId: string): Promise<number> {
  if (!userId) return 0;
  const service = createServiceClient();
  const { data } = await service
    .from("loyalty_accounts")
    .select("points")
    .eq("user_id", userId)
    .maybeSingle();
  return Math.max(0, Number(data?.points ?? 0));
}

export async function getPointValueToman(): Promise<number> {
  const rule = await getActiveLoyaltyRule("point_value_toman");
  const n = Math.round(Number(rule?.points ?? DEFAULT_POINT_VALUE_TOMAN));
  return n > 0 ? n : DEFAULT_POINT_VALUE_TOMAN;
}

/** Upsert balance + insert transaction. Positive = earn, negative = redeem/adjust. */
export async function applyLoyaltyDelta(input: {
  userId: string;
  points: number;
  reason: string;
  orderId?: string | null;
}): Promise<{ ok: true; points: number } | { ok: false; error: string }> {
  const pts = Math.round(Number(input.points) || 0);
  if (!input.userId || !pts) return { ok: false, error: "invalid" };
  const service = createServiceClient();

  const { data: acc } = await service
    .from("loyalty_accounts")
    .select("points, lifetime_points")
    .eq("user_id", input.userId)
    .maybeSingle();
  const cur = Number(acc?.points ?? 0);
  const life = Number(acc?.lifetime_points ?? 0);
  const next = Math.max(0, cur + pts);
  if (pts < 0 && cur + pts < 0) return { ok: false, error: "insufficient" };
  const nextLife = pts > 0 ? life + pts : life;

  const { error: upErr } = await service.from("loyalty_accounts").upsert(
    {
      user_id: input.userId,
      points: next,
      lifetime_points: nextLife,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (upErr) {
    console.error("[applyLoyaltyDelta upsert]", upErr);
    return { ok: false, error: "server" };
  }

  const { error: txErr } = await service.from("loyalty_transactions").insert({
    user_id: input.userId,
    points: pts,
    reason: (input.reason || "تعدیل").trim() || "تعدیل",
    order_id: input.orderId || null,
  });
  if (txErr) {
    // Unique violation = already awarded for this order
    if ((txErr as { code?: string }).code === "23505") {
      return { ok: true, points: cur };
    }
    console.error("[applyLoyaltyDelta tx]", txErr);
    return { ok: false, error: "server" };
  }
  return { ok: true, points: next };
}

/** Award points when an order first becomes paid. Idempotent via unique index. */
export async function awardOrderPaidLoyalty(input: {
  userId: string | null | undefined;
  orderId: string;
  orderTotalToman: number;
}): Promise<{ ok: boolean; awarded?: number }> {
  const userId = (input.userId || "").trim();
  if (!userId || !input.orderId) return { ok: false };
  const rule = await getActiveLoyaltyRule("order_paid");
  if (!rule) return { ok: true, awarded: 0 };
  const per = Math.max(1, Math.round(Number(rule.points) || 1));
  const total = Math.max(0, Math.floor(Number(input.orderTotalToman) || 0));
  const units = Math.floor(total / ORDER_PAID_PER_TOMAN);
  const awarded = units * per;
  if (awarded <= 0) return { ok: true, awarded: 0 };

  const res = await applyLoyaltyDelta({
    userId,
    points: awarded,
    reason: `order_paid:${input.orderId.slice(0, 8)}`,
    orderId: input.orderId,
  });
  return { ok: res.ok, awarded: res.ok ? awarded : 0 };
}

export async function awardReviewApprovedLoyalty(input: {
  userId: string | null | undefined;
  reviewId: string;
}): Promise<{ ok: boolean; awarded?: number }> {
  const userId = (input.userId || "").trim();
  if (!userId) return { ok: false };
  const rule = await getActiveLoyaltyRule("review_approved");
  if (!rule) return { ok: true, awarded: 0 };
  const awarded = Math.max(0, Math.round(Number(rule.points) || 0));
  if (awarded <= 0) return { ok: true, awarded: 0 };

  const service = createServiceClient();
  const reason = `review_approved:${input.reviewId}`;
  const { data: prior } = await service
    .from("loyalty_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", reason)
    .maybeSingle();
  if (prior) return { ok: true, awarded: 0 };

  const res = await applyLoyaltyDelta({
    userId,
    points: awarded,
    reason,
  });
  return { ok: res.ok, awarded: res.ok ? awarded : 0 };
}

export function clampRedeemPreview(input: {
  balance: number;
  wantPoints: number;
  subtotalToman: number;
  pointValueToman: number;
}): { points: number; discountToman: number } {
  const value = Math.max(1, Math.round(input.pointValueToman) || DEFAULT_POINT_VALUE_TOMAN);
  const bal = Math.max(0, Math.floor(input.balance));
  const want = Math.max(0, Math.floor(input.wantPoints));
  const sub = Math.max(0, Math.floor(input.subtotalToman));
  const maxByMoney = Math.floor(sub / value);
  const points = Math.min(bal, want, maxByMoney);
  return { points, discountToman: points * value };
}

/** Redeem at checkout — deducts points immediately; caller stores snapshot on order. */
export async function redeemLoyaltyAtCheckout(input: {
  userId: string;
  orderId: string;
  points: number;
}): Promise<{ ok: true; points: number; discountToman: number } | { ok: false; error: string }> {
  const pts = Math.max(0, Math.floor(Number(input.points) || 0));
  if (!pts) return { ok: true, points: 0, discountToman: 0 };
  const value = await getPointValueToman();
  const discountToman = pts * value;
  const res = await applyLoyaltyDelta({
    userId: input.userId,
    points: -pts,
    reason: `redeem:${input.orderId.slice(0, 8)}`,
    orderId: input.orderId,
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, points: pts, discountToman };
}
