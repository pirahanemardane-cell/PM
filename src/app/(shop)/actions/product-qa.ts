"use server";

import { createClient } from "@/lib/supabase/server";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function listProductQuestionsAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_questions")
      .select(
        "id, body, created_at, user:profiles(full_name), answers:product_answers(id, body, is_staff, is_approved, created_at)",
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    const items = (data ?? []).map((q: any) => ({
      ...q,
      answers: (q.answers ?? []).filter((a: any) => a.is_approved),
    }));
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listProductQuestions]", e);
    return { ok: false as const, items: [] };
  }
}

export async function askProductQuestionAction(productId: string, bodyRaw: string) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const body = assertNoLinkOrImage(bodyRaw, "سوال");
    if (!body.ok) return { ok: false as const, error: body.error };
    if (!body.text || body.text.length < 5) return { ok: false as const, error: "body_short" };

    const { error } = await supabase.from("product_questions").insert({
      product_id: productId,
      user_id: user.id,
      body: body.text,
      is_approved: false,
    });
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[askProductQuestion]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function listMyQuestionsAction() {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required", items: [] };
    const { data, error } = await supabase
      .from("product_questions")
      .select(
        "id, body, is_approved, created_at, product:products(name, slug), answers:product_answers(id, body, is_approved, is_staff)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listMyQuestions]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}
