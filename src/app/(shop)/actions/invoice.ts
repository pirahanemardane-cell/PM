"use server";

import { createClient } from "@/lib/supabase/server";

export type CustomerInvoiceDTO = {
  id: string;
  created_at: string;
  status: string;
  payment_status: string | null;
  total_amount: number;
  discount_amount: number | null;
  loyalty_points_redeemed?: number | null;
  loyalty_discount_amount?: number | null;
  shipping_fee: number | null;
  shipping_method_title: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal: string | null;
  discount_code: string | null;
  tracking_number: string | null;
  items: {
    id: string;
    title: string;
    size_name: string | null;
    color_name: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
};

export async function getMyOrderInvoiceAction(orderId: string): Promise<{
  ok: true;
  order: CustomerInvoiceDTO;
} | { ok: false; error: string }> {
  try {
    const id = (orderId || "").trim();
    if (!id) return { ok: false, error: "missing" };
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "login_required" };

    let { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        created_at,
        status,
        payment_status,
        total_amount,
        discount_amount,
        loyalty_points_redeemed,
        loyalty_discount_amount,
        shipping_fee,
        shipping_method_title,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_postal,
        discount_code,
        tracking_number,
        order_items(id, title, size_name, color_name, quantity, unit_price, line_total)
      `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Fallback if loyalty columns (068) not applied yet
    if (error) {
      const retry = await supabase
        .from("orders")
        .select(
          `
          id,
          created_at,
          status,
          payment_status,
          total_amount,
          discount_amount,
          shipping_fee,
          shipping_method_title,
          shipping_name,
          shipping_phone,
          shipping_address,
          shipping_city,
          shipping_postal,
          discount_code,
          tracking_number,
          order_items(id, title, size_name, color_name, quantity, unit_price, line_total)
        `,
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      data = retry.data as typeof data;
      error = retry.error;
    }

    if (error) throw error;
    if (!data) return { ok: false, error: "not_found" };

    const row = data as any;
    return {
      ok: true,
      order: {
        id: row.id,
        created_at: row.created_at,
        status: row.status,
        payment_status: row.payment_status,
        total_amount: Number(row.total_amount ?? 0),
        discount_amount: row.discount_amount != null ? Number(row.discount_amount) : null,
        loyalty_points_redeemed: row.loyalty_points_redeemed ?? null,
        loyalty_discount_amount:
          row.loyalty_discount_amount != null ? Number(row.loyalty_discount_amount) : null,
        shipping_fee: row.shipping_fee != null ? Number(row.shipping_fee) : null,
        shipping_method_title: row.shipping_method_title,
        shipping_name: row.shipping_name,
        shipping_phone: row.shipping_phone,
        shipping_address: row.shipping_address,
        shipping_city: row.shipping_city,
        shipping_postal: row.shipping_postal,
        discount_code: row.discount_code,
        tracking_number: row.tracking_number,
        items: (row.order_items ?? []).map((it: any) => ({
          id: it.id,
          title: it.title,
          size_name: it.size_name,
          color_name: it.color_name,
          quantity: Number(it.quantity ?? 0),
          unit_price: Number(it.unit_price ?? 0),
          line_total: Number(it.line_total ?? 0),
        })),
      },
    };
  } catch (e) {
    console.error("[getMyOrderInvoice]", e);
    return { ok: false, error: "server" };
  }
}
