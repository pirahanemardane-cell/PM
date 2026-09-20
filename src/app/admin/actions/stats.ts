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

    const [orders, products, users, discounts, pending] = await Promise.all([
      sb.from("orders").select("id", { count: "exact", head: true }),
      sb
        .from("products")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("discounts").select("id", { count: "exact", head: true }),
      sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    return {
      ok: true as const,
      stats: {
        orders: orders.count ?? 0,
        products: products.count ?? 0,
        users: users.count ?? 0,
        discounts: discounts.count ?? 0,
        pendingOrders: pending.count ?? 0,
      },
    };
  } catch (e) {
    console.error("[adminDashboardStats]", e);
    return { ok: false as const, error: "server", stats: null };
  }
}
