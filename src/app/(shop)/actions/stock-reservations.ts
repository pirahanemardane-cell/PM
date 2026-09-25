"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { CartRepository } from "@/repositories/cart.repository";

const TTL_MINUTES = 15;

async function requireUid() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** ورود به checkout: موجودی سبد را ۱۵ دقیقه رزرو کن */
export async function reserveCheckoutStockAction() {
  try {
    const userId = await requireUid();
    if (!userId) return { ok: false as const, error: "login_required" };

    const service = createServiceClient();
    await service.rpc("release_expired_stock_reservations");

    const cartRepo = new CartRepository();
    const cartId = await cartRepo.getOrCreateCart({
      userId,
      sessionId: null,
    });
    const raw = await cartRepo.listItems(cartId);
    if (!raw.length) {
      await service.rpc("release_all_user_reservations", { p_user_id: userId });
      return { ok: false as const, error: "empty_cart" };
    }

    const failed: string[] = [];
    for (const row of raw as any[]) {
      const variantId = row.variant_id as string;
      const qty = Number(row.quantity);
      const title =
        row.product_variants?.products?.name ??
        row.product_variants?.name ??
        variantId;
      if (!variantId || qty < 1) continue;
      const { data: ok, error } = await service.rpc("reserve_variant_stock", {
        p_user_id: userId,
        p_variant_id: variantId,
        p_qty: qty,
        p_minutes: TTL_MINUTES,
      });
      if (error || !ok) {
        failed.push(String(title));
      }
    }

    if (failed.length) {
      await service.rpc("release_all_user_reservations", { p_user_id: userId });
      return {
        ok: false as const,
        error: "insufficient_stock",
        failed,
      };
    }

    const expiresAt = new Date(
      Date.now() + TTL_MINUTES * 60 * 1000,
    ).toISOString();
    return { ok: true as const, expiresAt, minutes: TTL_MINUTES };
  } catch (e) {
    console.error("[reserveCheckoutStock]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function extendCheckoutReservationAction() {
  try {
    const userId = await requireUid();
    if (!userId) return { ok: false as const, error: "login_required" };
    const service = createServiceClient();
    await service.rpc("release_expired_stock_reservations");
    const { data, error } = await service.rpc("extend_user_reservations", {
      p_user_id: userId,
      p_minutes: TTL_MINUTES,
    });
    if (error) throw error;
    return {
      ok: true as const,
      extended: Number(data ?? 0),
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString(),
    };
  } catch (e) {
    console.error("[extendCheckoutReservation]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function releaseCheckoutReservationAction() {
  try {
    const userId = await requireUid();
    if (!userId) return { ok: false as const, error: "login_required" };
    const service = createServiceClient();
    await service.rpc("release_all_user_reservations", { p_user_id: userId });
    return { ok: true as const };
  } catch (e) {
    console.error("[releaseCheckoutReservation]", e);
    return { ok: false as const, error: "server" };
  }
}
