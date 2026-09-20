"use server";

import { createClient } from "@/lib/supabase/server";
import { WishlistRepository } from "@/repositories/wishlist.repository";
import { AddressRepository, type AddressInput } from "@/repositories/address.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { CartRepository } from "@/repositories/cart.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getSessionId() {
  const jar = await cookies();
  let sid = jar.get("pm_cart_sid")?.value;
  if (!sid) {
    sid = randomUUID();
    jar.set("pm_cart_sid", sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return sid;
}

async function resolveCartId() {
  const user = await requireUser();
  const cartRepo = new CartRepository();
  return cartRepo.getOrCreateCart({
    userId: user?.id ?? null,
    sessionId: user ? null : await getSessionId(),
  });
}

export async function toggleWishlistAction(productId: string) {
  const user = await requireUser();
  if (!user) {
    return { ok: false as const, error: "login_required" };
  }
  try {
    const repo = new WishlistRepository();
    const { added } = await repo.toggle(user.id, productId);
    return { ok: true as const, added };
  } catch (e) {
    console.error("[toggleWishlist]", e);
    return { ok: false as const, error: "server" };
  }
}



export type WishlistItemDTO = {
  productId: string;
  title: string;
  slug: string;
  price: number;
  image?: string;
};

export async function listWishlistAction(): Promise<{
  ok: boolean;
  items: WishlistItemDTO[];
  error?: string;
}> {
  try {
    const user = await requireUser();
    if (!user) return { ok: false, items: [], error: "login_required" };
    const repo = new WishlistRepository();
    const ids = await repo.listProductIds(user.id);
    if (!ids.length) return { ok: true, items: [] };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        product_variants(price),
        product_images(url, is_primary, sort_order)
      `
      )
      .in("id", ids);
    if (error) throw error;

    const items: WishlistItemDTO[] = (data ?? []).map((p: any) => {
      const images = (p.product_images ?? []) as {
        url: string;
        is_primary?: boolean;
        sort_order?: number;
      }[];
      const sorted = images
        .slice()
        .sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
      const variants = (p.product_variants ?? []) as { price?: number }[];
      const price = variants.length
        ? Math.min(...variants.map((v) => Number(v.price ?? 0)))
        : 0;
      return {
        productId: p.id,
        title: p.name ?? "محصول",
        slug: p.slug ?? "",
        price,
        image: sorted[0]?.url,
      };
    });
    return { ok: true, items };
  } catch (e) {
    console.error("[listWishlist]", e);
    return { ok: false, items: [], error: "server" };
  }
}

export async function addToCartAction(variantId: string, quantity = 1) {
  try {
    if (!variantId) {
      return { ok: false as const, error: "variant_required" };
    }
    const cartRepo = new CartRepository();
    const cartId = await resolveCartId(); // user یا session cookie
    await cartRepo.addItem(cartId, variantId, quantity);
    return { ok: true as const };
  } catch (e) {
    console.error("[addToCart]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : e instanceof Error
          ? e.message
          : String(e);
    return { ok: false as const, error: msg };
  }
}

export async function updateCartQuantityAction(
  variantId: string,
  quantity: number
) {
  try {
    const cartId = await resolveCartId();
    const cartRepo = new CartRepository();
    await cartRepo.setQuantity(cartId, variantId, quantity);
    return { ok: true as const };
  } catch (e) {
    console.error("[updateCartQty]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function removeCartItemAction(variantId: string) {
  try {
    const cartId = await resolveCartId();
    const cartRepo = new CartRepository();
    await cartRepo.removeItem(cartId, variantId);
    return { ok: true as const };
  } catch (e) {
    console.error("[removeCartItem]", e);
    return { ok: false as const, error: "server" };
  }
}

export type CartLineDTO = {
  itemId: string;
  variantId: string;
  quantity: number;
  price: number;
  productId: string;
  title: string;
  slug: string;
  image?: string;
  size?: string;
  color?: string;
};

export async function getCartAction(): Promise<{
  ok: boolean;
  items: CartLineDTO[];
  error?: string;
}> {
  try {
    const cartId = await resolveCartId();
    const cartRepo = new CartRepository();
    const rows = await cartRepo.listItems(cartId);

    const items: CartLineDTO[] = (rows as any[]).map((row) => {
      const v = row.product_variants;
      const product = v?.products;
      const images = product?.product_images as
        | { url: string; is_primary?: boolean; sort_order?: number }[]
        | undefined;
      const sorted = (images ?? [])
        .slice()
        .sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
      return {
        itemId: row.id,
        variantId: row.variant_id,
        quantity: row.quantity,
        price: Number(v?.price ?? 0),
        productId: product?.id ?? v?.product_id ?? "",
        title: product?.name ?? "محصول",
        slug: product?.slug ?? "",
        image: sorted[0]?.url,
        size: v?.size?.name ?? undefined,
        color: v?.color?.name ?? undefined,
        colorHex: v?.color?.hex_code ?? undefined,
      };
    });

    return { ok: true, items };
  } catch (e) {
    console.error("[getCart]", e);
    return { ok: false, items: [], error: "server" };
  }
}


export type CreateOrderPayload = {
  name: string;
  phone: string;
  address: string;
  city?: string;
  postal?: string;
  note?: string;
  discountCode?: string;
};

export async function createOrderAction(payload: CreateOrderPayload) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const cartRepo = new CartRepository();
    const cartId = await cartRepo.getOrCreateCart({
      userId: user.id,
      sessionId: null,
    });
    const raw = await cartRepo.listItems(cartId);
    if (!raw.length) return { ok: false as const, error: "empty_cart" };

    const items = raw.map((row: any) => {
      const v = row.product_variants;
      const prod = v?.products;
      const title = prod?.name ?? "محصول";
      const unitPrice = Number(v?.price ?? 0);
      return {
        variantId: row.variant_id as string,
        productId: (v?.product_id ?? prod?.id) as string,
        title,
        sizeName: v?.size?.name as string | undefined,
        colorName: v?.color?.name as string | undefined,
        unitPrice,
        quantity: row.quantity as number,
      };
    });

    const subtotal = items.reduce(
      (s, it) => s + Number(it.unitPrice) * Number(it.quantity),
      0
    );

    let discountCode: string | null = null;
    let discountAmount = 0;
    if (payload.discountCode?.trim()) {
      const v = await validateDiscountAction(payload.discountCode, subtotal);
      if (!v.ok) {
        return { ok: false as const, error: `discount_${v.error}` };
      }
      discountCode = v.discount.code;
      discountAmount = v.discount.discountAmount;
    }

    const orderRepo = new OrderRepository();
    const orderId = await orderRepo.createFromCart({
      userId: user.id,
      items,
      shipping: {
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        city: payload.city,
        postal: payload.postal,
      },
      note: payload.note,
      discountCode,
      discountAmount,
      // اگر repo هنوز total را خودش از items می‌سازد، داخل repo:
      // total = subtotal - discountAmount
    });

    // افزایش اتمی used_count
    if (discountCode) {
      try {
        const supabaseInc = await createClient();
        const { error: incErr } = await supabaseInc.rpc("increment_discount_use", {
          p_code: discountCode,
        });
        if (incErr) console.error("[discount used_count rpc]", incErr);
      } catch (e) {
        console.error("[discount used_count]", e);
      }
    }

    await cartRepo.clearCart(cartId);
    return { ok: true as const, orderId };
  } catch (e) {
    console.error("[createOrder]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : e instanceof Error
          ? e.message
          : String(e);
    return { ok: false as const, error: msg };
  }
}

export async function listMyOrdersAction() {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, items: [], error: "login_required" };
    const orderRepo = new OrderRepository();
    const items = await orderRepo.listByUser(user.id);
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listOrders]", e);
    return { ok: false as const, items: [], error: "server" };
  }
}


export async function trackOrderAction(code: string) {
  try {
    const c = (code || "").trim();
    if (c.length < 8) {
      return { ok: false as const, error: "کد سفارش حداقل ۸ کاراکتر" };
    }
    const orderRepo = new OrderRepository();
    const order = await orderRepo.trackPublic(c);
    if (!order) {
      return { ok: false as const, error: "سفارشی یافت نشد" };
    }
    return {
      ok: true as const,
      order: {
        id: order.id as string,
        status: order.status as string,
        total_amount: Number(order.total_amount ?? 0),
        shipping_name: (order as { shipping_name?: string }).shipping_name ?? null,
        shipping_city: (order as { shipping_city?: string }).shipping_city ?? null,
        created_at: order.created_at as string,
        items: ((order as { order_items?: unknown[] }).order_items ?? []).map(
          (it: any) => ({
            id: it.id,
            title: it.title,
            size_name: it.size_name,
            color_name: it.color_name,
            quantity: it.quantity,
            line_total: Number(it.line_total ?? 0),
          })
        ),
      },
    };
  } catch (e) {
    console.error("[trackOrder]", e);
    return { ok: false as const, error: "server" };
  }
}


export async function getMyProfileAction() {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return {
      ok: true as const,
      profile: data ?? {
        id: user.id,
        full_name: null,
        phone: null,
        avatar_url: null,
        role: "customer",
      },
      email: user.email ?? null,
    };
  } catch (e) {
    console.error("[getMyProfile]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function updateMyProfileAction(input: {
  full_name?: string;
  phone?: string;
}) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const supabase = await createClient();
    const patch: Record<string, string | null> = {};
    if (typeof input.full_name === "string") {
      patch.full_name = input.full_name.trim() || null;
    }
    if (typeof input.phone === "string") {
      const phone = input.phone.trim().replace(/\s/g, "");
      patch.phone = phone || null;
    }
    if (!Object.keys(patch).length) {
      return { ok: false as const, error: "nothing_to_update" };
    }
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[updateMyProfile]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "server";
    return { ok: false as const, error: msg };
  }
}


export async function listMyAddressesAction() {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, items: [], error: "login_required" };
    const repo = new AddressRepository();
    const items = await repo.list(user.id);
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listMyAddresses]", e);
    return { ok: false as const, items: [], error: "server" };
  }
}

export async function createMyAddressAction(input: AddressInput) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    if (
      !input.full_name?.trim() ||
      !input.phone?.trim() ||
      !input.city?.trim() ||
      !input.address_line?.trim()
    ) {
      return { ok: false as const, error: "required_fields" };
    }
    const repo = new AddressRepository();
    const item = await repo.create(user.id, input);
    return { ok: true as const, item };
  } catch (e) {
    console.error("[createMyAddress]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : e && typeof e === "object" && "code" in e
          ? String((e as { code: string }).code)
          : "server";
    return { ok: false as const, error: msg };
  }
}

export async function updateMyAddressAction(id: string, input: Partial<AddressInput>) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const repo = new AddressRepository();
    await repo.update(user.id, id, input);
    return { ok: true as const };
  } catch (e) {
    console.error("[updateMyAddress]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function deleteMyAddressAction(id: string) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const repo = new AddressRepository();
    await repo.remove(user.id, id);
    return { ok: true as const };
  } catch (e) {
    console.error("[deleteMyAddress]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function setDefaultAddressAction(id: string) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const repo = new AddressRepository();
    await repo.setDefault(user.id, id);
    return { ok: true as const };
  } catch (e) {
    console.error("[setDefaultAddress]", e);
    return { ok: false as const, error: "server" };
  }
}


/** محصولات فعال برای تب فروشگاه پنل خریدار */
export async function listShopProductsAction(limit = 12) {
  try {
    const repo = new ProductRepository();
    const result = await repo.findPublished({ page: 1, pageSize: limit });
    // findPublished معمولاً { data, count } یا آرایه برمی‌گرداند
    const data = Array.isArray(result)
      ? result
      : (result as { data?: unknown[] }).data ?? [];
    return { ok: true as const, products: data };
  } catch (e) {
    console.error("[listShopProducts]", e);
    return { ok: false as const, products: [], error: "server" };
  }
}


/** اقلام یک سفارش را دوباره به سبد اضافه می‌کند */
export async function reorderOrderAction(orderId: string) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const supabase = await createClient();

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (oErr) throw oErr;
    if (!order) return { ok: false as const, error: "not_found" };

    const { data: items, error: iErr } = await supabase
      .from("order_items")
      .select("variant_id, quantity")
      .eq("order_id", orderId);
    if (iErr) throw iErr;
    if (!items?.length) return { ok: false as const, error: "empty" };

    let added = 0;
    for (const it of items) {
      const variantId = (it as { variant_id?: string | null }).variant_id;
      const qty = Math.max(1, Number((it as { quantity?: number }).quantity ?? 1));
      if (!variantId) continue;
      const res = await addToCartAction(variantId, qty);
      if (res.ok) added += 1;
    }

    if (added === 0) return { ok: false as const, error: "none_added" };
    return { ok: true as const, added };
  } catch (e) {
    console.error("[reorderOrder]", e);
    return { ok: false as const, error: "server" };
  }
}


export type DiscountPreview = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discountAmount: number;
  finalTotal: number;
};

/** اعتبارسنجی کد تخفیف برای مبلغ فعلی سبد */
export async function validateDiscountAction(
  code: string,
  subtotal: number,
): Promise<
  | {
      ok: true;
      discount: {
        code: string;
        type: string;
        value: number;
        discountAmount: number;
        finalTotal: number;
      };
    }
  | { ok: false; error: string }
> {
  const raw = (code || "").trim();
  if (!raw) return { ok: false, error: "empty" };
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { ok: false, error: "bad_subtotal" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .select(
      "id, code, type, value, min_order_amount, max_uses, used_count, starts_at, ends_at, is_active",
    )
    .ilike("code", raw)
    .maybeSingle();

  if (error) {
    console.error("validateDiscount", error);
    return { ok: false, error: "db" };
  }
  if (!data) return { ok: false, error: "not_found" };
  if (!data.is_active) return { ok: false, error: "inactive" };

  const now = Date.now();
  if (data.starts_at && new Date(data.starts_at).getTime() > now) {
    return { ok: false, error: "not_started" };
  }
  if (data.ends_at && new Date(data.ends_at).getTime() < now) {
    return { ok: false, error: "expired" };
  }

  const maxUses = data.max_uses;
  const used = Number(data.used_count ?? 0);
  if (maxUses != null && used >= Number(maxUses)) {
    return { ok: false, error: "max_uses" };
  }

  const minOrder = Number(data.min_order_amount ?? 0);
  if (subtotal < minOrder) return { ok: false, error: "min_order" };

  const value = Number(data.value);
  const t = String(data.type || "").toLowerCase();
  let discountAmount = 0;
  if (t === "percentage" || t === "percent") {
    discountAmount = Math.floor((subtotal * value) / 100);
  } else if (t === "fixed" || t === "amount") {
    discountAmount = Math.floor(value);
  } else {
    return { ok: false, error: "bad_type" };
  }

  if (discountAmount > subtotal) discountAmount = subtotal;
  if (discountAmount < 0) discountAmount = 0;

  return {
    ok: true,
    discount: {
      code: data.code,
      type: data.type,
      value,
      discountAmount,
      finalTotal: subtotal - discountAmount,
    },
  };
}


/** لیست کدهای فعال برای تب پنل (فقط نمایش عمومی) */
export async function listActiveDiscountsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("discounts")
      .select("code, type, value, min_order_amount, ends_at, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    const now = Date.now();
    const items = (data ?? []).filter((d) => {
      if (d.ends_at && new Date(d.ends_at).getTime() < now) return false;
      return true;
    });
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listActiveDiscounts]", e);
    return { ok: false as const, items: [], error: "server" };
  }
}

/** بعد از لاگین: سبد cookie مهمان → سبد کاربر */
export async function mergeGuestCartAction() {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const sid = await getSessionId();
    if (!sid) return { ok: true as const, skipped: true as const };
    const cartRepo = new CartRepository();
    await cartRepo.mergeSessionIntoUser(sid, user.id);
    return { ok: true as const };
  } catch (e) {
    console.error("[mergeGuestCart]", e);
    return { ok: false as const, error: "server" };
  }
}

