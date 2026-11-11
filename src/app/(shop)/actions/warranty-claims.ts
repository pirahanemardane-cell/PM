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

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار بررسی",
  reviewing: "در حال بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
  resolved: "حل‌شده",
};

export async function listMyWarrantyClaimsAction() {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required", items: [] };
    const { data, error } = await supabase
      .from("warranty_claims")
      .select(
        "id, claim_type, status, body, admin_note, created_at, order_id, product_id, product:products(name, slug)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const claims = data ?? [];
    const ids = claims.map((c) => c.id);
    const imagesByClaim = new Map<string, { url: string }[]>();
    if (ids.length) {
      const { data: imgs } = await supabase
        .from("warranty_claim_images")
        .select("claim_id, url, sort_order")
        .in("claim_id", ids)
        .order("sort_order");
      for (const img of imgs ?? []) {
        const list = imagesByClaim.get(img.claim_id) ?? [];
        list.push({ url: img.url });
        imagesByClaim.set(img.claim_id, list);
      }
    }
    return {
      ok: true as const,
      items: claims.map((c) => ({
        ...c,
        status_fa: STATUS_FA[c.status] || c.status,
        images: imagesByClaim.get(c.id) ?? [],
      })),
    };
  } catch (e) {
    console.error("[listMyWarrantyClaims]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

/** Orders the buyer can link a claim to */
export async function listMyOrdersForClaimAction() {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required", items: [] };
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, created_at, status, total_amount, order_items(id, title, product_id, variant_id)",
      )
      .eq("user_id", user.id)
      .in("status", ["paid", "processing", "shipped", "delivered"])
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return { ok: true as const, items: data ?? [] };
  } catch (e) {
    console.error("[listMyOrdersForClaim]", e);
    return { ok: false as const, error: "server", items: [] };
  }
}

export async function createWarrantyClaimAction(input: {
  claimType: "warranty" | "exchange" | "stitching";
  body: string;
  orderId?: string;
  productId?: string;
  evidenceUrls?: string[];
}) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };
    const body = assertNoLinkOrImage(input.body, "توضیحات");
    if (!body.ok) return { ok: false as const, error: body.error };
    if (!body.text || body.text.length < 10) return { ok: false as const, error: "body_short" };

    let orderId: string | null = (input.orderId || "").trim() || null;
    let productId: string | null = (input.productId || "").trim() || null;

    if (orderId) {
      const { data: ord } = await supabase
        .from("orders")
        .select("id, order_items(product_id)")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!ord) return { ok: false as const, error: "order_not_yours" };
      if (productId) {
        const items = (ord as any).order_items as { product_id?: string }[] | undefined;
        const ok = (items ?? []).some((it) => it.product_id === productId);
        if (!ok) {
          // soft: still allow product_id null rather than reject if mismatch
          productId = null;
        }
      }
    }

    const { data: inserted, error } = await supabase
      .from("warranty_claims")
      .insert({
        user_id: user.id,
        claim_type: input.claimType,
        body: body.text,
        order_id: orderId,
        product_id: productId,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;

    const urls = (input.evidenceUrls || [])
      .map((u) => String(u || "").trim())
      .filter((u) => u.startsWith("http"))
      .slice(0, 4);
    if (urls.length && inserted?.id) {
      await supabase.from("warranty_claim_images").insert(
        urls.map((url, i) => ({
          claim_id: inserted.id,
          url,
          sort_order: i,
        })),
      );
    }
    return { ok: true as const, id: inserted?.id as string };
  } catch (e) {
    console.error("[createWarrantyClaim]", e);
    return { ok: false as const, error: "server" };
  }
}

/** آپلود مدرک ادعا به R2 — حداکثر ۴ فایل، هر کدام ۳MB */
export async function uploadWarrantyEvidenceAction(formData: FormData) {
  try {
    const { user } = await requireUser();
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
    const key = `warranty/${user.id}/${Date.now()}-${randomUUID()}.jpg`;
    const url = await r2PutObject({
      key,
      body: buf,
      contentType: mime.startsWith("image/") ? mime : "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
    });
    return { ok: true as const, url };
  } catch (e) {
    console.error("[uploadWarrantyEvidence]", e);
    return { ok: false as const, error: "server" };
  }
}
