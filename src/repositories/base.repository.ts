import { createClient } from "@/lib/supabase/server";

export abstract class BaseRepository {
  protected async getClient() {
    return await createClient();
  }
}
