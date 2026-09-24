"use client";

import { sizeAvailable as sizeAvailableShared, sameColor, stockOf, findVariant, colorAvailable } from "@/lib/variant-availability";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toaster";
import { useShopStore } from "@/lib/shop-store";
import { addToCartAction } from "@/app/(shop)/actions/shop";
import { useServerCartStore } from "@/lib/server-cart-store";
import { cn } from "@/lib/utils";
import { useRtEvent } from "@/hooks/use-rt-event";
import { RT } from "@/lib/realtime/events";
import { createClient } from "@/lib/supabase/client";
import { resolveColorHex } from "@/lib/colors";

export type VariantOpt = {
  id: string;
  size?: string | null;
  color?: string | null;
  price?: number;
  stock?: number;
};

type Props = {
  productId: string;
  title: string;
  image?: string;
  href?: string;
  variants: VariantOpt[];
  /** وقتی رنگ عوض می‌شود (برای همگام‌سازی گالری) */
  onColorChange?: (color: string) => void;
};

export function ProductBuyBox({
  productId,
  title,
  image,
  href,
  variants: variantsProp,
  onColorChange,
}: Props) {
  const addToCartStore = useShopStore((s) => s.addToCart);
  const refreshServerCart = useServerCartStore((s) => s.refresh);

  // موجودی زنده — بدون reload صفحه
  const [variants, setVariants] = useState<VariantOpt[]>(variantsProp);

  useEffect(() => {
    setVariants(variantsProp);
  }, [variantsProp]);

  useRtEvent(RT.stock, () => {
    const ids = variantsProp.map((v) => v.id).filter(Boolean);
    if (!ids.length) return;
    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("product_variants")
          .select("id, stock_quantity")
          .in("id", ids);
        if (error || !data) return;
        const map = new Map(
          data.map((r) => [r.id as string, Number(r.stock_quantity ?? 0)]),
        );
        setVariants((prev) =>
          prev.map((v) =>
            map.has(v.id) ? { ...v, stock: map.get(v.id) } : v,
          ),
        );
      } catch {
        /* silent — UI قبلی می‌ماند */
      }
    })();
  });

  const sizes = useMemo(
    () =>
      [
        ...new Set(
          variants.map((v) => v.size).filter((s): s is string => Boolean(s)),
        ),
      ],
    [variants],
  );
  const colors = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of variants) {
      const hex = resolveColorHex(v.color, null);
      if (!hex || seen.has(hex.toLowerCase())) continue;
      seen.add(hex.toLowerCase());
      out.push(hex);
    }
    return out;
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0]! : null,
  );
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? "");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (selectedColor) onColorChange?.(selectedColor);
  }, [selectedColor, onColorChange]);
  const [loading, setLoading] = useState(false);

  const match = useMemo(() => {
    return (
      variants.find((v) => {
        const sizeOk = !sizes.length || v.size === selectedSize;
        const colorOk =
          !colors.length ||
          !selectedColor ||
          v.color === selectedColor ||
          (v.color &&
            selectedColor &&
            v.color.replace(/^#/, "").toLowerCase() ===
              selectedColor.replace(/^#/, "").toLowerCase());
        return sizeOk && colorOk;
      }) ?? variants[0]
    );
  }, [variants, selectedSize, selectedColor, sizes.length, colors.length]);

  const price = match?.price;
  const stock = Number(match?.stock ?? 0);
  const outOfStock = stock <= 0;

  function sameColor(a?: string | null, b?: string | null) {
    if (!a || !b) return false;
    return a.trim().replace(/^#/, "").toLowerCase() === b.trim().replace(/^#/, "").toLowerCase();
  }

  function sizeAvailable(size: string) {
    if (!selectedColor) {
      return variants.some((v) => v.size === size && Number(v.stock ?? 0) > 0);
    }
    return variants.some(
      (v) =>
        v.size === size &&
        sameColor(v.color, selectedColor) &&
        Number(v.stock ?? 0) > 0,
    );
  }



  async function handleAdd() {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("سایز را انتخاب کنید");
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
        image,
        href,
        price: price ?? undefined,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        colors: colors.length ? colors : undefined,
        sizes: sizes.length ? sizes : undefined,
        quantity: qty,
        variantId: match.id,
      });

  useEffect(() => {
    if (!selectedSize) return;
    if (!sizeAvailable(selectedSize)) {
      const ok = sizes.filter((s) => sizeAvailable(s));
      setSelectedSize(ok.length === 1 ? ok[0]! : null);
    }
  }, [selectedColor]); // eslint-disable-line react-hooks/exhaustive-deps


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
          void refreshServerCart();
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
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setSelectedColor(c); onColorChange?.(c); }}
                className={cn(
                  "border-border h-8 min-w-8 rounded-full border border-border px-2 text-xs shadow-sm",
                  selectedColor === c && "border-primary ring-primary ring-2 ring-offset-2",
                )}
                style={
                  c.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(c)
                    ? {
                        backgroundColor: resolveColorHex(c),
                      }
                    : undefined
                }
                title={c}
              >
                {c.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(c) ? "" : c}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">سایز</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const ok = sizeAvailable(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  onClick={() => ok && setSelectedSize(s)}
                  title={ok ? s : selectedColor ? `سایز ${s} برای رنگ ${selectedColor} موجود نیست` : "ناموجود"}
                  className={cn(
                    "border-border rounded-xl border px-3 py-1.5 text-sm",
                    selectedSize === s && ok && "bg-primary text-primary-foreground border-primary",
                    !ok && "cursor-not-allowed opacity-35 line-through decoration-muted-foreground/50",
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border-border h-9 w-9 rounded-lg border"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-sm">{qty}</span>
          <button
            type="button"
            className="border-border h-9 w-9 rounded-lg border"
            onClick={() =>
              setQty((q) => Math.min(outOfStock ? 1 : Math.max(stock, 1), q + 1))
            }
          >
            +
          </button>
        </div>
        {price != null ? (
          <p className="text-sm font-semibold">
            {Number(price).toLocaleString("fa-IR")} تومان
          </p>
        ) : null}
        <p
          className={cn(
            "text-xs",
            outOfStock ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {outOfStock ? "ناموجود" : `موجودی: ${stock.toLocaleString("fa-IR")}`}
        </p>
      </div>

      <button
        type="button"
        disabled={loading || outOfStock}
        onClick={() => void handleAdd()}
        className={cn(
          "bg-primary text-primary-foreground w-full rounded-xl py-3 text-sm font-medium hover:bg-primary/90",
          (loading || outOfStock) && "opacity-60",
        )}
      >
        {outOfStock ? "ناموجود" : loading ? "…" : "افزودن به سبد"}
      </button>
    </div>
  );
}
