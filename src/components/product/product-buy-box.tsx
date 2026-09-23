"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/numbers";
import { addToCartAction } from "@/app/(shop)/actions/cart";
import { useCartStore } from "@/stores/cart-store";

export type BuyVariant = {
  id: string;
  size?: string | null;
  color?: string | null;
  price: number;
  stock: number;
};

function colorNorm(c: string | null | undefined) {
  return (c || "").trim().replace(/^#/, "").toLowerCase();
}

function sameColor(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  return colorNorm(a) === colorNorm(b);
}

function fmtPrice(n: number) {
  return toPersianDigits(Math.round(n).toLocaleString("en-US")) + " تومان";
}

type Props = {
  productId: string;
  title: string;
  image?: string | null;
  href: string;
  variants: BuyVariant[];
  onColorChange?: (color: string) => void;
};

export function ProductBuyBox({
  productId,
  title,
  image,
  href,
  variants,
  onColorChange,
}: Props) {
  const addToCartStore = useCartStore((s) => s.addItem);
  const refreshServerCart = useCartStore((s) => s.refreshFromServer);

  const colors = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) {
      if (v.color && String(v.color).trim()) set.add(String(v.color).trim());
    }
    return Array.from(set);
  }, [variants]);

  // همه سایزهای محصول (برای نمایش؛ موجودی جدا حساب می‌شود)
  const allSizes = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) {
      if (v.size && String(v.size).trim()) set.add(String(v.size).trim());
    }
    const rank = (s: string) =>
      ({ XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 }[s.toUpperCase()] ?? 50);
    return Array.from(set).sort((a, b) => rank(a) - rank(b));
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  /** موجودی ترکیب رنگ+سایز از روی variants (ریشه داده) */
  function stockFor(color: string, size: string) {
    return variants
      .filter((v) => sameColor(v.color, color) && String(v.size) === size)
      .reduce((sum, v) => sum + Number(v.stock ?? 0), 0);
  }

  function sizeAvailable(size: string) {
    if (!selectedColor) {
      return variants.some(
        (v) => String(v.size) === size && Number(v.stock) > 0,
      );
    }
    return stockFor(selectedColor, size) > 0;
  }

  // انتخاب رنگ: فوری به گالری خبر بده (بدون انتظار useEffect)
  function pickColor(c: string) {
    setSelectedColor(c);
    onColorChange?.(c);
  }

  // اگر سایز انتخاب‌شده برای رنگ جدید ناموجود شد، پاک کن
  useEffect(() => {
    if (!selectedSize) {
      const only = allSizes.filter((s) => sizeAvailable(s));
      if (only.length === 1) setSelectedSize(only[0]!);
      return;
    }
    if (!sizeAvailable(selectedSize)) {
      const only = allSizes.filter((s) => sizeAvailable(s));
      setSelectedSize(only.length === 1 ? only[0]! : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor]);

  // mount اولیه: یک‌بار رنگ را به گالری بده
  useEffect(() => {
    if (selectedColor) onColorChange?.(selectedColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const match = useMemo(() => {
    return (
      variants.find((v) => {
        const sizeOk =
          !allSizes.length || !selectedSize || String(v.size) === selectedSize;
        const colorOk =
          !colors.length ||
          !selectedColor ||
          sameColor(v.color, selectedColor);
        return sizeOk && colorOk && Number(v.stock) > 0;
      }) ??
      variants.find((v) => {
        const colorOk =
          !colors.length ||
          !selectedColor ||
          sameColor(v.color, selectedColor);
        return colorOk;
      }) ??
      variants[0]
    );
  }, [variants, selectedSize, selectedColor, allSizes.length, colors.length]);

  const price = match?.price;
  const stock = Number(match?.stock ?? 0);
  const outOfStock = stock <= 0;

  async function handleAdd() {
    if (allSizes.length > 0 && !selectedSize) {
      toast.error("سایز را انتخاب کنید");
      return;
    }
    if (selectedSize && selectedColor && !sizeAvailable(selectedSize)) {
      toast.error("این سایز برای رنگ انتخاب‌شده موجود نیست");
      return;
    }
    if (!match?.id) {
      toast.error("این ترکیب موجود نیست");
      return;
    }
    if (outOfStock) {
      toast.error("این ترکیب ناموجود است");
      return;
    }
    setLoading(true);
    try {
      addToCartStore({
        id: productId,
        title,
        image: image ?? undefined,
        href,
        price: price ?? undefined,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        colors: colors.length ? colors : undefined,
        sizes: allSizes.length ? allSizes : undefined,
        quantity: qty,
        variantId: match.id,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("pm:open-panel", { detail: { tab: "cart" } }),
        );
      }
      const res = await addToCartAction(match.id, qty);
      if (!res.ok && res.error !== "login_required") {
        toast.error(res.error ? `سبد: ${res.error}` : "خطا در افزودن به سبد");
      } else {
        if (res.ok) {
          void refreshServerCart?.();
          window.dispatchEvent(new CustomEvent("pm:cart-changed"));
        }
        toast.success("به سبد خرید اضافه شد");
      }
    } catch {
      toast.error("خطا در افزودن به سبد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      {colors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">رنگ</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const isHex =
                c.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickColor(c)}
                  className={cn(
                    "border-border h-8 min-w-8 rounded-full border px-2.5 text-xs transition-none",
                    selectedColor === c &&
                      "ring-secondary ring-2 ring-offset-2",
                  )}
                  style={
                    isHex
                      ? {
                          backgroundColor: c.startsWith("#") ? c : `#${c}`,
                        }
                      : undefined
                  }
                  title={c}
                >
                  {isHex ? "" : c}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {allSizes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">سایز</p>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((s) => {
              const ok = sizeAvailable(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  onClick={() => ok && setSelectedSize(s)}
                  title={
                    ok
                      ? s
                      : selectedColor
                        ? `سایز ${s} برای رنگ ${selectedColor} موجود نیست`
                        : "ناموجود"
                  }
                  className={cn(
                    "border-border rounded-xl border px-3 py-1.5 text-sm transition-none",
                    selectedSize === s &&
                      ok &&
                      "bg-secondary text-secondary-foreground border-secondary",
                    !ok &&
                      "cursor-not-allowed opacity-35 line-through decoration-muted-foreground/50",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-lg font-bold">
          {price != null ? fmtPrice(price) : "—"}
        </p>
        <p className="text-muted-foreground text-sm">
          موجودی: {toPersianDigits(String(stock))}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="border-border rounded-lg border px-2 py-1 text-sm"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <span className="min-w-8 text-center text-sm">
          {toPersianDigits(String(qty))}
        </span>
        <button
          type="button"
          className="border-border rounded-lg border px-2 py-1 text-sm"
          onClick={() => setQty((q) => q + 1)}
        >
          +
        </button>
      </div>

      <button
        type="button"
        disabled={loading || outOfStock}
        onClick={handleAdd}
        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
      >
        {outOfStock ? "ناموجود" : loading ? "..." : "افزودن به سبد"}
      </button>
    </div>
  );
}
