"use server";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "login_required", supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role;
  if (role && role !== "admin") {
    return { ok: false as const, error: "forbidden", supabase };
  }
  return { ok: true as const, supabase };
}

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
