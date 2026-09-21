"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminGate =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; error: "login_required" | "forbidden"; supabase?: SupabaseClient };

/**
 * تنها نقطهٔ ورود دسترسی CMS.
 * نقش: profiles.role === "admin"
 * staff بعداً می‌تواند با permission جدا گسترش یابد.
 */
export async function requireAdmin(): Promise<AdminGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "login_required", supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role;
  if (role !== "admin") {
    return { ok: false, error: "forbidden", supabase };
  }

  return { ok: true, supabase, userId: user.id };
}
