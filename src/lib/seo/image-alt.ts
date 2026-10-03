/**
 * Image SEO: generate meaningful ALT from product/page context.
 * Avoid "image1.jpg" style empty alts.
 */

export function buildImageAlt(input: {
  pageName?: string;
  brandName?: string;
  categoryName?: string;
  keyphrase?: string;
  index?: number;
  total?: number;
}): string {
  const name = (input.pageName || "").trim();
  const brand = (input.brandName || "").trim();
  const cat = (input.categoryName || "").trim();
  const kp = (input.keyphrase || "").trim();
  const parts: string[] = [];

  if (kp && name && !name.includes(kp)) {
    parts.push(kp);
  }
  if (name) parts.push(name);
  else if (kp) parts.push(kp);

  if (brand && !parts.join(" ").includes(brand)) parts.push(brand);
  if (cat && !parts.join(" ").includes(cat)) parts.push(cat);

  let alt = parts.filter(Boolean).join(" — ") || "تصویر محصول";

  if (input.total && input.total > 1 && input.index != null) {
    alt = `${alt} — تصویر ${input.index + 1} از ${input.total}`;
  }

  // keep reasonable length for screen readers / SEO
  if (alt.length > 125) alt = alt.slice(0, 122) + "…";
  return alt;
}

export function ensureAlt(
  existing: string | null | undefined,
  input: Parameters<typeof buildImageAlt>[0],
): string {
  const cur = (existing || "").trim();
  if (cur && cur.length >= 3 && !/^image\d*$/i.test(cur) && !/\.(jpe?g|png|webp|gif)$/i.test(cur)) {
    return cur;
  }
  return buildImageAlt(input);
}
