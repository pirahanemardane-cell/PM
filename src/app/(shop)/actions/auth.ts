"use server";

import { randomBytes } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/otp/service";
import { onlyDigits } from "@/lib/numbers";

function otpEmail(phone: string) {
  return `${onlyDigits(phone)}@phone.pirahanmardane.ir`;
}

export async function signInAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false as const, error: error.message };
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

export async function resetPasswordAction(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
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
  const email = otpEmail(normalized);
  const admin = createServiceClient();

  // پیدا کردن / ساخت کاربر
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("phone", normalized)
    .maybeSingle();

  let userId = (profile as { id?: string } | null)?.id as string | undefined;
  let role = String((profile as { role?: string } | null)?.role || "customer");

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { phone: normalized },
      phone: `+98${normalized.slice(1)}`,
      phone_confirm: true,
    });
    if (createErr) {
      // شاید از قبل با همین ایمیل باشد
      console.warn("[otp createUser]", createErr.message);
      const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = listed?.users?.find((u) => u.email === email);
      userId = found?.id;
    } else {
      userId = created.user?.id;
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
      await admin.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
        user_metadata: { phone: normalized },
      });
    } catch (e) {
      console.warn("[otp updateUser]", e);
    }
  }

  if (!userId) {
    console.error("[otp] no userId");
    return { ok: false as const, error: "server" as const };
  }

  // پسورد یک‌بارمصرف — کلاینت با آن signIn می‌کند (استاندارد و قابل اعتماد)
  const tempPass = randomBytes(24).toString("base64url") + "Aa1!";
  const { error: passErr } = await admin.auth.admin.updateUserById(userId, {
    password: tempPass,
    email_confirm: true,
  });
  if (passErr) {
    console.error("[otp set password]", passErr);
    return { ok: false as const, error: "server" as const };
  }

  // نقش نهایی
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

  return {
    ok: true as const,
    role,
    email,
    temp_password: tempPass,
  };
}

