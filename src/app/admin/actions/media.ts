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

    // اگر productId در FormData باشد → مستقیم به گالری محصول؛ وگرنه کتابخانه رسانه
    const productIdRaw = formData.get("productId");
    const productId =
      typeof productIdRaw === "string" && productIdRaw.trim()
        ? productIdRaw.trim()
        : null;

    let sort_order = 0;
    if (productId) {
      const { data: maxRow } = await gate.supabase
        .from("product_images")
        .select("sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sort_order = (maxRow?.sort_order ?? 0) + 1;
    }

    const { data: row, error: dbErr } = await gate.supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url: urls.large!,
        alt_text: file.name?.slice(0, 120) || null,
        sort_order,
        is_primary: false,
        variant_id: null,
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


/** sanitize base filename: latin/digits/dash only */
function sanitizeImageBaseName(raw: string): string | null {
  const s = (raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  if (!s || s.length < 2 || s.length > 80) return null;
  return s.replace(/-(thumb|small|medium|large)$/i, "") || null;
}

function parseProductImageKey(url: string): {
  folder: string;
  base: string;
  sizes: Array<"thumb" | "small" | "medium" | "large">;
} | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length < 3) return null;
    const file = parts[parts.length - 1] || "";
    const m = file.match(/^(.+)-(thumb|small|medium|large)\.webp$/i);
    if (!m) return null;
    return {
      folder: parts.slice(0, -1).join("/"),
      base: m[1],
      sizes: ["thumb", "small", "medium", "large"],
    };
  } catch {
    return null;
  }
}

/** @deprecated URL فایل باید پایدار بماند — از alt_text استفاده کنید؛ rename فیزیکی توصیه نمی‌شود. */
export async function adminRenameProductImageAction(input: {
  id: string;
  newBaseName: string;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const id = (input.id || "").trim();
  const newBase = sanitizeImageBaseName(input.newBaseName || "");
  if (!id) return { ok: false as const, error: "bad_id" as const };
  if (!newBase) return { ok: false as const, error: "bad_name" as const };

  const { data: row, error: qErr } = await gate.supabase
    .from("product_images")
    .select("id, url")
    .eq("id", id)
    .maybeSingle();
  if (qErr || !row?.url) {
    console.error("[adminRenameProductImage] select", qErr);
    return { ok: false as const, error: "not_found" as const };
  }

  const parsed = parseProductImageKey(String(row.url));
  if (!parsed) return { ok: false as const, error: "bad_url" as const };
  if (parsed.base === newBase) {
    return { ok: true as const, url: String(row.url), unchanged: true as const };
  }

  const { r2PutObject, r2DeleteObject, getPublicUrl } = await import("@/lib/r2");

  const oldKeys: string[] = [];
  let newLargeUrl = "";

  for (const size of parsed.sizes) {
    const oldKey = `${parsed.folder}/${parsed.base}-${size}.webp`;
    const newKey = `${parsed.folder}/${newBase}-${size}.webp`;
    oldKeys.push(oldKey);

    let buf: Buffer | null = null;
    try {
      const res = await fetch(getPublicUrl(oldKey));
      if (res.ok) buf = Buffer.from(await res.arrayBuffer());
    } catch (e) {
      console.warn("[rename] fetch old", oldKey, e);
    }

    if (!buf || buf.length === 0) {
      if (size === "large") {
        return { ok: false as const, error: "source_missing" as const };
      }
      continue;
    }

    try {
      await r2PutObject({
        key: newKey,
        body: buf,
        contentType: "image/webp",
      });
    } catch (e) {
      console.error("[rename] put", newKey, e);
      return { ok: false as const, error: "upload_failed" as const };
    }

    if (size === "large") newLargeUrl = getPublicUrl(newKey);
  }

  if (!newLargeUrl) {
    return { ok: false as const, error: "upload_failed" as const };
  }

  const { error: uErr } = await gate.supabase
    .from("product_images")
    .update({ url: newLargeUrl })
    .eq("id", id);
  if (uErr) {
    console.error("[adminRenameProductImage] db", uErr);
    return { ok: false as const, error: "db_failed" as const };
  }

  for (const k of oldKeys) {
    try {
      await r2DeleteObject(k);
    } catch (e) {
      console.warn("[rename] delete old", k, e);
    }
  }

  return { ok: true as const, url: newLargeUrl };
}
