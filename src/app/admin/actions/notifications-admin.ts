"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const PREDEFINED_NOTIFICATIONS = [
  {
    id: "welcome",
    title: "خوش آمدید",
    body: "به فروشگاه پیراهن مردانه خوش آمدید. از خریدتان سپاسگزاریم.",
    type: "system",
  },
  {
    id: "order_shipped",
    title: "سفارش ارسال شد",
    body: "سفارش شما ارسال شده و به‌زودی به دستتان می‌رسد.",
    type: "order",
  },
  {
    id: "order_delivered",
    title: "سفارش تحویل شد",
    body: "سفارش شما با موفقیت تحویل داده شد. نظرتان برایمان مهم است.",
    type: "order",
  },
  {
    id: "promo",
    title: "پیشنهاد ویژه",
    body: "تخفیف محدود روی محصولات منتخب — همین حالا در فروشگاه ببینید.",
    type: "promo",
  },
  {
    id: "support_reply",
    title: "پاسخ پشتیبانی",
    body: "به تیکت شما پاسخ داده شد. از پنل مشتری بخش پشتیبانی را باز کنید.",
    type: "support",
  },
] as const;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "auth" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "superadmin") {
    return { ok: false as const, error: "forbidden" };
  }
  return { ok: true as const, userId: auth.user.id };
}

export async function adminSendNotificationAction(input: {
  templateId: string;
  mode: "user" | "all";
  /** شماره موبایل یا user id */
  target?: string;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const tpl = PREDEFINED_NOTIFICATIONS.find((x) => x.id === input.templateId);
  if (!tpl) return { ok: false as const, error: "template" };

  const service = createServiceClient();

  if (input.mode === "user") {
    const target = (input.target || "").trim();
    if (!target) return { ok: false as const, error: "target_required" };

    let userId = target;
    // اگر موبایل است از profiles پیدا کن
    if (!target.includes("-") || target.startsWith("09") || target.startsWith("+98")) {
      const phone = target.replace(/\s/g, "");
      const { data: prof } = await service
        .from("profiles")
        .select("id")
        .or(`phone.eq.${phone},phone.eq.${phone.replace(/^0/, "+98")}`)
        .limit(1)
        .maybeSingle();
      if (!prof?.id) {
        // fallback: raw id
        if (target.length < 30) {
          return { ok: false as const, error: "user_not_found" };
        }
      } else {
        userId = prof.id as string;
      }
    }

    const { error } = await service.from("notifications").insert({
      user_id: userId,
      title: tpl.title,
      body: tpl.body,
      type: tpl.type,
      link: "/dashboard?tab=notifications",
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, sent: 1 };
  }

  // همه کاربران دارای پروفایل
  const { data: users, error: listErr } = await service
    .from("profiles")
    .select("id")
    .limit(5000);
  if (listErr) return { ok: false as const, error: listErr.message };
  const rows = (users ?? []).map((u: { id: string }) => ({
    user_id: u.id,
    title: tpl.title,
    body: tpl.body,
    type: tpl.type,
    link: "/dashboard?tab=notifications",
  }));
  if (rows.length === 0) return { ok: true as const, sent: 0 };

  // batch
  const chunk = 200;
  let sent = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const { error } = await service.from("notifications").insert(part);
    if (error) return { ok: false as const, error: error.message, sent };
    sent += part.length;
  }
  return { ok: true as const, sent };
}

export async function adminListRecentNotificationsAction(limit = 40) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ...gate, items: [] as any[] };
  const service = createServiceClient();
  const { data, error } = await service
    .from("notifications")
    .select("id, user_id, title, body, type, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false as const, error: error.message, items: [] };
  return { ok: true as const, items: data ?? [] };
}
