"use server";

import { createClient } from "@/lib/supabase/server";
import { WishlistRepository } from "@/repositories/wishlist.repository";
import { AddressRepository, type AddressInput } from "@/repositories/address.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { CartRepository } from "@/repositories/cart.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { cookies } from "next/headers";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";
import { randomUUID } from "crypto";
import { normalizePhone, normalizeIranMobile, toEnglishDigits } from "@/lib/numbers";

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
  const sessionId = await getSessionId();

  // اگر لاگین است: سبد کاربر + ادغام سبد مهمان (cookie)
  if (user?.id) {
    try {
      await cartRepo.mergeSessionIntoUser(sessionId, user.id);
    } catch (e) {
      console.error("[mergeSessionIntoUser]", e);
    }
    return cartRepo.getOrCreateCart({ userId: user.id, sessionId: null });
  }

  // مهمان: فقط session
  return cartRepo.getOrCreateCart({ userId: null, sessionId });
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
        product_images(url, is_primary, sort_order, variant_id)
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

export async function swapCartVariantAction(input: {
  oldVariantId: string;
  productId: string;
  colorHex?: string | null;
  size?: string | null;
  quantity?: number;
}): Promise<{ ok: boolean; error?: string; variantId?: string }> {
  try {
    const qty = Math.max(1, Number(input.quantity) || 1);
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: vars, error } = await supabase
      .from("product_variants")
      .select("id, color_name, color_hex, size, is_active, stock_quantity")
      .eq("product_id", input.productId)
      .eq("is_active", true);
    if (error) throw error;

    const norm = (s?: string | null) =>
      (s || "").trim().replace(/^#/, "").toLowerCase();
    const wantHex = norm(input.colorHex);
    const wantSize = (input.size || "").trim().toUpperCase();

    const match = (vars ?? []).find((v: any) => {
      const hex = norm(v.color_hex);
      const name = norm(v.color_name);
      const szRaw = v.size;
      const sz =
        typeof szRaw === "string"
          ? szRaw.trim().toUpperCase()
          : szRaw && typeof szRaw === "object"
            ? String(szRaw.name || "").trim().toUpperCase()
            : "";
      const colorOk =
        !wantHex ||
        hex === wantHex ||
        name === wantHex ||
        norm(v.color_hex || v.color_name) === wantHex;
      const sizeOk = !wantSize || sz === wantSize;
      return colorOk && sizeOk;
    });

    if (!match?.id) return { ok: false, error: "variant_not_found" };

    const stock = Math.max(0, Number((match as { stock_quantity?: number }).stock_quantity ?? 0));
    if (stock < qty) {
      return { ok: false, error: `insufficient_stock:${stock}` };
    }
    if (match.id === input.oldVariantId) {
      return { ok: true, variantId: match.id as string };
    }

    const cartId = await resolveCartId();
    const cartRepo = new CartRepository();
    await cartRepo.removeItem(cartId, input.oldVariantId);
    await cartRepo.addItem(cartId, match.id as string, qty);
    return { ok: true, variantId: match.id as string };
  } catch (e) {
    console.error("[swapCartVariant]", e);
    return { ok: false, error: "server" };
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
  colorHex?: string;
  colors?: string[];
  sizes?: string[];
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
        | { url: string; is_primary?: boolean; sort_order?: number; variant_id?: string | null }[]
        | undefined;
      const vid = String(row.variant_id ?? v?.id ?? "");
      const byVariant = (images ?? []).find(
        (im) => im.variant_id && vid && String(im.variant_id) === vid,
      );
      const sorted = (images ?? [])
        .slice()
        .sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
      // بدون variant_id = گالری/شاخص؛ با variant_id = عکس همان واریانت
      const image = byVariant?.url ?? sorted.find((im) => !im.variant_id)?.url ?? sorted[0]?.url;
      return {
        itemId: row.id,
        variantId: row.variant_id,
        quantity: row.quantity,
        price: Number(v?.price ?? 0),
        productId: product?.id ?? v?.product_id ?? "",
        title: product?.name ?? "محصول",
        slug: product?.slug ?? "",
        image,
        size: typeof v?.size === "string" ? v.size : v?.size?.name ?? undefined,
        color: v?.color_name ?? (typeof v?.color === "string" ? v.color : v?.color?.name) ?? undefined,
        colorHex: v?.color_hex ?? v?.color?.hex_code ?? undefined,
      };
    });

    // گزینه‌های رنگ/سایز همه وریانت‌های همان محصول
    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    if (productIds.length) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: vars, error: vErr } = await supabase
          .from("product_variants")
          .select("id, product_id, color_name, color_hex, size, is_active, stock_quantity")
          .in("product_id", productIds)
          .eq("is_active", true);
        if (vErr) console.error("[getCart variants]", vErr);
        const byProd = new Map<string, { colors: string[]; sizes: string[] }>();
        for (const v of vars ?? []) {
          const pid = (v as { product_id: string }).product_id;
          if (!pid) continue;
          const entry = byProd.get(pid) ?? { colors: [], sizes: [] };
          const hexRaw = ((v as { color_hex?: string }).color_hex || "").trim();
          const nameRaw = ((v as { color_name?: string }).color_name || "").trim();
          // اولویت با hex؛ نام فقط اگر hex نبود
          let colorKey = hexRaw;
          if (!colorKey && nameRaw) colorKey = nameRaw;
          if (colorKey) {
            const exists = entry.colors.some(
              (c) => c.replace(/^#/, "").toLowerCase() === colorKey.replace(/^#/, "").toLowerCase()
                || c === colorKey,
            );
            if (!exists) entry.colors.push(colorKey.startsWith("#") || !hexRaw ? colorKey : colorKey);
            // اگر hex داریم همیشه با # نگه دار
            if (hexRaw && !entry.colors.includes(hexRaw)) {
              entry.colors = entry.colors.filter((c) => c !== nameRaw);
              if (!entry.colors.includes(hexRaw)) entry.colors.push(hexRaw);
            }
          }
          const szRaw = (v as { size?: string | { name?: string } }).size;
          const sz =
            typeof szRaw === "string"
              ? szRaw.trim()
              : szRaw && typeof szRaw === "object"
                ? String(szRaw.name || "").trim()
                : "";
          if (sz && !entry.sizes.includes(sz)) entry.sizes.push(sz);
          byProd.set(pid, entry);
        }
        // گزینه‌های کامل با موجودی برای دراور/کارت
        const optsByProd = new Map<string, { color?: string; colorHex?: string; size?: string; stock: number }[]>();
        for (const v of vars ?? []) {
          const pid = (v as { product_id: string }).product_id;
          if (!pid) continue;
          const list = optsByProd.get(pid) ?? [];
          const szRaw = (v as { size?: string | { name?: string } }).size;
          const sz =
            typeof szRaw === "string"
              ? szRaw.trim()
              : szRaw && typeof szRaw === "object"
                ? String(szRaw.name || "").trim()
                : "";
          list.push({
            color: ((v as { color_name?: string }).color_name || "").trim() || undefined,
            colorHex: ((v as { color_hex?: string }).color_hex || "").trim() || undefined,
            size: sz || undefined,
            stock: Number((v as { stock_quantity?: number }).stock_quantity ?? 0),
          });
          optsByProd.set(pid, list);
        }
        for (const it of items) {
          const opt = byProd.get(it.productId);
          if (opt) {
            it.colors = opt.colors.length ? opt.colors : it.colorHex || it.color ? [it.colorHex || it.color!] : [];
            it.sizes = opt.sizes.length ? opt.sizes : it.size ? [it.size] : [];
          }
          const vo = optsByProd.get(it.productId);
          if (vo) (it as { variantOptions?: unknown }).variantOptions = vo;
        }
      } catch (e) {
        console.error("[getCart options]", e);
      }
    }

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

      const supabaseInc = await createClient();

      // once_per_user: قبل از رزرو سراسری
      const { data: dRow } = await supabaseInc
        .from("discounts")
        .select("once_per_user")
        .ilike("code", discountCode)
        .maybeSingle();
      if ((dRow as { once_per_user?: boolean } | null)?.once_per_user) {
        const { data: prior } = await supabaseInc
          .from("orders")
          .select("id")
          .eq("user_id", user.id)
          .ilike("discount_code", discountCode)
          .limit(1)
          .maybeSingle();
        if (prior) {
          return { ok: false as const, error: "discount_already_used" };
        }
      }

      // رزرو اتمی سقف استفاده — قبل از ساخت سفارش
      const { data: reserved, error: incErr } = await supabaseInc.rpc(
        "increment_discount_use",
        { p_code: discountCode },
      );
      if (incErr) {
        console.error("[discount reserve]", incErr);
        return { ok: false as const, error: "discount_reserve_failed" };
      }
      if (reserved !== true) {
        return { ok: false as const, error: "discount_max_uses" };
      }
    }

    const nameOk = assertNoLinkOrImage(payload.name, "نام");
    if (!nameOk.ok) return { ok: false as const, error: nameOk.error };
    const phoneNorm = normalizeIranMobile(payload.phone || "");
    if (!phoneNorm) {
      return { ok: false as const, error: "شماره موبایل نامعتبر است" };
    }
    const phoneOk = assertNoLinkOrImage(phoneNorm, "تلفن");
    if (!phoneOk.ok) return { ok: false as const, error: phoneOk.error };
    const addrOk = assertNoLinkOrImage(payload.address, "آدرس");
    if (!addrOk.ok) return { ok: false as const, error: addrOk.error };
    const cityOk = assertNoLinkOrImage(payload.city ?? "", "شهر");
    if (!cityOk.ok) return { ok: false as const, error: cityOk.error };
    const noteOk = assertNoLinkOrImage(payload.note ?? "", "یادداشت");
    if (!noteOk.ok) return { ok: false as const, error: noteOk.error };

const orderRepo = new OrderRepository();
    const orderId = await orderRepo.createFromCart({
      userId: user.id,
      items,
      shipping: {
        name: nameOk.text,
        phone: phoneOk.text,
        address: addrOk.text,
        city: cityOk.text || undefined,
        postal: payload.postal,
      },
      note: noteOk.text || undefined,
      discountCode,
      discountAmount,
      // اگر repo هنوز total را خودش از items می‌سازد، داخل repo:
      // total = subtotal - discountAmount
    });

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
    const compact = c.toLowerCase().replace(/[^0-9a-f]/g, "");
    if (compact.length !== 32) {
      return { ok: false as const, error: "کد سفارش باید شناسه کامل باشد" };
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
      const nameOk = assertNoLinkOrImage(input.full_name, "نام");
      if (!nameOk.ok) return { ok: false as const, error: nameOk.error };
      patch.full_name = nameOk.text || null;
    }
    if (typeof input.phone === "string") {
      const raw = input.phone.trim().replace(/\s/g, "");
      if (!raw) {
        patch.phone = null;
      } else {
        const phoneNorm = normalizeIranMobile(raw);
        if (!phoneNorm) {
          return { ok: false as const, error: "شماره موبایل نامعتبر است" };
        }
        const phoneOk = assertNoLinkOrImage(phoneNorm, "تلفن");
        if (!phoneOk.ok) return { ok: false as const, error: phoneOk.error };
        patch.phone = phoneOk.text || null;
      }
    }
    if (!Object.keys(patch).length) {
      return { ok: false as const, error: "nothing_to_update" };
    }
    const { error } = await supabase
      .from("profiles")
      .update(patch as never)
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
    const n1 = assertNoLinkOrImage(input.full_name, "نام");
    if (!n1.ok) return { ok: false as const, error: n1.error };
    const phoneNormAddr = normalizeIranMobile(input.phone || "");
    if (!phoneNormAddr) {
      return { ok: false as const, error: "شماره موبایل نامعتبر است" };
    }
    const n2 = assertNoLinkOrImage(phoneNormAddr, "تلفن");
    if (!n2.ok) return { ok: false as const, error: n2.error };
    const n3 = assertNoLinkOrImage(input.city, "شهر");
    if (!n3.ok) return { ok: false as const, error: n3.error };
    const n4 = assertNoLinkOrImage(input.address_line, "آدرس");
    if (!n4.ok) return { ok: false as const, error: n4.error };
    input = {
      ...input,
      full_name: n1.text,
      phone: n2.text,
      city: n3.text,
      address_line: n4.text,
    };
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


/** به‌روزرسانی ایمیل کاربر فعلی */
export async function updateMyEmailAction(email: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) return { ok: false as const, error: "auth" };
    const cleaned = (email || "").trim().toLowerCase();
    if (!cleaned || !cleaned.includes("@")) {
      return { ok: false as const, error: "ایمیل نامعتبر است" };
    }
    const { error } = await supabase.auth.updateUser({ email: cleaned });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (e) {
    console.error("[updateMyEmail]", e);
    return { ok: false as const, error: "server" };
  }
}

/** حذف حساب کاربر فعلی (soft: signOut + حذف profile در صورت وجود) */
export async function deleteMyAccountAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) return { ok: false as const, error: "auth" };
    // پروفایل / داده‌های مرتبط — در صورت نبود جدول، خطا را نادیده بگیر
    try {
      await supabase.from("profiles").delete().eq("id", user.id);
    } catch {}
    // حذف کامل auth فقط با service role ممکن است؛ فعلاً session را ببند
    await supabase.auth.signOut();
    return { ok: true as const };
  } catch (e) {
    console.error("[deleteMyAccount]", e);
    return { ok: false as const, error: "server" };
  }
}
