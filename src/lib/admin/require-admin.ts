import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "login_required" as const };
  }

  // نقش از profiles (با service تا RLS مانع نشود)
  const admin = createServiceClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[requireAdmin profile]", error);
    return { ok: false as const, error: "server" as const };
  }
  const role = String((profile as { role?: string } | null)?.role || "").toLowerCase();
  if (role !== "admin") {
    return { ok: false as const, error: "forbidden" as const };
  }

  return {
    ok: true as const,
    userId: user.id,
    supabase: admin, // service role — عبور از RLS برای CMS
  };
}
