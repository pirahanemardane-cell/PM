import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** کلاینت anon بدون cookie — مناسب دادهٔ عمومی و ISR */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
