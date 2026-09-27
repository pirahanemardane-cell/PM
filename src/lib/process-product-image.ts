import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";

const WEBP_QUALITY = 82;
const WATERMARK_RATIO = 0.14; // smaller mark on product photos
const MARGIN_RATIO = 0.03;
const WATERMARK_OPACITY = 0.40;

/** فقط این فایل — طبق درخواست */
const WATERMARK_FILE = "logo-light-transparent.webp";

/** URL عمومی برای fallback وقتی filesystem روی serverless فایل را نبیند */
const WATERMARK_PUBLIC_URL =
  process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/brand/${WATERMARK_FILE}`
    : `https://pirahanmardane.ir/brand/${WATERMARK_FILE}`;

export const PRODUCT_IMAGE_SIZES = {
  thumb: 200,
  small: 400,
  medium: 800,
  large: 1200,
} as const;

export type ProductImageSizeName = keyof typeof PRODUCT_IMAGE_SIZES;

let cachedLogo: Buffer | null | undefined;

async function loadWatermarkLogo(): Promise<Buffer | null> {
  if (cachedLogo !== undefined) return cachedLogo;

  const candidates = [
    path.join(process.cwd(), "public", "brand", WATERMARK_FILE),
    path.join(process.cwd(), "brand", WATERMARK_FILE),
    path.join(process.cwd(), "public", WATERMARK_FILE),
  ];

  for (const logoPath of candidates) {
    try {
      const buf = await readFile(logoPath);
      if (buf.length > 0) {
        console.info("[watermark] loaded from fs", logoPath, buf.length);
        cachedLogo = buf;
        return buf;
      }
    } catch {
      /* next */
    }
  }

  try {
    const res = await fetch(WATERMARK_PUBLIC_URL, { cache: "force-cache" });
    if (res.ok) {
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      if (buf.length > 0) {
        console.info("[watermark] loaded from url", WATERMARK_PUBLIC_URL, buf.length);
        cachedLogo = buf;
        return buf;
      }
    } else {
      console.warn("[watermark] fetch status", res.status, WATERMARK_PUBLIC_URL);
    }
  } catch (e) {
    console.warn("[watermark] fetch failed", WATERMARK_PUBLIC_URL, e);
  }

  console.warn("[watermark] logo missing; cwd=", process.cwd());
  cachedLogo = null;
  return null;
}

async function buildWatermarkOverlay(
  logoBuf: Buffer,
  targetW: number,
): Promise<{ buf: Buffer; width: number; height: number } | null> {
  try {
    const logoMaxW = Math.max(48, Math.round(targetW * WATERMARK_RATIO));
    const resized = await sharp(logoBuf)
      .resize({
        width: logoMaxW,
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const { data: rgba, info } = await sharp(resized.data)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let i = 3; i < rgba.length; i += 4) {
      rgba[i] = Math.round(rgba[i] * WATERMARK_OPACITY);
    }

    const buf = await sharp(rgba, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();

    return { buf, width: info.width, height: info.height };
  } catch (e) {
    console.warn("[watermark] build overlay failed", e);
    return null;
  }
}

export async function processProductImageSizes(
  input: Buffer,
): Promise<Record<ProductImageSizeName, Buffer>> {
  const rotated = await sharp(input, { failOn: "none" }).rotate().toBuffer();
  const meta = await sharp(rotated).metadata();
  const srcW = meta.width ?? PRODUCT_IMAGE_SIZES.large;
  const logoBuf = await loadWatermarkLogo();
  const out = {} as Record<ProductImageSizeName, Buffer>;

  let masterOverlay: { buf: Buffer; width: number; height: number } | null = null;
  if (logoBuf) {
    masterOverlay = await buildWatermarkOverlay(
      logoBuf,
      Math.min(srcW, PRODUCT_IMAGE_SIZES.large),
    );
  }

  for (const [name, maxW] of Object.entries(PRODUCT_IMAGE_SIZES) as [
    ProductImageSizeName,
    number,
  ][]) {
    const targetW = Math.min(srcW, maxW);

    // 1) resize + mild sharpen ONLY on base photo (نه روی واترمارک)
    const resized = await sharp(rotated)
      .resize({ width: targetW, withoutEnlargement: true })
      .sharpen({ sigma: 0.6, m1: 0.8, m2: 0.4 })
      .toBuffer({ resolveWithObject: true });

    const w = resized.info.width;
    const h = resized.info.height;

    // 2) composite watermark AFTER sharpen — edges stay crisp
    let pipeline = sharp(resized.data);
    if (logoBuf) {
      try {
        const overlay =
          name === "large" && masterOverlay
            ? masterOverlay
            : await buildWatermarkOverlay(logoBuf, w);
        if (overlay) {
          const left = Math.max(0, Math.round((w - overlay.width) / 2));
          const top = Math.max(0, Math.round((h - overlay.height) / 2));
          pipeline = sharp(resized.data).composite([
            { input: overlay.buf, left, top },
          ]);
        }
      } catch (e) {
        console.warn("[watermark] composite skip", name, e);
      }
    }

    // 3) webp: کمی کیفیت بالاتر تا آلفا/لبه لوگو نرم نشود
    out[name] = await pipeline
      .webp({ quality: 88, effort: 6, smartSubsample: true })
      .toBuffer();
  }

  return out;
}

export async function processProductImage(input: Buffer): Promise<Buffer> {
  const sizes = await processProductImageSizes(input);
  return sizes.large;
}
