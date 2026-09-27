"use server";

import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  processProductImageSizes,
  type ProductImageSizeName,
} from "@/lib/process-product-image";
import { r2PutObject, r2DeleteObject } from "@/lib/r2";

const MAX_BYTES = 12 * 1024 * 1024; // 12MB

const SIZE_ORDER: ProductImageSizeName[] = [
  "thumb",
  "small",
  "medium",
  "large",
];

export async function adminUploadProductImageAction(formData: FormData) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "no_file" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false as const, error: "too_large" };
  }
  const mime = (file.type || "").toLowerCase();
  if (!mime.startsWith("image/")) {
    return { ok: false as const, error: "not_image" };
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const buffers = await processProductImageSizes(input);
    const id = randomUUID();
    const ts = Date.now();
    const urls: Partial<Record<ProductImageSizeName, string>> = {};
    const keys: Partial<Record<ProductImageSizeName, string>> = {};

    for (const size of SIZE_ORDER) {
      const key = `products/${id}/${ts}-${size}.webp`;
      const url = await r2PutObject({
        key,
        body: buffers[size],
        contentType: "image/webp",
      });
      keys[size] = key;
      urls[size] = url;
    }

    // DB: ردیف کتابخانه رسانه (بدون محصول) تا در /admin/media دیده شود
    const { data: row, error: dbErr } = await gate.supabase
      .from("product_images")
      .insert({
        product_id: null,
        url: urls.large!,
        alt_text: file.name?.slice(0, 120) || null,
        sort_order: 0,
        is_primary: false,
      })
      .select("id, url, alt_text, is_primary, sort_order, product_id")
      .maybeSingle();

    if (dbErr) {
      console.error("[adminUploadProductImage] db", dbErr);
      // فایل در R2 هست؛ UI را با url برمی‌گردانیم ولی لیست ممکن است خالی بماند
      return {
        ok: true as const,
        url: urls.large!,
        key: keys.large!,
        urls: urls as Record<ProductImageSizeName, string>,
        keys: keys as Record<ProductImageSizeName, string>,
        warning: "db_insert_failed" as const,
      };
    }

    return {
      ok: true as const,
      url: urls.large!,
      key: keys.large!,
      urls: urls as Record<ProductImageSizeName, string>,
      keys: keys as Record<ProductImageSizeName, string>,
      imageId: row?.id as string | undefined,
    };
  } catch (e) {
    console.error("[adminUploadProductImage]", e);
    return { ok: false as const, error: "upload_failed" };
  }
}

/**
 * حذف تصویر از R2 (همه سایزهای هم‌پایه) و در صورت دادن imageId از DB.
 * key می‌تواند large باشد؛ بقیه از همان پیشوند حذف می‌شوند.
 */
export async function adminDeleteProductImageAction(input: {
  key?: string | null;
  url?: string | null;
  imageId?: string | null;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  try {
    let key = (input.key || "").trim();
    if (!key && input.url) {
      // استخراج key از URL عمومی
      try {
        const u = new URL(input.url);
        key = u.pathname.replace(/^\//, "");
      } catch {
        /* ignore */
      }
    }
    if (!key) {
      return { ok: false as const, error: "no_key" };
    }

    // products/{uuid}/{ts}-large.webp → پایه بدون -size
    const m = key.match(/^(products\/[^/]+\/\d+)-(thumb|small|medium|large)\.webp$/);
    const base = m ? m[1] : key.replace(/-(thumb|small|medium|large)\.webp$/, "");

    for (const size of SIZE_ORDER) {
      const k = `${base}-${size}.webp`;
      try {
        await r2DeleteObject(k);
      } catch (e) {
        console.warn("[adminDeleteProductImage] r2", k, e);
      }
    }

    if (input.imageId) {
      const { error } = await gate.supabase
        .from("product_images")
        .delete()
        .eq("id", input.imageId);
      if (error) console.error("[adminDeleteProductImage] db", error);
    }

    return { ok: true as const };
  } catch (e) {
    console.error("[adminDeleteProductImage]", e);
    return { ok: false as const, error: "delete_failed" };
  }
}

export type MediaListItem = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
  product_id: string | null;
  product_title: string | null;
};

export async function adminListProductImagesAction(limit = 60) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const { data, error } = await gate.supabase
    .from("product_images")
    .select(
      "id, url, alt_text, is_primary, sort_order, product_id, products(name)",
    )
    .order("created_at", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) {
    console.error("[adminListProductImages]", error);
    return { ok: false as const, error: "list_failed" };
  }

  const items: MediaListItem[] = (data ?? []).map((row: any) => ({
    id: row.id,
    url: row.url,
    alt_text: row.alt_text ?? null,
    is_primary: row.is_primary ?? null,
    sort_order: row.sort_order ?? null,
    product_id: row.product_id ?? null,
    product_title:
      row.products && typeof row.products === "object"
        ? (row.products.name as string) ?? null
        : null,
  }));

  return { ok: true as const, items };
}

export async function adminUpdateProductImageMetaAction(input: {
  id: string;
  alt_text?: string | null;
  sort_order?: number;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const id = (input.id || "").trim();
  if (!id) return { ok: false as const, error: "bad_id" as const };
  const body: Record<string, unknown> = {};
  if (input.alt_text !== undefined) {
    const a = (input.alt_text ?? "").trim();
    body.alt_text = a.length ? a.slice(0, 200) : null;
  }
  if (input.sort_order !== undefined && Number.isFinite(input.sort_order)) {
    body.sort_order = Math.trunc(input.sort_order);
  }
  if (!Object.keys(body).length) return { ok: true as const };
  const { error } = await gate.supabase
    .from("product_images")
    .update(body)
    .eq("id", id);
  if (error) {
    console.error("[adminUpdateProductImageMeta]", error);
    return { ok: false as const, error: "update_failed" as const };
  }
  return { ok: true as const };
}
