"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeIranMobile } from "@/lib/numbers";

export async function subscribeStockAlertAction(input: {
  variantId: string;
  productId: string;
  phone?: string;
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
    if (!user && !phone) {
      return { ok: false as const, error: "auth_or_phone_required" };
    }
    if (phoneRaw && !phone) {
      return { ok: false as const, error: "invalid_phone" };
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
        variant_id: variantId,
        product_id: productId,
        status: "pending",
      });
      if (error) throw error;
      return { ok: true as const };
    }

    const { data: existingPh } = await service
      .from("stock_alerts")
      .select("id")
      .eq("variant_id", variantId)
      .eq("phone", phone!)
      .eq("status", "pending")
      .maybeSingle();
    if (existingPh) return { ok: true as const, already: true as const };

    const { error } = await service.from("stock_alerts").insert({
      user_id: null,
      phone: phone!,
      variant_id: variantId,
      product_id: productId,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[subscribeStockAlert]", e);
    return { ok: false as const, error: "server" };
  }
}
