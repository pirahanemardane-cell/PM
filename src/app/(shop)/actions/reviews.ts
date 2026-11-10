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
        "id, rating, title, body, admin_reply, is_verified, created_at, user:profiles(full_name)",
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const reviews = data ?? [];
    const ids = reviews.map((r) => r.id);
    let imagesByReview = new Map<string, { id: string; url: string; sort_order: number }[]>();
    if (ids.length) {
      const { data: imgs } = await supabase
        .from("review_images")
        .select("id, review_id, url, sort_order")
        .in("review_id", ids)
        .order("sort_order");
      for (const img of imgs ?? []) {
        const list = imagesByReview.get(img.review_id) ?? [];
        list.push({ id: img.id, url: img.url, sort_order: img.sort_order });
        imagesByReview.set(img.review_id, list);
      }
    }
    return {
      ok: true as const,
      items: reviews.map((r) => ({
        ...r,
        images: imagesByReview.get(r.id) ?? [],
      })),
    };
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
  imageUrls?: string[];
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
      .in("orders.status", ["paid", "processing", "shipped", "delivered"])
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
        .in("status", ["paid", "processing", "shipped", "delivered"]);
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

    const { data: inserted, error } = await supabase
      .from("reviews")
      .insert({
        product_id: input.productId,
        user_id: user.id,
        rating,
        title,
        body: bodyOk.text,
        is_approved: false,
        is_verified: true,
      })
      .select("id")
      .single();
    if (error) {
      if (String(error.message || "").includes("duplicate") || error.code === "23505") {
        return { ok: false as const, error: "already_reviewed" };
      }
      throw error;
    }

    const urls = (input.imageUrls || [])
      .map((u) => String(u || "").trim())
      .filter((u) => /^https:\/\//i.test(u))
      .slice(0, 4);
    if (inserted?.id && urls.length) {
      await supabase.from("review_images").insert(
        urls.map((url, i) => ({
          review_id: inserted.id,
          url,
          sort_order: i,
        })),
      );
    }
    return { ok: true as const };
  } catch (e) {
    console.error("[createProductReview]", e);
    return { ok: false as const, error: "server" };
  }
}

/** آپلود تصویر نظر خریدار به R2 — حداکثر ۴ فایل، هر کدام ۳MB */
export async function uploadReviewImageAction(formData: FormData) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "no_file" };
    }
    if (file.size > 3 * 1024 * 1024) return { ok: false as const, error: "too_large" };
    const mime = (file.type || "").toLowerCase();
    if (!mime.startsWith("image/")) return { ok: false as const, error: "not_image" };

    const { randomUUID } = await import("crypto");
    const { r2PutObject } = await import("@/lib/r2");
    const buf = Buffer.from(await file.arrayBuffer());
    const key = `reviews/${user.id}/${Date.now()}-${randomUUID()}.webp`;
    // store original bytes if webp conversion unavailable — use content-type from file
    const url = await r2PutObject({
      key,
      body: buf,
      contentType: mime.startsWith("image/") ? mime : "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
    });
    return { ok: true as const, url };
  } catch (e) {
    console.error("[uploadReviewImage]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function listMyReviewsAction() {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required", items: [] };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, rating, title, body, is_approved, created_at, product:products(name, slug)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const reviews = data ?? [];
    const ids = reviews.map((r) => r.id);
    const imagesByReview = new Map<string, { url: string }[]>();
    if (ids.length) {
      const { data: imgs } = await supabase
        .from("review_images")
        .select("review_id, url")
        .in("review_id", ids);
      for (const img of imgs ?? []) {
        const list = imagesByReview.get(img.review_id) ?? [];
        list.push({ url: img.url });
        imagesByReview.set(img.review_id, list);
      }
    }
    return {
      ok: true as const,
      items: reviews.map((r) => ({
        ...r,
        images: imagesByReview.get(r.id) ?? [],
      })),
    };
  } catch (e) {
    console.error("[listMyReviews]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}
