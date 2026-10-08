import { createServiceClient } from "@/lib/supabase/service";

export async function logSearchQuery(input: {
  query: string;
  resultCount: number;
  userId?: string | null;
  source?: string;
}): Promise<void> {
  try {
    const q = (input.query || "").trim().slice(0, 200);
    if (q.length < 2) return;
    const service = createServiceClient();
    await service.from("search_queries").insert({
      query: q,
      result_count: Math.max(0, Number(input.resultCount) || 0),
      user_id: input.userId || null,
      source: input.source || "suggest",
    });
  } catch (e) {
    console.error("[logSearchQuery]", e);
  }
}
