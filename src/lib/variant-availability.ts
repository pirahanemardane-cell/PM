/** منطق یکسان موجودی رنگ/سایز برای PDP، کارت، دراور، پنل */

export type VariantLike = {
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number;
  stock?: number;
  stock_quantity?: number;
};

export function colorNorm(c: string | null | undefined): string {
  return (c || "").trim().replace(/^#/, "").toLowerCase();
}

export function sameColor(
  a?: string | null,
  b?: string | null,
): boolean {
  if (!a || !b) return false;
  return colorNorm(a) === colorNorm(b);
}

export function stockOf(v: VariantLike): number {
  return Number(v.stock ?? v.stock_quantity ?? 0);
}

/** آیا این سایز برای رنگ انتخاب‌شده (یا بدون رنگ) موجود است؟ */
export function sizeAvailable(
  size: string,
  variants: VariantLike[],
  selectedColor?: string | null,
): boolean {
  if (!variants.length) return true;
  if (!selectedColor) {
    return variants.some((v) => v.size === size && stockOf(v) > 0);
  }
  return variants.some(
    (v) =>
      v.size === size &&
      (!v.color || sameColor(v.color, selectedColor)) &&
      stockOf(v) > 0,
  );
}

/** آیا این رنگ حداقل یک سایز موجود دارد؟ */
export function colorAvailable(
  color: string,
  variants: VariantLike[],
  selectedSize?: string | null,
): boolean {
  if (!variants.length) return true;
  if (!selectedSize) {
    return variants.some(
      (v) => (!v.color || sameColor(v.color, color)) && stockOf(v) > 0,
    );
  }
  return variants.some(
    (v) =>
      (!v.color || sameColor(v.color, color)) &&
      v.size === selectedSize &&
      stockOf(v) > 0,
  );
}

/** variant دقیق برای ترکیب رنگ+سایز */
export function findVariant(
  variants: VariantLike[],
  selectedColor?: string | null,
  selectedSize?: string | null,
): VariantLike | undefined {
  return variants.find((v) => {
    const sizeOk = !selectedSize || !v.size || v.size === selectedSize;
    const colorOk =
      !selectedColor || !v.color || sameColor(v.color, selectedColor);
    return sizeOk && colorOk;
  });
}

/** کلید ساده برای تطبیق نام فایل تصویر با رنگ */
export function colorKey(c: string): string {
  const n = colorNorm(c);
  if (
    n.includes("سفید") ||
    n === "white" ||
    n === "fff" ||
    n === "ffffff"
  )
    return "white";
  if (
    n.includes("مشکی") ||
    n.includes("سیاه") ||
    n === "black" ||
    n === "000" ||
    n === "000000"
  )
    return "black";
  if (
    n.includes("آبی") ||
    n.includes("ابي") ||
    n === "blue" ||
    n.includes("1e3a8a") ||
    n.includes("2563eb")
  )
    return "blue";
  return n;
}

export function imageIndexForColor(
  color: string,
  imgs: string[],
  colors: string[] = [],
): number {
  if (!color || !imgs.length) return 0;
  const key = colorKey(color);
  const idx = imgs.findIndex((u) => {
    const low = (u || "").toLowerCase();
    return (
      low.includes(key) ||
      (key === "white" && low.includes("white")) ||
      (key === "black" && low.includes("black")) ||
      (key === "blue" && low.includes("blue"))
    );
  });
  if (idx >= 0) return idx;
  const ci = colors.findIndex((x) => colorNorm(x) === colorNorm(color));
  if (ci >= 0 && ci < imgs.length) return ci;
  return 0;
}
