/**
 * Pixel-width helpers for Google SERP limits (2024–2026 guidance).
 * Google truncates by rendered pixel width, not character count.
 */

const CHAR_WIDTH: Record<string, number> = {
  " ": 4.5,
  i: 4,
  l: 4,
  t: 5,
  f: 5,
  j: 4,
  r: 5.5,
  I: 5,
  ".": 4,
  ",": 4,
  "'": 3,
  '"': 5,
  "-": 5,
  _: 7,
  ":": 4,
  ";": 4,
  "!": 4,
  "?": 6,
  "/": 5,
  "\\": 5,
  "|": 4,
  "(": 5,
  ")": 5,
  "[": 5,
  "]": 5,
  m: 11,
  w: 11,
  M: 12,
  W: 13,
  "@": 12,
};

const DEFAULT_LOWER = 7.2;
const DEFAULT_UPPER = 8.5;
const DEFAULT_DIGIT = 7.5;
const DEFAULT_OTHER = 8;
const PERSIAN_WIDTH = 7.0;

export const PIXEL_LIMITS = {
  titleDesktop: 600,
  titleDesktopSafe: 580,
  titleMobile: 580,
  descDesktop: 920,
  descMobile: 680,
} as const;

export function measurePixelWidth(text: string): number {
  if (!text) return 0;
  let w = 0;
  for (const ch of text) {
    if (CHAR_WIDTH[ch] != null) {
      w += CHAR_WIDTH[ch];
      continue;
    }
    const code = ch.charCodeAt(0);
    if (
      (code >= 0x0600 && code <= 0x06ff) ||
      (code >= 0x0750 && code <= 0x077f) ||
      (code >= 0xfb50 && code <= 0xfdff) ||
      (code >= 0xfe70 && code <= 0xfeff)
    ) {
      w += PERSIAN_WIDTH;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      w += DEFAULT_DIGIT;
      continue;
    }
    if (ch >= "A" && ch <= "Z") {
      w += DEFAULT_UPPER;
      continue;
    }
    if (ch >= "a" && ch <= "z") {
      w += DEFAULT_LOWER;
      continue;
    }
    w += DEFAULT_OTHER;
  }
  return Math.round(w * 10) / 10;
}

export type PixelStatus = "ok" | "warn" | "over";

export function titlePixelStatus(px: number): PixelStatus {
  if (px <= PIXEL_LIMITS.titleDesktopSafe) return "ok";
  if (px <= PIXEL_LIMITS.titleDesktop) return "warn";
  return "over";
}

export function descPixelStatus(px: number, mobile = false): PixelStatus {
  const limit = mobile ? PIXEL_LIMITS.descMobile : PIXEL_LIMITS.descDesktop;
  const safe = mobile ? 650 : 900;
  if (px <= safe) return "ok";
  if (px <= limit) return "warn";
  return "over";
}

export function truncateToPixels(text: string, maxPx: number): string {
  if (measurePixelWidth(text) <= maxPx) return text;
  let out = "";
  for (const ch of text) {
    const next = out + ch;
    if (measurePixelWidth(next + "…") > maxPx) break;
    out = next;
  }
  return out + "…";
}
