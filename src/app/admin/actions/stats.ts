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
      stockAlertsPending,
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
      sb
        .from("stock_alerts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
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
        stockAlertsPending: stockAlertsPending.count ?? 0,
      },
    };
  } catch (e) {
    console.error("[adminDashboardStats]", e);
    return { ok: false as const, error: "server" as const, stats: null };
  }
}

export async function adminSalesReportAction(days = 30) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, report: null };
  }

  const d = Math.min(90, Math.max(1, Number(days) || 30));
  const since = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

  try {
    const sb = gate.supabase;

    const { data: orders, error } = await sb
      .from("orders")
      .select("id, status, total_amount, created_at, payment_status")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) throw error;

    const rows = orders ?? [];
    const byStatus: Record<string, number> = {};
    let revenuePaid = 0;
    let revenueAll = 0;
    let countPaid = 0;

    const dayMap = new Map<string, { orders: number; revenue: number }>();

    for (const o of rows) {
      const status = String((o as { status?: string }).status || "unknown");
      byStatus[status] = (byStatus[status] || 0) + 1;

      const total = Number((o as { total_amount?: number }).total_amount) || 0;
      revenueAll += total;

      const pay = String(
        (o as { payment_status?: string | null }).payment_status || "",
      ).toLowerCase();
      const stt = status.toLowerCase();
      const isPaid =
        pay === "paid" ||
        ["paid", "processing", "shipped", "delivered"].includes(stt);

      if (isPaid) {
        revenuePaid += total;
        countPaid += 1;
      }

      const created = String((o as { created_at?: string }).created_at || "");
      const day = created.slice(0, 10);
      if (day) {
        const cur = dayMap.get(day) || { orders: 0, revenue: 0 };
        cur.orders += 1;
        if (isPaid) cur.revenue += total;
        dayMap.set(day, cur);
      }
    }

    const byDay = [...dayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, orders: v.orders, revenue: v.revenue }));

    return {
      ok: true as const,
      report: {
        days: d,
        since,
        ordersCount: rows.length,
        paidCount: countPaid,
        revenuePaid,
        revenueAll,
        byStatus,
        byDay,
      },
    };
  } catch (e) {
    console.error("[adminSalesReport]", e);
    return { ok: false as const, error: "server" as const, report: null };
  }
}
