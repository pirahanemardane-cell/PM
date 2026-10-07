"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getShippingQuote } from "@/lib/shipping/quote";
import type { ShippingMethodRow } from "@/lib/shipping/types";

export async function listActiveShippingMethodsAction() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shipping_methods")
      .select(
        "id, title, description, fee, is_active, sort_order, provider_code, pricing_type, api_config",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { ok: true as const, items: (data ?? []) as ShippingMethodRow[] };
  } catch (e) {
    console.error("[listActiveShippingMethods]", e);
    return { ok: false as const, items: [] as ShippingMethodRow[] };
  }
}

export async function quoteShippingAction(input: {
  methodId: string;
  weightGrams?: number;
  destCity?: string;
  destProvince?: string;
  parcelValueToman?: number;
}) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shipping_methods")
      .select(
        "id, title, description, fee, is_active, sort_order, provider_code, pricing_type, api_config",
      )
      .eq("id", input.methodId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false as const, error: "method_not_found" };
    }

    const method = data as ShippingMethodRow;
    if (!method.is_active) {
      return { ok: false as const, error: "method_inactive" };
    }

    const quote = await getShippingQuote(method, {
      weightGrams: input.weightGrams ?? 500,
      destCity: input.destCity,
      destProvince: input.destProvince,
      parcelValueToman: input.parcelValueToman,
    });

    return {
      ok: true as const,
      methodId: method.id,
      title: method.title,
      quote,
    };
  } catch (e) {
    console.error("[quoteShipping]", e);
    return { ok: false as const, error: "server" };
  }
}
