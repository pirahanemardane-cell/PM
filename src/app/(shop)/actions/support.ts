"use server";

import { createClient } from "@/lib/supabase/server";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function listMyTicketsAction() {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, items: [], error: "login_required" };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, status, priority, order_id, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listMyTickets]", e);
    return { ok: false as const, items: [], error: "server" };
  }
}

export async function createTicketAction(input: {
  subject: string;
  body: string;
  orderId?: string | null;
  priority?: "low" | "normal" | "high";
}) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const sub = assertNoLinkOrImage(input.subject, "موضوع");
    if (!sub.ok) return { ok: false as const, error: sub.error };
    if (!sub.text || sub.text.length < 3)
      return { ok: false as const, error: "subject_short" };

    const body = assertNoLinkOrImage(input.body, "متن پیام");
    if (!body.ok) return { ok: false as const, error: body.error };
    if (!body.text || body.text.length < 5)
      return { ok: false as const, error: "body_short" };

    const supabase = await createClient();
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: sub.text,
        priority: input.priority ?? "normal",
        order_id: input.orderId || null,
        status: "open",
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: mErr } = await supabase.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      is_staff: false,
      body: body.text,
    });
    if (mErr) throw mErr;

    return { ok: true as const, id: ticket.id as string };
  } catch (e) {
    console.error("[createTicket]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function listTicketMessagesAction(ticketId: string) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, items: [], error: "login_required" };
    const supabase = await createClient();
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("id", ticketId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!ticket) return { ok: false as const, items: [], error: "not_found" };

    const { data, error } = await supabase
      .from("support_ticket_messages")
      .select("id, body, is_staff, created_at, sender_id")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listTicketMessages]", e);
    return { ok: false as const, items: [], error: "server" };
  }
}

export async function replyTicketAction(ticketId: string, bodyRaw: string) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const body = assertNoLinkOrImage(bodyRaw, "پیام");
    if (!body.ok) return { ok: false as const, error: body.error };
    if (!body.text) return { ok: false as const, error: "body_short" };

    const supabase = await createClient();
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("id, status")
      .eq("id", ticketId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!ticket) return { ok: false as const, error: "not_found" };
    if ((ticket as { status: string }).status === "closed")
      return { ok: false as const, error: "closed" };

    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: user.id,
      is_staff: false,
      body: body.text,
    });
    if (error) throw error;
    await supabase
      .from("support_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticketId);
    return { ok: true as const };
  } catch (e) {
    console.error("[replyTicket]", e);
    return { ok: false as const, error: "server" };
  }
}
