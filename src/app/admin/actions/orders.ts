"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { OrderRepository } from "@/repositories/order.repository";
import { createServiceClient } from "@/lib/supabase/service";
import { PREDEFINED_NOTIFICATIONS } from "@/lib/notifications/templates";

const STATUS_TEMPLATE: Record<string, string> = {
  processing: "order_processing",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

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

    // اعلان به مشتری (best-effort؛ شکست اعلان وضعیت را برنمی‌گرداند)
    try {
      const order = await repo.getByIdAdmin(orderId);
      const userId = (order as { user_id?: string | null } | null)?.user_id;
      const templateId = STATUS_TEMPLATE[status];
      if (userId && templateId) {
        const tpl = PREDEFINED_NOTIFICATIONS.find((x) => x.id === templateId);
        if (tpl) {
          const service = createServiceClient();
          const shortId = orderId.slice(0, 8);
          await service.from("notifications").insert({
            user_id: userId,
            title: tpl.title,
            body: `${tpl.body} (کد: ${shortId}…)`,
            type: tpl.type,
            link: "/dashboard?tab=orders",
          });
        }
      }
    } catch (ne) {
      console.error("[adminUpdateOrderStatus notify]", ne);
    }

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
