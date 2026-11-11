import { createServiceClient } from "@/lib/supabase/service";
import { createNotificationForUser } from "@/lib/notifications/create";
import { sendTransactionalEmail } from "@/lib/email/send";

const STALE_HOURS = 6;
const MAX_PER_RUN = 40;

/**
 * Detect carts with items untouched for STALE_HOURS, notify once (in-app + email if available).
 */
export async function processAbandonedCarts(): Promise<{
  ok: true;
  scanned: number;
  notified: number;
}> {
  const service = createServiceClient();
  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: carts, error } = await service
    .from("carts")
    .select("id, user_id, updated_at, session_id")
    .not("user_id", "is", null)
    .lt("updated_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(120);

  if (error) {
    console.error("[processAbandonedCarts]", error.message);
    return { ok: true, scanned: 0, notified: 0 };
  }

  let scanned = 0;
  let notified = 0;

  for (const cart of carts ?? []) {
    if (notified >= MAX_PER_RUN) break;
    scanned += 1;
    const cartId = cart.id as string;
    const userId = cart.user_id as string | null;
    if (!userId) continue;

    const { data: already } = await service
      .from("abandoned_cart_nudges")
      .select("id")
      .eq("cart_id", cartId)
      .maybeSingle();
    if (already) continue;

    const { data: items } = await service
      .from("cart_items")
      .select("id, quantity, product_variants(price, products(name))")
      .eq("cart_id", cartId)
      .limit(20);
    if (!items?.length) continue;

    const titles = items
      .map((row: any) => {
        const v = row.product_variants;
        const p = Array.isArray(v?.products) ? v.products[0] : v?.products;
        return (p?.name as string) || null;
      })
      .filter(Boolean)
      .slice(0, 3) as string[];
    const itemCount = items.reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);
    const preview = titles.length ? titles.join("، ") : `${itemCount} قلم`;

    let channel: "in_app" | "email" | "both" = "in_app";
    try {
      await createNotificationForUser({
        userId,
        title: "سبد خرید منتظر شماست",
        body: `هنوز ${preview} در سبدتان است. همین حالا تکمیل کنید.`,
        type: "cart",
        link: "/سبد-خرید",
      });
    } catch (e) {
      console.warn("[abandoned in-app]", e);
    }

    try {
      const { data: authUser } = await service.auth.admin.getUserById(userId);
      const email = String(authUser?.user?.email ?? "").trim();
      if (email) {
        await sendTransactionalEmail({
          to: email,
          subject: "سبد خریدتان منتظر است — پیراهن مردانه",
          html: `<p>سلام،</p><p>هنوز <strong>${preview}</strong> در سبد خرید شماست.</p><p><a href="https://pirahanmardane.ir/سبد-خرید">ادامه خرید</a></p>`,
          text: `هنوز ${preview} در سبدتان است. ادامه: https://pirahanmardane.ir/سبد-خرید`,
        });
        channel = "both";
      }
    } catch (e) {
      console.warn("[abandoned email]", e);
    }

    const { error: insErr } = await service.from("abandoned_cart_nudges").insert({
      cart_id: cartId,
      user_id: userId,
      channel,
      meta: { item_count: itemCount, preview },
    });
    if (insErr) {
      console.warn("[abandoned nudge insert]", insErr.message);
      continue;
    }
    notified += 1;
  }

  return { ok: true, scanned, notified };
}
