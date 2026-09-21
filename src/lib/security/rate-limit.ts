/**
 * Rate limit حافظه‌ای — برای Server Actions.
 * در serverless چند instance کامل نیست؛ OTP از قبل با otp_challenges محدود شده.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const b = store.get(opts.key);
  if (!b || b.resetAt <= now) {
    store.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }
  if (b.count >= opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }
  b.count += 1;
  return { ok: true };
}

/** پاکسازی گه‌گاه برای جلوگیری از رشد Map */
export function rateLimitCleanup() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}
