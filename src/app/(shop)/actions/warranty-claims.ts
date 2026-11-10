"use server";

import { createClient } from "@/lib/supabase/server";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function listMyWarrantyClaimsAction() {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required", items: [] };
    const { data, error } = await supabase
      .from("warranty_claims")
      .select(
        "id, claim_type, status, body, admin_note, created_at, order_id, product:products(name, slug)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listMyWarrantyClaims]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function createWarrantyClaimAction(input: {
  claimType: "warranty" | "exchange" | "stitching";
  body: string;
  orderId?: string;
  productId?: string;
}) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const body = assertNoLinkOrImage(input.body, "توضیحات");
    if (!body.ok) return { ok: false as const, error: body.error };
    if (!body.text || body.text.length < 10) return { ok: false as const, error: "body_short" };

    const { error } = await supabase.from("warranty_claims").insert({
      user_id: user.id,
      claim_type: input.claimType,
      body: body.text,
      order_id: input.orderId || null,
      product_id: input.productId || null,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[createWarrantyClaim]", e);
    return { ok: false as const, error: "server" };
  }
}
