import { randomBytes } from "node:crypto";
"use server";

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
  const supabase = await createClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", normalized)
    .maybeSingle();

  let userId = profile?.id as string | undefined;

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { phone: normalized },
      phone: `+98${normalized.slice(1)}`,
      phone_confirm: true,
    });
    if (createErr || !created.user) {
      console.error("[otp createUser]", createErr);
      // کاربر از قبل با این ایمیل
    } else {
      userId = created.user.id;
      await admin.from("profiles").upsert({
        id: userId,
        phone: normalized,
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

  // پسورد یک‌بارمصرف برای signIn سمت کلاینت (HTTPS)
  const tempPass = randomBytes(24).toString("base64url") + "Aa1!";
  if (!userId) {
    // اگر هنوز id نداریم از ایمیل پیدا کن
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = list?.users?.find((u) => u.email === email);
    userId = found?.id;
  }
  if (!userId) {
    console.error("[otp] no userId for session");
    return { ok: false as const, error: "server" as const };
  }
  const { error: passErr } = await admin.auth.admin.updateUserById(userId, {
    password: tempPass,
    email_confirm: true,
  });
  if (passErr) {
    console.error("[otp set password]", passErr);
    return { ok: false as const, error: "server" as const };
  }

  return {
    ok: true as const,
    role,
    email,
    temp_password: tempPass,
  };
}

}

