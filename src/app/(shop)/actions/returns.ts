"use server";

import { createClient } from "@/lib/supabase/server";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function listMyReturnsAction() {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, items: [], error: "login_required" };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("return_requests")
      .select("id, order_id, reason, status, admin_note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listMyReturns]", e);
    return { ok: false as const, items: [], error: "server" };
  }
}

export async function createReturnAction(input: {
  orderId: string;
  reason: string;
}) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    if (!input.orderId?.trim())
      return { ok: false as const, error: "order_required" };

    const reason = assertNoLinkOrImage(input.reason, "دلیل مرجوعی");
    if (!reason.ok) return { ok: false as const, error: reason.error };
    if (!reason.text || reason.text.length < 5)
      return { ok: false as const, error: "reason_short" };

    const supabase = await createClient();

    // سفارش باید مال همین کاربر باشد (نام جدول orders)
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id")
      .eq("id", input.orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (oErr) console.error("[createReturn order check]", oErr);
    if (!order) return { ok: false as const, error: "order_not_found" };

    const { data, error } = await supabase
      .from("return_requests")
      .insert({
        user_id: user.id,
        order_id: input.orderId,
        reason: reason.text,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true as const, id: data.id as string };
  } catch (e) {
    console.error("[createReturn]", e);
    return { ok: false as const, error: "server" };
  }
}
