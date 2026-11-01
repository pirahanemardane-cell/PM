/**
 * ارسال پیامک تراکنشی — fail-soft اگر bodyId نباشد
 */
import { meliSendByBodyId, type MeliResult } from "./melipayamak";
import { resolveBodyId, SMS_PATTERNS, type SmsPatternKey } from "./patterns";

function adminPhones(): string[] {
  const raw = process.env.ADMIN_SMS_PHONES?.trim() || "";
  return raw.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean);
}

export function joinVars(vars: Array<string | number | null | undefined>): string {
  return vars.map((v) => String(v ?? "").replace(/;/g, "،")).join(";");
}

export async function sendPatternSms(
  key: SmsPatternKey,
  to: string,
  vars: Array<string | number | null | undefined>,
): Promise<MeliResult & { skipped?: boolean }> {
  const bodyId = resolveBodyId(key);
  if (!bodyId) {
    console.warn("[sms] skip " + key + ": missing " + SMS_PATTERNS[key].envKey);
    return { ok: false, error: "missing_body_id", skipped: true };
  }
  if (!to?.trim()) return { ok: false, error: "empty_phone" };
  try {
    return await meliSendByBodyId({ to: to.trim(), bodyId, text: joinVars(vars) });
  } catch (e) {
    console.error("[sms] " + key, e);
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}

export async function sendAdminPatternSms(
  key: SmsPatternKey,
  vars: Array<string | number | null | undefined>,
): Promise<void> {
  const phones = adminPhones();
  if (!phones.length) {
    console.warn("[sms] ADMIN_SMS_PHONES empty — admin SMS skipped");
    return;
  }
  await Promise.allSettled(phones.map((p) => sendPatternSms(key, p, vars)));
}

export async function notifyOrderPlaced(opts: {
  customerPhone?: string | null;
  customerName?: string | null;
  orderId: string | number;
  amount: string | number;
}) {
  const name = opts.customerName || "مشتری";
  if (opts.customerPhone) {
    await sendPatternSms("ORDER_PLACED", opts.customerPhone, [name, opts.orderId, opts.amount]);
  }
  await sendAdminPatternSms("ORDER_NEW_ADMIN", ["ادمین", opts.orderId, opts.amount]);
}

export async function notifyPaymentSuccess(opts: {
  phone?: string | null;
  name?: string | null;
  orderId: string | number;
  amount: string | number;
}) {
  if (!opts.phone) return;
  await sendPatternSms("PAYMENT_SUCCESS", opts.phone, [
    opts.name || "مشتری",
    opts.orderId,
    opts.amount,
  ]);
}

export async function notifyShipped(opts: {
  phone?: string | null;
  name?: string | null;
  orderId: string | number;
  tracking?: string | null;
}) {
  if (!opts.phone) return;
  await sendPatternSms("SHIPPED", opts.phone, [opts.name || "مشتری", opts.orderId]);
  if (opts.tracking) {
    await sendPatternSms("TRACKING_CODE", opts.phone, [
      opts.name || "مشتری",
      opts.orderId,
      opts.tracking,
    ]);
  }
}

export async function notifyOrderCancelled(opts: {
  phone?: string | null;
  name?: string | null;
  orderId: string | number;
  reason?: string | null;
}) {
  if (!opts.phone) return;
  await sendPatternSms("ORDER_CANCELLED", opts.phone, [
    opts.name || "مشتری",
    opts.orderId,
    "لغو",
    opts.reason || "—",
  ]);
}
