"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

export type AdminDashboardStats = {
  ordersTotal: number;
  ordersPending: number;
  ordersProcessing: number;
  ordersShipped: number;
  revenueTotal: number;
  productsTotal: number;
  productsPublished: number;
  usersTotal: number;
  discountsActive: number;
  lowStockVariants: number;
  returnsOpen: number;
  ticketsOpen: number;
};

export async function adminDashboardStatsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, stats: null as AdminDashboardStats | null };
  }

  try {
    const sb = gate.supabase;

    const [
      ordersAll,
      ordersPending,
      ordersProcessing,
      ordersShipped,
      productsAll,
      productsPublished,
      usersAll,
      discountsActive,
      lowStock,
      revenueRows,
    ] = await Promise.all([
      sb.from("orders").select("id", { count: "exact", head: true }),
      sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "processing"),
      sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "shipped"),
      sb.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null),
      sb
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .is("deleted_at", null),
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("discounts").select("id", { count: "exact", head: true }).eq("is_active", true),
      sb
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("stock_quantity", 3),
      sb
        .from("orders")
        .select("total_amount")
        .not("status", "eq", "cancelled")
        .limit(5000),
    ]);

    let returnsOpen = 0;
    let ticketsOpen = 0;
    try {
      const r = await sb
        .from("return_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "open", "requested", "reviewing"]);
      returnsOpen = r.count ?? 0;
    } catch {
      /* table optional */
    }
    try {
      const t = await sb
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "pending", "new", "waiting"]);
      ticketsOpen = t.count ?? 0;
    } catch {
      /* table optional */
    }

    const revenueTotal = (revenueRows.data ?? []).reduce(
      (s, row: { total_amount?: number | string | null }) =>
        s + Number(row.total_amount ?? 0),
      0,
    );

    return {
      ok: true as const,
      stats: {
        ordersTotal: ordersAll.count ?? 0,
        ordersPending: ordersPending.count ?? 0,
        ordersProcessing: ordersProcessing.count ?? 0,
        ordersShipped: ordersShipped.count ?? 0,
        revenueTotal,
        productsTotal: productsAll.count ?? 0,
        productsPublished: productsPublished.count ?? 0,
        usersTotal: usersAll.count ?? 0,
        discountsActive: discountsActive.count ?? 0,
        lowStockVariants: lowStock.count ?? 0,
        returnsOpen,
        ticketsOpen,
      } satisfies AdminDashboardStats,
    };
  } catch (e) {
    console.error("[adminDashboardStats]", e);
    return { ok: false as const, error: "server" as const, stats: null };
  }
}
