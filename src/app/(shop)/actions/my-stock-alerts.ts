"use server";

import { createClient } from "@/lib/supabase/server";

export async function listMyStockAlertsAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false as const, error: "login_required", items: [] };

    const { data, error } = await supabase
      .from("stock_alerts")
      .select(
        "id, status, created_at, notified_at, product:products(name, slug), variant:product_variants(size, color_name)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listMyStockAlerts]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function cancelMyStockAlertAction(id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const { error } = await supabase
      .from("stock_alerts")
      .update({ status: "cancelled", is_active: false })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}
