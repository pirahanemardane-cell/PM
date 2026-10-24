/**
 * محاسبات کسب‌وکار خالص — بدون DB/API
 */
export type CartLine = {
  price: number;
  quantity: number;
  productId?: string;
};

export function computeSubtotal(lines: CartLine[]): number {
  let s = 0;
  for (const l of lines) {
    const p = Math.max(0, Math.floor(Number(l.price) || 0));
    const q = Math.max(0, Math.floor(Number(l.quantity) || 0));
    s += p * q;
  }
  return s;
}

export function clampQuantityToStock(qty: number, stock: number): number {
  const q = Math.floor(Number(qty) || 0);
  const st = Math.floor(Number(stock) || 0);
  if (q < 1) return 0;
  if (st <= 0) return 0;
  return Math.min(q, st);
}

export function computeDiscountAmount(
  type: string,
  value: number,
  base: number,
  maxCap = 0,
): number {
  const b = Math.max(0, Math.floor(Number(base) || 0));
  const v = Number(value);
  if (!Number.isFinite(v) || v < 0 || b <= 0) return 0;
  const t = String(type || "").toLowerCase();
  let amount = 0;
  if (t === "percentage" || t === "percent") {
    amount = Math.floor((b * v) / 100);
  } else if (t === "fixed" || t === "amount") {
    amount = Math.floor(v);
  } else {
    return 0;
  }
  if (amount > b) amount = b;
  if (amount < 0) amount = 0;
  const cap = Number(maxCap) || 0;
  if (cap > 0 && amount > cap) amount = Math.floor(cap);
  return amount;
}

export function applyFreeShipping(
  fee: number,
  subtotalAfterDiscount: number,
  opts: { enabled: boolean; minAmount: number },
): number {
  const f = Math.max(0, Math.floor(Number(fee) || 0));
  if (!opts.enabled) return f;
  const min = Math.max(0, Math.floor(Number(opts.minAmount) || 0));
  const sub = Math.max(0, Math.floor(Number(subtotalAfterDiscount) || 0));
  if (min > 0 && sub >= min) return 0;
  return f;
}

export function computeOrderGrandTotal(
  subtotal: number,
  discountAmount: number,
  shippingFee: number,
): number {
  const s = Math.max(0, Math.floor(Number(subtotal) || 0));
  const d = Math.max(0, Math.floor(Number(discountAmount) || 0));
  const ship = Math.max(0, Math.floor(Number(shippingFee) || 0));
  return Math.max(0, s - Math.min(d, s) + ship);
}

export function amountsMatchToman(orderTotal: number, paidAmount: number): boolean {
  return Math.round(Number(orderTotal) || 0) === Math.round(Number(paidAmount) || 0);
}
