import { createHash, randomInt } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeIranMobile } from "@/lib/numbers";
import { meliSendLoginCode } from "@/lib/sms/melipayamak";
import { rateLimit } from "@/lib/security/rate-limit";

const OTP_TTL_MS = Number(process.env.OTP_TTL_SECONDS || 300) * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;

function hashCode(phone: string, code: string): string {
  const pepper = process.env.OTP_PEPPER || "pm-otp";
  return createHash("sha256").update(`${phone}:${code}:${pepper}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

export type OtpRequestResult =
  | { ok: true }
  | { ok: false; error: "invalid_phone" | "rate_limit" | "send_failed" | "config" | "server" };

export async function requestLoginOtp(rawPhone: string): Promise<OtpRequestResult> {
  const phone = normalizeIranMobile(rawPhone);
  if (!phone) return { ok: false, error: "invalid_phone" };

  const rl = rateLimit({
    key: `otp:req:${phone}`,
    limit: 1,
    windowMs: 55_000,
  });
  if (!rl.ok) return { ok: false, error: "rate_limit" };

  try {
    const service = createServiceClient();
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourCount } = await service
      .from("otp_challenges")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", sinceHour);

    if ((hourCount ?? 0) >= MAX_SENDS_PER_HOUR) {
      return { ok: false, error: "rate_limit" };
    }

    const { data: last } = await service
      .from("otp_challenges")
      .select("created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (last?.created_at) {
      const age = Date.now() - new Date(last.created_at).getTime();
      if (age < RESEND_COOLDOWN_MS) return { ok: false, error: "rate_limit" };
    }

    const code = generateCode();
    const { error: insErr } = await service.from("otp_challenges").insert({
      phone,
      code_hash: hashCode(phone, code),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    });
    if (insErr) {
      console.error("[otp insert]", insErr);
      return { ok: false, error: "server" };
    }

    const send = await meliSendLoginCode({ to: phone, code });
    if (!send.ok) {
      console.error("[meliSendLoginCode]", send.error, send.raw);
      return { ok: false, error: "send_failed" };
    }
    return { ok: true };
  } catch (e) {
    console.error("[requestLoginOtp]", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Missing")) return { ok: false, error: "config" };
    return { ok: false, error: "server" };
  }
}

export type OtpVerifyResult =
  | { ok: true; phone: string }
  | {
      ok: false;
      error: "invalid_phone" | "invalid_code" | "expired" | "too_many_attempts" | "server";
    };

export async function verifyLoginOtp(
  rawPhone: string,
  rawCode: string,
): Promise<OtpVerifyResult> {
  const phone = normalizeIranMobile(rawPhone);
  if (!phone) return { ok: false, error: "invalid_phone" };
  const code = String(rawCode || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "invalid_code" };

  try {
    const service = createServiceClient();
    const { data: row, error } = await service
      .from("otp_challenges")
      .select("id, code_hash, attempts, expires_at, consumed_at")
      .eq("phone", phone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !row) return { ok: false, error: "invalid_code" };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false, error: "expired" };
    }
    if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
      return { ok: false, error: "too_many_attempts" };
    }

    if (hashCode(phone, code) !== row.code_hash) {
      await service
        .from("otp_challenges")
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq("id", row.id);
      return { ok: false, error: "invalid_code" };
    }

    await service
      .from("otp_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    return { ok: true, phone };
  } catch (e) {
    console.error("[verifyLoginOtp]", e);
    return { ok: false, error: "server" };
  }
}
