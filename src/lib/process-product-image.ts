import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";

const MAX_WIDTH = 1200;
const WATERMARK_RATIO = 0.16; // ~16% عرض تصویر
const MARGIN_RATIO = 0.025;
const WEBP_QUALITY = 82;

/**
 * Resize (max width 1200), convert to WebP, watermark top-right.
 * Logo: public/brand/logo-light-transparent.webp
 */
export async function processProductImage(input: Buffer): Promise<Buffer> {
  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const srcW = meta.width ?? MAX_WIDTH;
  const targetW = Math.min(srcW, MAX_WIDTH);

  const resized = await base
    .resize({ width: targetW, withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  const w = resized.info.width;
  const h = resized.info.height;
  const margin = Math.max(8, Math.round(Math.min(w, h) * MARGIN_RATIO));

  const logoPath = path.join(
    process.cwd(),
    "public",
    "brand",
    "logo-light-transparent.webp",
  );

  let withMark = sharp(resized.data);

  try {
    const logoRaw = await readFile(logoPath);
    const logoMaxW = Math.max(48, Math.round(w * WATERMARK_RATIO));
    const logo = await sharp(logoRaw)
      .resize({ width: logoMaxW, withoutEnlargement: true })
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const left = Math.max(0, w - logo.info.width - margin);
    const top = margin;

    withMark = sharp(resized.data).composite([
      {
        input: logo.data,
        left,
        top,
      },
    ]);
  } catch (e) {
    console.warn("[processProductImage] watermark skipped:", e);
  }

  return withMark.webp({ quality: WEBP_QUALITY }).toBuffer();
}
