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

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[otp generateLink]", linkError);
    return { ok: false as const, error: "server" as const };
  }

  const { data: sessionData, error: sessionErr } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });
  if (sessionErr) {
    console.error("[otp session]", sessionErr);
    return { ok: false as const, error: "server" as const };
  }

  // نقش از profiles
  let role = "customer";
  try {
    const { data: prof } = await admin
      .from("profiles")
      .select("role")
      .eq("phone", normalized)
      .maybeSingle();
    if (prof && (prof as { role?: string }).role) {
      role = String((prof as { role: string }).role);
    }
  } catch (e) {
    console.warn("[otp role]", e);
  }

  return {
    ok: true as const,
    role,
    access_token: sessionData.session?.access_token ?? null,
    refresh_token: sessionData.session?.refresh_token ?? null,
  };
}

