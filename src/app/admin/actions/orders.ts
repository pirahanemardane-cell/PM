"use server";

import { createClient } from "@/lib/supabase/server";
import { OrderRepository } from "@/repositories/order.repository";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "login_required" };

  // اگر ستون role / is_admin داری اینجا چک کن؛ فعلاً فقط لاگین
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role;
  if (role && role !== "admin") {
    return { ok: false as const, error: "forbidden" };
  }

  return { ok: true as const, userId: user.id };
}

export async function adminListOrdersAction(limit = 50) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const repo = new OrderRepository();
    const items = await repo.listAll(limit);
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListOrders]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminUpdateOrderStatusAction(
  orderId: string,
  status: string,
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const repo = new OrderRepository();
    await repo.updateStatus(orderId, status);
    return { ok: true as const };
  } catch (e) {
    console.error("[adminUpdateOrderStatus]", e);
    return { ok: false as const, error: "server" };
  }
}


export async function adminGetOrderAction(orderId: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, order: null };
  try {
    const repo = new OrderRepository();
    const order = await repo.getByIdAdmin(orderId);
    if (!order) return { ok: false as const, error: "not_found", order: null };
    return { ok: true as const, order };
  } catch (e) {
    console.error("[adminGetOrder]", e);
    return { ok: false as const, error: "server", order: null };
  }
}

