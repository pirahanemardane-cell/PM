import { BaseRepository } from "./base.repository";

export type CreateOrderInput = {
  userId: string;
  items: {
    variantId: string;
    productId: string;
    title: string;
    sizeName?: string;
    colorName?: string;
    unitPrice: number;
    quantity: number;
  }[];
  shipping: {
    name: string;
    phone: string;
    address: string;
    city?: string;
    postal?: string;
  };
  note?: string;
  discountCode?: string | null;
  discountAmount?: number;
};

export class OrderRepository extends BaseRepository {
  async createFromCart(input: CreateOrderInput): Promise<string> {
    const supabase = await this.getClient();
    // کسر موجودی باید از RLS مشتری رد شود → service role
    const { createServiceClient } = await import("@/lib/supabase/service");
    const service = createServiceClient();

    // 1) بررسی + رزرو موجودی (قبل از ساخت سفارش)
    for (const item of input.items) {
      const qty = Number(item.quantity);
      if (!item.variantId || qty < 1) {
        throw new Error("invalid_item");
      }
      const { data: variant, error: vErr } = await service
        .from("product_variants")
        .select("id, stock_quantity, is_active")
        .eq("id", item.variantId)
        .maybeSingle();
      if (vErr) throw vErr;
      if (!variant || variant.is_active === false) {
        throw new Error(`unavailable:${item.title || item.variantId}`);
      }
      const stock = Number(variant.stock_quantity ?? 0);
      if (stock < qty) {
        throw new Error(`insufficient_stock:${item.title || item.variantId}`);
      }
      // update شرطی — جلوگیری از race ساده
      const { data: updated, error: uErr } = await service
        .from("product_variants")
        .update({ stock_quantity: stock - qty })
        .eq("id", item.variantId)
        .gte("stock_quantity", qty)
        .select("id")
        .maybeSingle();
      if (uErr) throw uErr;
      if (!updated) {
        throw new Error(`insufficient_stock:${item.title || item.variantId}`);
      }
    }

    const total = input.items.reduce(
      (s, i) => s + i.unitPrice * i.quantity,
      0
    );

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        user_id: input.userId,
        status: "pending",
        total_amount: Math.max(0, Number(total) - Number(input.discountAmount ?? 0)),
        discount_code: input.discountCode ?? null,
        discount_amount: input.discountAmount ?? 0,
        shipping_name: input.shipping.name,
        shipping_phone: input.shipping.phone,
        shipping_address: input.shipping.address,
        shipping_city: input.shipping.city ?? null,
        shipping_postal: input.shipping.postal ?? null,
        note: input.note ?? null,
      })
      .select("id")
      .single();

    if (oErr) {
      // best-effort rollback stock
      for (const item of input.items) {
        try {
          const { data: v } = await service
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", item.variantId)
            .maybeSingle();
          if (v) {
            await service
              .from("product_variants")
              .update({
                stock_quantity: Number(v.stock_quantity ?? 0) + Number(item.quantity),
              })
              .eq("id", item.variantId);
          }
        } catch (re) {
          console.error("[createFromCart] stock rollback", item.variantId, re);
        }
      }
      throw oErr;
    }

    const rows = input.items.map((i) => ({
      order_id: order.id,
      variant_id: i.variantId,
      product_id: i.productId,
      title: i.title,
      size_name: i.sizeName ?? null,
      color_name: i.colorName ?? null,
      unit_price: i.unitPrice,
      quantity: i.quantity,
      line_total: i.unitPrice * i.quantity,
    }));

    const { error: iErr } = await supabase.from("order_items").insert(rows);
    if (iErr) {
      for (const item of input.items) {
        try {
          const { data: v } = await service
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", item.variantId)
            .maybeSingle();
          if (v) {
            await service
              .from("product_variants")
              .update({
                stock_quantity: Number(v.stock_quantity ?? 0) + Number(item.quantity),
              })
              .eq("id", item.variantId);
          }
        } catch (re) {
          console.error("[createFromCart] stock rollback items", item.variantId, re);
        }
      }
      throw iErr;
    }

    return order.id;
  }

  async listByUser(userId: string) {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        discount_code,
        discount_amount,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        created_at,
        order_items(id, title, size_name, color_name, unit_price, quantity, line_total)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getById(orderId: string, userId: string) {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        discount_code,
        discount_amount,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_postal,
        note,
        created_at,
        order_items(id, title, size_name, color_name, unit_price, quantity, line_total, variant_id)
      `
      )
      .eq("id", orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async trackPublic(code: string) {
    const supabase = await this.getClient();
    const q = code
      .trim()
      .toLowerCase()
      .replace(/[^0-9a-f-]/g, "");
    if (q.length < 8) return null;

    // UUID کامل
    if (q.length >= 32) {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, status, total_amount, shipping_name, shipping_city, created_at, order_items(id, title, size_name, color_name, quantity, unit_price, line_total)"
        )
        .eq("id", q)
        .maybeSingle();
      if (error) {
        console.error("[trackPublic full]", error);
        throw error;
      }
      return data;
    }

    // پیشوند — cast به text در PostgREST با filter
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, status, total_amount, shipping_name, shipping_city, created_at, order_items(id, title, size_name, color_name, quantity, unit_price, line_total)"
      )
      .like("id", `${q}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[trackPublic prefix]", error);
      // fallback: همه سفارش‌های اخیر و فیلتر در JS (فقط برای dev/تست)
      const { data: all, error: e2 } = await supabase
        .from("orders")
        .select(
          "id, status, total_amount, shipping_name, shipping_city, created_at, order_items(id, title, size_name, color_name, quantity, unit_price, line_total)"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (e2) {
        console.error("[trackPublic fallback]", e2);
        throw e2;
      }
      const hit = (all ?? []).find((o: { id: string }) =>
        String(o.id).toLowerCase().startsWith(q)
      );
      return hit ?? null;
    }
    return data;
  }


  async listAll(
    limit = 50,
    opts?: { status?: string; q?: string },
  ) {
    const supabase = await this.getClient();
    let q = supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        discount_code,
        discount_amount,
        shipping_name,
        shipping_phone,
        shipping_city,
        shipping_address,
        note,
        created_at,
        order_items(id, title, quantity, line_total)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (opts?.status && opts.status !== "all") {
      q = q.eq("status", opts.status);
    }
    if (opts?.q && opts.q.trim()) {
      const term = opts.q.trim();
      // جستجوی ساده روی نام/تلفن (ilike)
      q = q.or(
        `shipping_name.ilike.%${term}%,shipping_phone.ilike.%${term}%`,
      );
    }

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  async updateStatus(orderId: string, status: string) {
    const supabase = await this.getClient();
    const allowed = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) throw new Error("bad_status");
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    if (error) throw error;
    return true;
  }


  async getByIdAdmin(orderId: string) {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        status,
        total_amount,
        discount_code,
        discount_amount,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_postal,
        note,
        created_at,
        order_items(id, title, size_name, color_name, unit_price, quantity, line_total, variant_id)
      `
      )
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

}
