"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/otp/service";
import { onlyDigits, normalizeIranMobile } from "@/lib/numbers";

function otpEmail(phone: string) {
  return `${onlyDigits(phone)}@phone.pirahanmardane.ir`;
}

async function resolveAuthEmail(loginId: string): Promise<string | null> {
  const raw = (loginId || "").trim();
  if (!raw) return null;
  if (raw.includes("@")) return raw.toLowerCase();

  const phone = normalizeIranMobile(raw);
  if (!phone) return null;

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  const uid = (profile as { id?: string } | null)?.id;
  if (uid) {
    const { data, error } = await admin.auth.admin.getUserById(uid);
    if (!error && data?.user?.email) return data.user.email;
  }
  return otpEmail(phone);
}

export async function signInAction(loginId: string, password: string) {
  const email = await resolveAuthEmail(loginId);
  if (!email) {
    return { ok: false as const, error: "شناسه ورود نامعتبر است" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return {
      ok: false as const,
      error: "ایمیل/موبایل یا رمز عبور نادرست است",
    };
  }
  return { ok: true as const };
}

export async function signUpAction(
  email: string,
  password: string,
  fullName?: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName ?? "" } },
  });
  if (error) return { ok: false as const, error: error.message };
  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName ?? null,
    } as never);
    if (profileError) console.error("[signUp profile]", profileError);
  }
  return { ok: true as const };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPasswordAction(emailOrPhone: string) {
  const email = await resolveAuthEmail(emailOrPhone);
  if (!email) return { ok: false as const, error: "شناسه نامعتبر" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/ورود`,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function requestOtpAction(phone: string) {
  return requestLoginOtp(phone);
}

export async function verifyOtpAction(phone: string, code: string) {
  const verified = await verifyLoginOtp(phone, code);
  if (!verified.ok) return verified;

  const normalized = verified.phone;
  const syntheticEmail = otpEmail(normalized);
  const admin = createServiceClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("phone", normalized)
    .maybeSingle();

  let userId = (profile as { id?: string } | null)?.id as string | undefined;
  let role = String((profile as { role?: string } | null)?.role || "customer");
  let authEmail = syntheticEmail;

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: { phone: normalized },
      phone: `+98${normalized.slice(1)}`,
      phone_confirm: true,
    });
    if (createErr) {
      console.warn("[otp createUser]", createErr.message);
      try {
        const { data: listed } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const found = listed?.users?.find((u) => u.email === syntheticEmail);
        userId = found?.id;
        if (found?.email) authEmail = found.email;
      } catch (e) {
        console.warn("[otp listUsers]", e);
      }
    } else {
      userId = created.user?.id;
      if (created.user?.email) authEmail = created.user.email;
    }
    if (userId) {
      await admin.from("profiles").upsert({
        id: userId,
        phone: normalized,
        role: role === "admin" ? "admin" : "customer",
      } as never);
    }
  } else {
    try {
      const { data: u } = await admin.auth.admin.getUserById(userId);
      const current = u?.user?.email || "";
      if (current) authEmail = current;
      await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: {
          ...(u?.user?.user_metadata || {}),
          phone: normalized,
        },
        phone: `+98${normalized.slice(1)}`,
        phone_confirm: true,
      });
    } catch (e) {
      console.warn("[otp touch user]", e);
    }
  }

  if (!userId) {
    console.error("[otp] no userId");
    return { ok: false as const, error: "server" as const };
  }

  try {
    const { data: prof2 } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (prof2 && (prof2 as { role?: string }).role) {
      role = String((prof2 as { role: string }).role);
    }
  } catch {}

  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: authEmail,
    });
  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error("[otp generateLink]", linkErr);
    return { ok: false as const, error: "server" as const };
  }

  return {
    ok: true as const,
    role,
    email: authEmail,
    token_hash: linkData.properties.hashed_token as string,
  };
}

export async function changeMyPasswordAction(
  currentPassword: string,
  newPassword: string,
) {
  const cur = (currentPassword || "").trim();
  const next = (newPassword || "").trim();
  if (next.length < 8) {
    return { ok: false as const, error: "weak" as const };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false as const, error: "login_required" as const };
  }
  const { error: checkErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: cur,
  });
  if (checkErr) {
    return { ok: false as const, error: "bad_current" as const };
  }
  const { error: updErr } = await supabase.auth.updateUser({ password: next });
  if (updErr) {
    console.error("[changeMyPassword]", updErr);
    return { ok: false as const, error: "server" as const };
  }
  return { ok: true as const };
}
