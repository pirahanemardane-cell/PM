"use server";

import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  processProductImageSizes,
  type ProductImageSizeName,
} from "@/lib/process-product-image";
import { r2PutObject, r2DeleteObject, getPublicUrl } from "@/lib/r2";

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

    // DB و UI فقط large را نگه می‌دارند؛ بقیه از قرارداد نام قابل ساخت‌اند
    return {
      ok: true as const,
      url: urls.large!,
      key: keys.large!,
      urls: urls as Record<ProductImageSizeName, string>,
      keys: keys as Record<ProductImageSizeName, string>,
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

/** ساخت URL سایز دیگر از روی URL/keyی large */
export function productImageUrlForSize(
  largeUrlOrKey: string,
  size: ProductImageSizeName,
): string {
  const replaced = largeUrlOrKey.replace(
    /-(thumb|small|medium|large)\.webp(\?.*)?$/,
    `-${size}.webp`,
  );
  if (replaced.startsWith("http")) return replaced;
  try {
    return getPublicUrl(replaced);
  } catch {
    return replaced;
  }
}
