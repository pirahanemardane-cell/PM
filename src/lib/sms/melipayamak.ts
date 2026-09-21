/**
 * ملی‌پیامک
 * 1) الگو تأییدشده: BaseServiceNumber + MELIPAYAMAK_BODY_ID
 * 2) fallback: SendOtp (متن ثابت سامانه)
 * مستند REST: https://rest.payamak-panel.com/api/SendSMS/...
 */

export type MeliResult =
  | { ok: true; recId: string }
  | { ok: false; error: string; raw?: string };

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function parseResponse(body: string): MeliResult {
  const t = (body || "").trim().replace(/^"|"$/g, "");
  if (!t) return { ok: false, error: "empty_response", raw: body };

  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    const val = String(j.Value ?? j.value ?? j.RecId ?? j.recId ?? "");
    const status = Number(j.RetStatus ?? j.retStatus ?? j.Status ?? 1);
    if (status === 1 && val && !/^(0|1[0-9]|2[0-2]|35)$/.test(val)) {
      return { ok: true, recId: val };
    }
    if (val && /^\d{5,}$/.test(val)) return { ok: true, recId: val };
    return { ok: false, error: val || `status_${status}`, raw: t };
  } catch {
    /* plain */
  }

  if (/^\d{5,}$/.test(t)) return { ok: true, recId: t };
  if (/^-?\d+$/.test(t)) {
    const n = Number(t);
    if (n > 1000) return { ok: true, recId: t };
    return { ok: false, error: `meli_${t}`, raw: t };
  }
  return { ok: false, error: "unknown_response", raw: t };
}

async function postForm(path: string, fields: Record<string, string>): Promise<MeliResult> {
  const body = new URLSearchParams(fields);
  const res = await fetch(`https://rest.payamak-panel.com/api/SendSMS/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: `http_${res.status}`, raw: text };
  return parseResponse(text);
}

/** ارسال با الگوی تأییدشده — text = مقادیر متغیرها با ; */
export async function meliSendByPattern(opts: {
  to: string;
  /** مثلاً فقط کد: "123456" یا چند متغیر: "علی;123456" */
  text: string;
}): Promise<MeliResult> {
  const username = requireEnv("MELIPAYAMAK_USERNAME");
  const password = requireEnv("MELIPAYAMAK_PASSWORD");
  const bodyId = requireEnv("MELIPAYAMAK_BODY_ID");

  return postForm("BaseServiceNumber", {
    username,
    password,
    to: opts.to,
    text: opts.text,
    bodyId,
  });
}

/** SendOtp ساده — متن ثابت سامانه */
export async function meliSendOtp(opts: {
  to: string;
  code: number;
}): Promise<MeliResult> {
  const username = requireEnv("MELIPAYAMAK_USERNAME");
  const password = requireEnv("MELIPAYAMAK_PASSWORD");
  const from = requireEnv("MELIPAYAMAK_FROM");

  return postForm("SendOtp", {
    username,
    password,
    to: opts.to,
    from,
    code: String(opts.code),
  });
}

/** ترجیح: الگو اگر BODY_ID باشد، وگرنه SendOtp */
export async function meliSendLoginCode(opts: {
  to: string;
  code: string;
}): Promise<MeliResult> {
  if (process.env.MELIPAYAMAK_BODY_ID?.trim()) {
    return meliSendByPattern({ to: opts.to, text: opts.code });
  }
  return meliSendOtp({ to: opts.to, code: Number(opts.code) });
}
