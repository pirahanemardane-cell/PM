import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";

const WEBP_QUALITY = 82;
const WATERMARK_RATIO = 0.22;
const MARGIN_RATIO = 0.03;
const WATERMARK_OPACITY = 0.72;

export const PRODUCT_IMAGE_SIZES = {
  thumb: 200,
  small: 400,
  medium: 800,
  large: 1200,
} as const;

export type ProductImageSizeName = keyof typeof PRODUCT_IMAGE_SIZES;

async function loadWatermarkLogo(): Promise<Buffer | null> {
  const candidates = [
    path.join(process.cwd(), "public", "brand", "logo-light-transparent.webp"),
    path.join(process.cwd(), "public", "brand", "logo-light.webp"),
    path.join(process.cwd(), "brand", "logo-light-transparent.webp"),
  ];
  for (const logoPath of candidates) {
    try {
      const buf = await readFile(logoPath);
      if (buf.length > 0) {
        console.info("[processProductImageSizes] watermark from", logoPath);
        return buf;
      }
    } catch {
      // next
    }
  }
  console.warn("[processProductImageSizes] watermark logo missing");
  return null;
}

export async function processProductImageSizes(
  input: Buffer,
): Promise<Record<ProductImageSizeName, Buffer>> {
  const rotated = await sharp(input, { failOn: "none" }).rotate().toBuffer();
  const meta = await sharp(rotated).metadata();
  const srcW = meta.width ?? PRODUCT_IMAGE_SIZES.large;
  const logoBuf = await loadWatermarkLogo();
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
        const logoMaxW = Math.max(40, Math.round(w * WATERMARK_RATIO));
        const logoResized = await sharp(logoBuf)
          .resize({ width: logoMaxW, withoutEnlargement: true })
          .ensureAlpha()
          .toBuffer({ resolveWithObject: true });

        const { data: rgba, info } = await sharp(logoResized.data)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        for (let i = 3; i < rgba.length; i += 4) {
          rgba[i] = Math.round(rgba[i] * WATERMARK_OPACITY);
        }

        const logoWithOpacity = await sharp(rgba, {
          raw: { width: info.width, height: info.height, channels: 4 },
        })
          .png()
          .toBuffer();

        const left = Math.max(0, w - logoResized.info.width - margin);
        const top = margin;
        pipeline = sharp(resized.data).composite([
          { input: logoWithOpacity, left, top },
        ]);
      } catch (e) {
        console.warn("[processProductImageSizes] watermark skip", name, e);
      }
    }

    out[name] = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  }

  return out;
}

export async function processProductImage(input: Buffer): Promise<Buffer> {
  const sizes = await processProductImageSizes(input);
  return sizes.large;
}
