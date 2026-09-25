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

export async function listProductReviewsAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, rating, title, body, created_at, user:profiles(full_name)",
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listProductReviews]", e);
    return { ok: false as const, items: [] };
  }
}

export async function createProductReviewAction(input: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
}) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const rating = Number(input.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { ok: false as const, error: "rating_invalid" };
    }

    const bodyOk = assertNoLinkOrImage(input.body, "متن نظر");
    if (!bodyOk.ok) return { ok: false as const, error: bodyOk.error };
    if (!bodyOk.text || bodyOk.text.length < 3) {
      return { ok: false as const, error: "body_short" };
    }

    let title: string | null = null;
    if (input.title?.trim()) {
      const tOk = assertNoLinkOrImage(input.title, "عنوان نظر");
      if (!tOk.ok) return { ok: false as const, error: tOk.error };
      title = tOk.text || null;
    }

    const supabase = await createClient();

    // فقط خریدار واقعی همان محصول
    const { data: purchased, error: pErr } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", input.productId)
      .eq("orders.user_id", user.id)
      .in("orders.status", ["paid", "processing", "shipped", "delivered", "pending"])
      .limit(1)
      .maybeSingle();
    if (pErr) {
      console.error("[createProductReview purchase check]", pErr);
      // fallback بدون join اگر relation نام دیگری دارد
    }
    if (pErr || !purchased) {
      // مسیر جایگزین: از orders + order_items جدا
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["paid", "processing", "shipped", "delivered", "pending"]);
      const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
      if (!orderIds.length) {
        return { ok: false as const, error: "not_purchased" };
      }
      const { data: items } = await supabase
        .from("order_items")
        .select("id")
        .eq("product_id", input.productId)
        .in("order_id", orderIds)
        .limit(1);
      if (!items?.length) {
        return { ok: false as const, error: "not_purchased" };
      }
    }

    const { error } = await supabase.from("reviews").insert({
      product_id: input.productId,
      user_id: user.id,
      rating,
      title,
      body: bodyOk.text,
      is_approved: false,
    });
    if (error) {
      if (String(error.message || "").includes("duplicate") || error.code === "23505") {
        return { ok: false as const, error: "already_reviewed" };
      }
      throw error;
    }
    return { ok: true as const };
  } catch (e) {
    console.error("[createProductReview]", e);
    return { ok: false as const, error: "server" };
  }
}
