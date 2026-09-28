"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function updateContactMessageStatus(id: string, status: string) {
  const allowed = new Set(["new", "read", "replied", "archived"]);
  if (!allowed.has(status)) return { error: "bad status" };
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
