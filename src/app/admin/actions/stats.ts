"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

export async function adminDashboardStatsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return {
      ok: false as const,
      error: gate.error,
      stats: null,
    };
  }

  try {
    const sb = gate.supabase;

    const [
      ordersAll,
      ordersPending,
      productsAll,
      productsPublished,
      usersAll,
      discountsActive,
    ] = await Promise.all([
      sb.from("orders").select("id", { count: "exact", head: true }),
      sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      sb
        .from("products")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      sb
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .is("deleted_at", null),
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb
        .from("discounts")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    return {
      ok: true as const,
      stats: {
        ordersTotal: ordersAll.count ?? 0,
        ordersPending: ordersPending.count ?? 0,
        productsTotal: productsAll.count ?? 0,
        productsPublished: productsPublished.count ?? 0,
        usersTotal: usersAll.count ?? 0,
        discountsActive: discountsActive.count ?? 0,
      },
    };
  } catch (e) {
    console.error("[adminDashboardStats]", e);
    return { ok: false as const, error: "server" as const, stats: null };
  }
}
