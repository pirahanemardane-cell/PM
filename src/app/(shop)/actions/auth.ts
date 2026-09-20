"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  fullName?: string
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
    if (profileError) {
      console.error("[signUp profile]", profileError);
    }
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
