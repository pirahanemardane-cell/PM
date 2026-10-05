import { BaseRepository } from "./base.repository";
import type { Category } from "@/types/database";

function normalizeSlug(raw: string): string {
  let s = (raw || "").trim();
  for (let i = 0; i < 3; i++) {
    try {
      const d = decodeURIComponent(s);
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  return s;
}

export class CategoryRepository extends BaseRepository {
  async findAllActive() {
    const client = await this.getClient();
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  }

  async findRoots() {
    const client = await this.getClient();
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  }

  async findBySlug(slug: string) {
    const client = await this.getClient();
    const s = normalizeSlug(slug);
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("slug", s)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return (data as Category) ?? null;
  }

  async findChildren(parentId: string) {
    const client = await this.getClient();
    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("parent_id", parentId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  }
}
