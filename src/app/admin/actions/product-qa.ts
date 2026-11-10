"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/require-permission";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";

export type AdminQuestionRow = {
  id: string;
  product_id: string;
  body: string;
  is_approved: boolean;
  created_at: string;
  product?: { name: string; slug: string } | null;
  user?: { full_name: string | null } | null;
  answers?: { id: string; body: string; is_approved: boolean; is_staff: boolean }[];
};

export async function adminListProductQuestionsAction(filter?: "all" | "pending" | "approved") {
  const gate = await requirePermission("admin.reviews");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as AdminQuestionRow[] };
  try {
    let query = gate.supabase
      .from("product_questions")
      .select(
        "id, product_id, body, is_approved, created_at, product:products(name, slug), user:profiles(full_name), answers:product_answers(id, body, is_approved, is_staff)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter === "pending") query = query.eq("is_approved", false);
    if (filter === "approved") query = query.eq("is_approved", true);
    const { data, error } = await query;
    if (error) throw error;
    return { ok: true as const, items: (data ?? []) as unknown as AdminQuestionRow[] };
  } catch (e) {
    console.error("[adminListProductQuestions]", e);
    return { ok: false as const, error: "server", items: [] as AdminQuestionRow[] };
  }
}

export async function adminSetQuestionApprovedAction(id: string, approved: boolean) {
  const gate = await requirePermission("admin.reviews");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    const { error } = await gate.supabase
      .from("product_questions")
      .update({ is_approved: approved, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/product-qa");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}

export async function adminAnswerQuestionAction(questionId: string, bodyRaw: string) {
  const gate = await requirePermission("admin.reviews");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const body = assertNoLinkOrImage(bodyRaw, "پاسخ");
  if (!body.ok) return { ok: false as const, error: body.error };
  if (!body.text || body.text.length < 2) return { ok: false as const, error: "empty" };
  try {
    const { error } = await gate.supabase.from("product_answers").insert({
      question_id: questionId,
      user_id: gate.userId,
      body: body.text,
      is_staff: true,
      is_approved: true,
    });
    if (error) throw error;
    await gate.supabase
      .from("product_questions")
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .eq("id", questionId);
    revalidatePath("/admin/product-qa");
    return { ok: true as const };
  } catch (e) {
    console.error("[adminAnswerQuestion]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminDeleteQuestionAction(id: string) {
  const gate = await requirePermission("admin.reviews");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    await gate.supabase.from("product_answers").delete().eq("question_id", id);
    const { error } = await gate.supabase.from("product_questions").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/product-qa");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "server" };
  }
}
