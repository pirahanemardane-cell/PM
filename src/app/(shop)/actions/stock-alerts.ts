"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeIranMobile } from "@/lib/numbers";

function normalizeEmail(raw: string): string | null {
  const e = (raw || "").trim().toLowerCase();
  if (!e) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

export async function subscribeStockAlertAction(input: {
  variantId: string;
  productId: string;
  phone?: string;
  email?: string;
}) {
  try {
    const variantId = (input.variantId || "").trim();
    const productId = (input.productId || "").trim();
    if (!variantId || !productId) {
      return { ok: false as const, error: "variant_required" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const phoneRaw = (input.phone || "").trim();
    const phone = phoneRaw ? normalizeIranMobile(phoneRaw) : null;
    if (phoneRaw && !phone) {
      return { ok: false as const, error: "invalid_phone" };
    }
    const email = normalizeEmail(input.email || "");
    if ((input.email || "").trim() && !email) {
      return { ok: false as const, error: "invalid_email" };
    }

    if (!user && !phone && !email) {
      return { ok: false as const, error: "auth_or_contact_required" };
    }

    const { data: variant } = await supabase
      .from("product_variants")
      .select("id, stock_quantity, is_active")
      .eq("id", variantId)
      .maybeSingle();
    if (!variant) return { ok: false as const, error: "variant_not_found" };
    if (Number(variant.stock_quantity ?? 0) > 0) {
      return { ok: false as const, error: "already_in_stock" };
    }

    const service = createServiceClient();

    if (user) {
      const { data: existing } = await service
        .from("stock_alerts")
        .select("id")
        .eq("variant_id", variantId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      if (existing) return { ok: true as const, already: true as const };

      const { error } = await service.from("stock_alerts").insert({
        user_id: user.id,
        phone: phone,
        email: email || user.email || null,
        variant_id: variantId,
        product_id: productId,
        status: "pending",
        is_active: true,
      });
      if (error) throw error;
      return { ok: true as const };
    }

    if (phone) {
      const { data: existingPh } = await service
        .from("stock_alerts")
        .select("id")
        .eq("variant_id", variantId)
        .eq("phone", phone)
        .eq("status", "pending")
        .maybeSingle();
      if (existingPh) return { ok: true as const, already: true as const };
    }
    if (email) {
      const { data: existingEm } = await service
        .from("stock_alerts")
        .select("id")
        .eq("variant_id", variantId)
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();
      if (existingEm) return { ok: true as const, already: true as const };
    }

    const { error } = await service.from("stock_alerts").insert({
      user_id: null,
      phone: phone,
      email: email,
      variant_id: variantId,
      product_id: productId,
      status: "pending",
      is_active: true,
    });
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[subscribeStockAlert]", e);
    return { ok: false as const, error: "server" };
  }
}
