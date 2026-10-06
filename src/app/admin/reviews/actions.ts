"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function updateReviewApproval(id: string, isApproved: boolean) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: isApproved })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function updateReviewReply(id: string, adminReply: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("reviews")
    .update({ admin_reply: adminReply.trim() || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/reviews");
  return { ok: true };
}
