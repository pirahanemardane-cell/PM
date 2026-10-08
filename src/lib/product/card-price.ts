export type CardPriceVariant = {
  price?: number | null;
  original_price?: number | null;
  compare_at_price?: number | null;
  is_active?: boolean | null;
  stock_quantity?: number | null;
};

export type CardPriceInput = {
  price?: number | null;
  sale_price?: number | null;
  compare_at_price?: number | null;
  variants?: CardPriceVariant[] | null;
};

export type CardPriceResult = {
  amount: number | null;
  compareAt: number | null;
  showFrom: boolean;
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function usableVariants(variants: CardPriceVariant[] | null | undefined) {
  return (variants ?? []).filter((v) => {
    if (v.is_active === false) return false;
    if (v.stock_quantity != null && Number(v.stock_quantity) <= 0) return false;
    return num(v.price) != null;
  });
}

/** min قیمت واریانت‌های فعال · compare همان واریانت · «از» اگر بازه */
export function getCardPrice(input: CardPriceInput): CardPriceResult {
  const list = usableVariants(input.variants);
  if (list.length > 0) {
    const priced = list
      .map((v) => ({
        amount: num(v.price)!,
        compare: num(v.original_price) ?? num(v.compare_at_price),
      }))
      .sort((a, b) => a.amount - b.amount);
    const min = priced[0]!;
    const max = priced[priced.length - 1]!;
    let compareAt = min.compare;
    if (compareAt == null || compareAt <= min.amount) compareAt = null;
    return {
      amount: min.amount,
      compareAt,
      showFrom: max.amount > min.amount,
    };
  }
  const amount = num(input.sale_price) ?? num(input.price);
  if (amount == null) return { amount: null, compareAt: null, showFrom: false };
  let compareAt = num(input.compare_at_price);
  if (compareAt == null || compareAt <= amount) compareAt = null;
  return { amount, compareAt, showFrom: false };
}

export function formatToman(n: number): string {
  return n.toLocaleString("fa-IR");
}
