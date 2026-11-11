"use server";

import { requirePermission } from "@/lib/admin/require-permission";
import { processAbandonedCarts } from "@/lib/abandoned-cart/process";

export type AbandonedNudgeRow = {
  id: string;
  cart_id: string;
  user_id: string | null;
  channel: string;
  notified_at: string;
  meta: Record<string, unknown> | null;
  user?: { full_name: string | null; phone: string | null } | null;
};

export async function adminListAbandonedCartNudgesAction() {
  const gate = await requirePermission("admin.orders");
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, items: [] as AbandonedNudgeRow[] };
  }
  try {
    const { data, error } = await gate.supabase
      .from("abandoned_cart_nudges")
      .select(
        "id, cart_id, user_id, channel, notified_at, meta, user:profiles(full_name, phone)",
      )
      .order("notified_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return { ok: true as const, items: (data ?? []) as unknown as AbandonedNudgeRow[] };
  } catch (e) {
    console.error("[adminListAbandonedCartNudges]", e);
    return { ok: false as const, error: "server", items: [] as AbandonedNudgeRow[] };
  }
}

export async function adminListStaleCartsAction() {
  const gate = await requirePermission("admin.orders");
  if (!gate.ok) {
    return {
      ok: false as const,
      error: gate.error,
      items: [] as {
        id: string;
        user_id: string | null;
        updated_at: string;
        item_count: number;
        full_name: string | null;
      }[],
    };
  }
  try {
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: carts, error } = await gate.supabase
      .from("carts")
      .select("id, user_id, updated_at, profile:profiles(full_name)")
      .not("user_id", "is", null)
      .lt("updated_at", cutoff)
      .order("updated_at", { ascending: true })
      .limit(80);
    if (error) throw error;

    const items: {
      id: string;
      user_id: string | null;
      updated_at: string;
      item_count: number;
      full_name: string | null;
    }[] = [];

    for (const c of carts ?? []) {
      const { count } = await gate.supabase
        .from("cart_items")
        .select("id", { count: "exact", head: true })
        .eq("cart_id", c.id);
      const n = Number(count ?? 0);
      if (n < 1) continue;
      const prof = (c as any).profile;
      items.push({
        id: c.id as string,
        user_id: (c.user_id as string) ?? null,
        updated_at: c.updated_at as string,
        item_count: n,
        full_name: Array.isArray(prof) ? prof[0]?.full_name ?? null : prof?.full_name ?? null,
      });
    }
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListStaleCarts]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminRunAbandonedCartNudgeAction() {
  const gate = await requirePermission("admin.orders");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const result = await processAbandonedCarts();
    return {
      ok: true as const,
      scanned: result.scanned,
      notified: result.notified,
    };
  } catch (e) {
    console.error("[adminRunAbandonedCartNudge]", e);
    return { ok: false as const, error: "server" };
  }
}
