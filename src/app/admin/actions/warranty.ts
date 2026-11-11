"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/require-permission";
import { createNotificationForUser } from "@/lib/notifications/create";
import { sendTransactionalEmail } from "@/lib/email/send";
import { createServiceClient } from "@/lib/supabase/service";

export type WarrantyClaimAdmin = {
  id: string;
  user_id: string;
  order_id: string | null;
  product_id: string | null;
  claim_type: string;
  status: string;
  body: string;
  admin_note: string | null;
  created_at: string;
  user?: { full_name: string | null; phone: string | null } | null;
  product?: { name: string; slug: string } | null;
  images?: { url: string }[];
};

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار بررسی",
  reviewing: "در حال بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
  resolved: "حل‌شده",
};

export async function adminListWarrantyClaimsAction() {
  const gate = await requirePermission("admin.returns");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as WarrantyClaimAdmin[] };
  try {
    const { data, error } = await gate.supabase
      .from("warranty_claims")
      .select(
        "id, user_id, order_id, product_id, claim_type, status, body, admin_note, created_at, user:profiles(full_name, phone), product:products(name, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const items = (data ?? []) as unknown as WarrantyClaimAdmin[];
    const ids = items.map((i) => i.id);
    if (ids.length) {
      const { data: imgs } = await gate.supabase
        .from("warranty_claim_images")
        .select("claim_id, url")
        .in("claim_id", ids);
      const by = new Map<string, { url: string }[]>();
      for (const img of imgs ?? []) {
        const list = by.get(img.claim_id) ?? [];
        list.push({ url: img.url });
        by.set(img.claim_id, list);
      }
      for (const it of items) it.images = by.get(it.id) ?? [];
    }
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListWarrantyClaims]", e);
    return { ok: false as const, error: "server", items: [] as WarrantyClaimAdmin[] };
  }
}

export async function adminSetWarrantyClaimStatusAction(
  id: string,
  status: "pending" | "reviewing" | "approved" | "rejected" | "resolved",
  adminNote?: string,
) {
  const gate = await requirePermission("admin.returns");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { data: prev } = await gate.supabase
      .from("warranty_claims")
      .select("id, user_id, status, claim_type")
      .eq("id", id)
      .maybeSingle();
    if (!prev) return { ok: false as const, error: "not_found" };

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNote !== undefined) patch.admin_note = adminNote;
    const { error } = await gate.supabase
      .from("warranty_claims")
      .update(patch)
      .eq("id", id);
    if (error) throw error;

    const prevStatus = String((prev as { status?: string }).status || "");
    const userId = String((prev as { user_id?: string }).user_id || "");
    if (userId && prevStatus !== status) {
      const label = STATUS_FA[status] || status;
      const note = (adminNote || "").trim();
      try {
        await createNotificationForUser({
          userId,
          title: "به‌روزرسانی ادعای گارانتی",
          body: `وضعیت درخواست شما: ${label}${note ? ` — ${note.slice(0, 120)}` : ""}`,
          type: "warranty",
          link: "/داشبورد?tab=claims",
        });
      } catch (ne) {
        console.warn("[warranty notify in-app]", ne);
      }
      try {
        const service = createServiceClient();
        const { data: authUser } = await service.auth.admin.getUserById(userId);
        const email = String(authUser?.user?.email ?? "").trim();
        if (email) {
          await sendTransactionalEmail({
            to: email,
            subject: `ادعای گارانتی: ${label} — پیراهن مردانه`,
            html: `<p>وضعیت درخواست گارانتی/تعویض شما به <strong>${label}</strong> تغییر کرد.</p>${
              note ? `<p>یادداشت: ${note.replace(/</g, "&lt;")}</p>` : ""
            }<p><a href="https://pirahanmardane.ir/داشبورد?tab=claims">مشاهده در داشبورد</a></p>`,
            text: `وضعیت ادعا: ${label}${note ? ` — ${note}` : ""}`,
          });
        }
      } catch (em) {
        console.warn("[warranty notify email]", em);
      }
    }

    revalidatePath("/admin/warranty");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}
