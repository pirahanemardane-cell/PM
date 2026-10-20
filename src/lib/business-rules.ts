/**
 * فاز ۰ — قوانین محصول (منبع واحد)
 * تغییر قوانین فقط اینجا؛ actions از این فایل می‌خوانند.
 */

/** مهلت مرجوعی (روز) */
export const RETURN_WINDOW_DAYS = 7;

/** وضعیت سفارش برای ثبت مرجوعی */
export const RETURN_ALLOWED_ORDER_STATUSES = ["shipped", "delivered"] as const;

/** وضعیت‌های مرجوعی */
export const RETURN_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "received",
  "refunded",
] as const;

/** لغو توسط مشتری فقط در این وضعیت‌ها */
export const CUSTOMER_CANCEL_ALLOWED_STATUSES = [
  "pending",
  "paid",
  "processing",
] as const;

/** بعد از این‌ها مشتری حق لغو ندارد */
export const CUSTOMER_CANCEL_BLOCKED_STATUSES = [
  "shipped",
  "delivered",
  "cancelled",
] as const;

/** نقش‌های سیستم */
export const ROLES = ["guest", "customer", "admin"] as const;

export function isReturnAllowedStatus(status: string): boolean {
  return (RETURN_ALLOWED_ORDER_STATUSES as readonly string[]).includes(status);
}

export function isCustomerCancellable(status: string): boolean {
  return (CUSTOMER_CANCEL_ALLOWED_STATUSES as readonly string[]).includes(status);
}

export function isWithinReturnWindow(
  shippedAt: string | null | undefined,
  createdAt: string | null | undefined,
  now = Date.now(),
): boolean {
  const base = shippedAt || createdAt;
  if (!base) return false;
  const t = new Date(base).getTime();
  if (Number.isNaN(t)) return false;
  const days = (now - t) / (1000 * 60 * 60 * 24);
  return days <= RETURN_WINDOW_DAYS;
}
