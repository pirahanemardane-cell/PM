import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";

const WEBP_QUALITY = 82;
const WATERMARK_RATIO = 0.16;
const MARGIN_RATIO = 0.025;

/** منطبق با معیار F5 */
export const PRODUCT_IMAGE_SIZES = {
  thumb: 200,
  small: 400,
  medium: 800,
  large: 1200,
} as const;

export type ProductImageSizeName = keyof typeof PRODUCT_IMAGE_SIZES;

/**
 * Resize, watermark (top-right), WebP برای همه سایزها.
 * خروجی: Record<"thumb"|"small"|"medium"|"large", Buffer>
 */
export async function processProductImageSizes(
  input: Buffer,
): Promise<Record<ProductImageSizeName, Buffer>> {
  const rotated = await sharp(input, { failOn: "none" }).rotate().toBuffer();
  const meta = await sharp(rotated).metadata();
  const srcW = meta.width ?? PRODUCT_IMAGE_SIZES.large;

  let logoBuf: Buffer | null = null;
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "brand",
      "logo-light-transparent.webp",
    );
    logoBuf = await readFile(logoPath);
  } catch (e) {
    console.warn("[processProductImageSizes] watermark logo missing:", e);
  }

  const out = {} as Record<ProductImageSizeName, Buffer>;

  for (const [name, maxW] of Object.entries(PRODUCT_IMAGE_SIZES) as [
    ProductImageSizeName,
    number,
  ][]) {
    const targetW = Math.min(srcW, maxW);
    const resized = await sharp(rotated)
      .resize({ width: targetW, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    const w = resized.info.width;
    const h = resized.info.height;
    const margin = Math.max(8, Math.round(Math.min(w, h) * MARGIN_RATIO));

    let pipeline = sharp(resized.data);

    if (logoBuf) {
      try {
        const logoMaxW = Math.max(32, Math.round(w * WATERMARK_RATIO));
        const logo = await sharp(logoBuf)
          .resize({ width: logoMaxW, withoutEnlargement: true })
          .ensureAlpha()
          .toBuffer({ resolveWithObject: true });
        const left = Math.max(0, w - logo.info.width - margin);
        const top = margin;
        pipeline = sharp(resized.data).composite([
          { input: logo.data, left, top },
        ]);
      } catch (e) {
        console.warn("[processProductImageSizes] watermark skip", name, e);
      }
    }

    out[name] = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  }

  return out;
}

/** سازگاری با کد قبلی — فقط large */
export async function processProductImage(input: Buffer): Promise<Buffer> {
  const sizes = await processProductImageSizes(input);
  return sizes.large;
}
