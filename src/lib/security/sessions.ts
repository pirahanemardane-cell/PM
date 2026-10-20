import { createServiceClient } from "@/lib/supabase/service";

export async function recordUserSession(input: {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  try {
    const admin = createServiceClient();
    const ua = (input.userAgent || "").slice(0, 300);
    const label =
      /Mobile|Android|iPhone/i.test(ua) ? "موبایل" :
      /Mac/i.test(ua) ? "مک" :
      /Windows/i.test(ua) ? "ویندوز" : "دستگاه";
    await admin.from("user_sessions").insert({
      user_id: input.userId,
      session_label: label,
      user_agent: ua || null,
      ip_address: input.ipAddress || null,
    });
  } catch (e) {
    console.warn("[recordUserSession]", e);
  }
}
