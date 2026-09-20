"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RequireAdminOk = {
  ok: true;
  supabase: SupabaseClient;
  userId: string;
};

export type RequireAdminFail = {
  ok: false;
  error: "login_required" | "forbidden";
  supabase?: SupabaseClient;
};

export type RequireAdminResult = RequireAdminOk | RequireAdminFail;

/**
 * گیت واحد ادمین برای همه server actions پنل.
 * اگر ستون role خالی باشد (پروفایل ناقص)، فقط لاگین کافی است تا dev گیر نکند.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "login_required", supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role;
  if (role && role !== "admin") {
    return { ok: false, error: "forbidden", supabase };
  }

  return { ok: true, supabase, userId: user.id };
}
