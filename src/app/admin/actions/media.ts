"use server";

import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin/require-admin";
import { processProductImage } from "@/lib/process-product-image";
import { r2PutObject } from "@/lib/r2";

const MAX_BYTES = 12 * 1024 * 1024; // 12MB

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
    const processed = await processProductImage(input);
    const key = `products/${randomUUID()}/${Date.now()}.webp`;
    const url = await r2PutObject({
      key,
      body: processed,
      contentType: "image/webp",
    });
    return { ok: true as const, url, key };
  } catch (e) {
    console.error("[adminUploadProductImage]", e);
    return { ok: false as const, error: "upload_failed" };
  }
}
