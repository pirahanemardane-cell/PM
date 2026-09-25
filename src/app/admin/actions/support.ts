"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";

export async function adminListTicketsAction(opts?: {
  status?: "all" | "open" | "in_progress" | "closed";
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    let query = gate.supabase
      .from("support_tickets")
      .select("id, subject, status, priority, user_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const st = opts?.status;
    if (st && st !== "all") query = query.eq("status", st);
    const { data, error } = await query;
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListTickets]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminSetTicketStatusAction(
  id: string,
  status: "open" | "in_progress" | "closed",
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("support_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}

export async function adminReplyTicketAction(ticketId: string, bodyRaw: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const body = assertNoLinkOrImage(bodyRaw, "پاسخ");
  if (!body.ok) return { ok: false as const, error: body.error };
  try {
    const { error } = await gate.supabase.from("support_ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: gate.userId,
      is_staff: true,
      body: body.text,
    });
    if (error) throw error;
    await gate.supabase
      .from("support_tickets")
      .update({ updated_at: new Date().toISOString(), status: "in_progress" })
      .eq("id", ticketId);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}

export async function adminListReturnsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
  try {
    const { data, error } = await gate.supabase
      .from("return_requests")
      .select("id, user_id, order_id, reason, status, admin_note, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[adminListReturns]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function adminSetReturnStatusAction(
  id: string,
  status: "pending" | "approved" | "rejected" | "received" | "refunded",
  adminNote?: string,
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { data: prev } = await gate.supabase
      .from("return_requests")
      .select("id, status, order_id")
      .eq("id", id)
      .maybeSingle();

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNote !== undefined) patch.admin_note = adminNote;
    const { error } = await gate.supabase
      .from("return_requests")
      .update(patch)
      .eq("id", id);
    if (error) throw error;

    // بازگردانی موجودی فقط وقتی برای اولین بار به received/refunded می‌رود
    const stockStatuses = new Set(["received", "refunded"]);
    const prevSt = String(prev?.status ?? "");
    if (
      prev?.order_id &&
      stockStatuses.has(status) &&
      !stockStatuses.has(prevSt)
    ) {
      try {
        const { createServiceClient } = await import("@/lib/supabase/service");
        const service = createServiceClient();
        const { data: items } = await service
          .from("order_items")
          .select("variant_id, quantity")
          .eq("order_id", prev.order_id);
        for (const it of items ?? []) {
          const vid = (it as { variant_id?: string }).variant_id;
          const q = Number((it as { quantity?: number }).quantity) || 0;
          if (!vid || q < 1) continue;
          await service.rpc("increment_variant_stock", {
            p_variant_id: vid,
            p_qty: q,
          });
          try {
            const { notifyStockAlertsForVariant } = await import(
              "@/lib/stock-alerts/notify"
            );
            await notifyStockAlertsForVariant(vid);
          } catch (ne) {
            console.error("[return stock alert]", ne);
          }
        }
      } catch (re) {
        console.error("[adminSetReturnStatus stock restore]", re);
      }
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}
