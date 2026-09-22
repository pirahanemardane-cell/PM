"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { OrderRepository } from "@/repositories/order.repository";

export async function adminListOrdersAction(
  limit = 50,
  opts?: { status?: string; q?: string },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const repo = new OrderRepository();
    const items = await repo.listAll(limit, opts);
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
