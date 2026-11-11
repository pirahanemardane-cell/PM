"use server";

import { createClient } from "@/lib/supabase/server";
import { CartRepository } from "@/repositories/cart.repository";
import { cookies, headers } from "next/headers";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { randomUUID } from "crypto";

export type ComplementDTO = {
  id: string;
  label: string | null;
  is_bundle: boolean;
  bundle_price: number | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image?: string | null;
    /** cheapest in-stock variant for add-to-cart */
    defaultVariantId?: string | null;
  };
};

async function resolveCartIdForComplement(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cartRepo = new CartRepository();
  const jar = await cookies();
  let sid = jar.get("pm_cart_sid")?.value?.trim();
  if (!sid || sid.length < 8) sid = randomUUID();
  try {
    jar.set("pm_cart_sid", sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    /* RSC cookie set may throw */
  }
  if (user?.id) {
    try {
      await cartRepo.mergeSessionIntoUser(sid, user.id);
    } catch {
      /* best-effort */
    }
    return cartRepo.getOrCreateCart({ userId: user.id, sessionId: null });
  }
  return cartRepo.getOrCreateCart({ userId: null, sessionId: sid });
}

export async function listProductComplementsAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_complements")
      .select(
        "id, label, is_bundle, bundle_price, sort_order, complement:products!product_complements_complement_product_id_fkey(id, name, slug, status)",
      )
      .eq("product_id", productId)
      .order("sort_order")
      .limit(12);
    if (error) throw error;

    const items: ComplementDTO[] = [];
    for (const row of data ?? []) {
      const c = (row as any).complement;
      if (!c || c.status !== "published") continue;
      const { data: vars } = await supabase
        .from("product_variants")
        .select("id, price, stock_quantity, is_active")
        .eq("product_id", c.id)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(20);
      const inStock = (vars ?? []).filter((v) => Number(v.stock_quantity ?? 0) > 0);
      const pick = inStock[0] ?? vars?.[0];
      let price = Number((row as any).bundle_price ?? 0);
      if (!price) price = Number(pick?.price ?? 0);
      const { data: imgs } = await supabase
        .from("product_images")
        .select("url, is_primary, sort_order")
        .eq("product_id", c.id)
        .is("variant_id", null)
        .order("is_primary", { ascending: false })
        .order("sort_order")
        .limit(1);
      items.push({
        id: (row as any).id,
        label: (row as any).label,
        is_bundle: !!(row as any).is_bundle,
        bundle_price: (row as any).bundle_price,
        product: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          price,
          image: imgs?.[0]?.url ?? null,
          defaultVariantId: pick?.id ?? null,
        },
      });
    }
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listProductComplements]", e);
    return { ok: false as const, items: [] as ComplementDTO[] };
  }
}

/** Add complement product to cart; applies bundle_price when is_bundle. */
export async function addComplementToCartAction(input: {
  complementRowId: string;
  quantity?: number;
}) {
  try {
    const rowId = (input.complementRowId || "").trim();
    if (!rowId) return { ok: false as const, error: "missing" };

    let ip = "unknown";
    try {
      const h = await headers();
      ip =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip") ||
        "unknown";
    } catch {
      /* optional */
    }
    const rl = await checkRateLimit({ identifier: ip, type: "cart" });
    if (!rl.success) return { ok: false as const, error: "rate_limit" };

    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("product_complements")
      .select("id, is_bundle, bundle_price, complement_product_id")
      .eq("id", rowId)
      .maybeSingle();
    if (error) throw error;
    if (!row) return { ok: false as const, error: "not_found" };

    const productId = (row as { complement_product_id: string }).complement_product_id;
    const { data: vars } = await supabase
      .from("product_variants")
      .select("id, price, stock_quantity, is_active")
      .eq("product_id", productId)
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .order("price", { ascending: true })
      .limit(1);
    const variant = vars?.[0];
    if (!variant) return { ok: false as const, error: "out_of_stock" };

    const isBundle = !!(row as { is_bundle?: boolean }).is_bundle;
    const bundlePrice = Number((row as { bundle_price?: number | null }).bundle_price ?? 0);
    const override =
      isBundle && bundlePrice > 0 ? Math.round(bundlePrice) : null;

    const cartId = await resolveCartIdForComplement();
    const cartRepo = new CartRepository();
    await cartRepo.addItem(cartId, variant.id as string, Math.max(1, Number(input.quantity) || 1), {
      unitPriceOverride: override,
      bundleComplementId: rowId,
    });
    return { ok: true as const, variantId: variant.id as string, bundlePrice: override };
  } catch (e) {
    console.error("[addComplementToCart]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "server";
    if (msg.startsWith("insufficient_stock")) {
      return { ok: false as const, error: msg };
    }
    return { ok: false as const, error: "server" };
  }
}

/** Complements for products already in the cart (cart strip). */
export async function listCartComplementSuggestionsAction(productIds: string[]) {
  try {
    const ids = [...new Set((productIds || []).filter(Boolean))].slice(0, 20);
    if (!ids.length) return { ok: true as const, items: [] as ComplementDTO[] };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_complements")
      .select(
        "id, label, is_bundle, bundle_price, product_id, complement:products!product_complements_complement_product_id_fkey(id, name, slug, status)",
      )
      .in("product_id", ids)
      .order("sort_order")
      .limit(24);
    if (error) throw error;

    const items: ComplementDTO[] = [];
    const seenComplement = new Set<string>();
    for (const row of data ?? []) {
      const c = (row as any).complement;
      if (!c || c.status !== "published") continue;
      if (ids.includes(c.id)) continue;
      if (seenComplement.has(c.id)) continue;
      seenComplement.add(c.id);
      let price = Number((row as any).bundle_price ?? 0);
      const { data: vars } = await supabase
        .from("product_variants")
        .select("id, price, stock_quantity")
        .eq("product_id", c.id)
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("price", { ascending: true })
        .limit(1);
      if (!price) price = Number(vars?.[0]?.price ?? 0);
      items.push({
        id: (row as any).id,
        label: (row as any).label,
        is_bundle: !!(row as any).is_bundle,
        bundle_price: (row as any).bundle_price,
        product: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          price,
          image: null,
          defaultVariantId: vars?.[0]?.id ?? null,
        },
      });
      if (items.length >= 6) break;
    }
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listCartComplementSuggestions]", e);
    return { ok: false as const, items: [] as ComplementDTO[] };
  }
}
