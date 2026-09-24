"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function isSet(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && String(v).trim());
}

export async function adminSettingsStatusAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  return {
    ok: true as const,
    env: process.env.NODE_ENV ?? "unknown",
    checks: {
      supabaseUrl: isSet("NEXT_PUBLIC_SUPABASE_URL"),
      supabaseAnon: isSet("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      supabaseService: isSet("SUPABASE_SERVICE_ROLE_KEY"),
      r2Account: isSet("R2_ACCOUNT_ID"),
      r2Access: isSet("R2_ACCESS_KEY_ID"),
      r2Secret: isSet("R2_SECRET_ACCESS_KEY"),
      r2Bucket: isSet("R2_BUCKET_NAME"),
      r2Public: isSet("R2_PUBLIC_BASE_URL"),
    },
  };
}

export async function adminChangePasswordAction(
  currentPassword: string,
  newPassword: string,
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const cur = (currentPassword || "").trim();
  const next = (newPassword || "").trim();
  if (next.length < 8) {
    return { ok: false as const, error: "weak" as const };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return { ok: false as const, error: "login_required" as const };
    }

    // تأیید رمز فعلی
    const { error: checkErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: cur,
    });
    if (checkErr) {
      return { ok: false as const, error: "bad_current" as const };
    }

    const { error: updErr } = await supabase.auth.updateUser({
      password: next,
    });
    if (updErr) {
      console.error("[adminChangePassword]", updErr);
      return { ok: false as const, error: "server" as const };
    }
    return { ok: true as const };
  } catch (e) {
    console.error("[adminChangePassword]", e);
    return { ok: false as const, error: "server" as const };
  }
}
