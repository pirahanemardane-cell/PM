import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

function isDynamicServerUsage(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const dig = "digest" in e ? String((e as { digest?: string }).digest || "") : "";
  if (dig === "DYNAMIC_SERVER_USAGE") return true;
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("Dynamic server usage") || msg.includes("couldn't be rendered statically");
}

export abstract class BaseRepository {
  protected async getClient() {
    try {
      return await createClient();
    } catch (e) {
      if (isDynamicServerUsage(e)) {
        return createPublicClient();
      }
      throw e;
    }
  }
}
