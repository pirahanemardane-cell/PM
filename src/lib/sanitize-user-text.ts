/**
 * متن ورودی خریدار/کاربر عادی:
 * - بدون HTML
 * - بدون URL (http/https/www/markdown link)
 * - بدون تصویر (markdown ![]() / data:image)
 * ادمین این فیلتر را روی پنل خودش اعمال نمی‌کند.
 */

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"']+|\/\/[^\s<>"']+/gi;

const MD_LINK_RE = /\[([^\]]*)\]\([^)]+\)/g;
const MD_IMAGE_RE = /!\[[^\]]*\]\([^)]+\)/g;
const HTML_TAG_RE = /<\/?[^>]+>/g;
const DATA_IMAGE_RE = /data:image\/[a-z0-9+.-]+;base64,[a-z0-9+/=\s]+/gi;

export type SanitizeResult = {
  text: string;
  blocked: boolean;
  reasons: string[];
};

export function sanitizeUserText(
  input: string | null | undefined,
  opts?: { maxLen?: number; allowEmpty?: boolean },
): SanitizeResult {
  const maxLen = opts?.maxLen ?? 2000;
  const reasons: string[] = [];
  let text = String(input ?? "");

  if (HTML_TAG_RE.test(text)) {
    reasons.push("html");
    text = text.replace(HTML_TAG_RE, "");
  }
  HTML_TAG_RE.lastIndex = 0;

  if (MD_IMAGE_RE.test(text) || DATA_IMAGE_RE.test(text)) {
    reasons.push("image");
    text = text.replace(MD_IMAGE_RE, "").replace(DATA_IMAGE_RE, "");
  }
  MD_IMAGE_RE.lastIndex = 0;
  DATA_IMAGE_RE.lastIndex = 0;

  if (MD_LINK_RE.test(text) || URL_RE.test(text)) {
    reasons.push("link");
    text = text.replace(MD_LINK_RE, "$1").replace(URL_RE, "");
  }
  MD_LINK_RE.lastIndex = 0;
  URL_RE.lastIndex = 0;

  // فاصله‌های اضافه
  text = text.replace(/\s+/g, " ").trim();

  if (text.length > maxLen) {
    text = text.slice(0, maxLen);
    reasons.push("truncated");
  }

  if (!opts?.allowEmpty && !text && reasons.length) {
    // ورودی فقط لینک/تصویر بود
  }

  return {
    text,
    blocked: reasons.includes("link") || reasons.includes("image") || reasons.includes("html"),
    reasons,
  };
}

/** اگر لینک/تصویر/HTML بود → خطا (سخت‌گیرانه) */
export function assertNoLinkOrImage(
  input: string | null | undefined,
  fieldLabel = "متن",
): { ok: true; text: string } | { ok: false; error: string } {
  const r = sanitizeUserText(input);
  if (r.blocked) {
    return {
      ok: false,
      error: `${fieldLabel} نباید شامل لینک، تصویر یا کد HTML باشد`,
    };
  }
  return { ok: true, text: r.text };
}
