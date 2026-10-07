"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type OrderStatusDTO = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
};

export async function getMyOrderStatusAction(
  orderId: string,
): Promise<{ ok: true; order: OrderStatusDTO } | { ok: false; error: string }> {
  try {
    if (!orderId) return { ok: false, error: "missing_id" };
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "login_required" };

    const service = createServiceClient();
    const { data, error } = await service
      .from("orders")
      .select("id, status, payment_status, total_amount, user_id")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("[getMyOrderStatus]", error);
      return { ok: false, error: "db" };
    }
    if (!data) return { ok: false, error: "not_found" };
    if (data.user_id && data.user_id !== user.id) {
      return { ok: false, error: "forbidden" };
    }

    return {
      ok: true,
      order: {
        id: data.id as string,
        status: String(data.status ?? "pending"),
        paymentStatus: String(
          (data as { payment_status?: string }).payment_status ?? "pending",
        ),
        total: Number(data.total_amount ?? 0),
      },
    };
  } catch (e) {
    console.error("[getMyOrderStatus]", e);
    return { ok: false, error: "server" };
  }
}
