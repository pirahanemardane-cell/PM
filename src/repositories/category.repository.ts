import { BaseRepository } from "./base.repository";
import type { Category } from "@/types/database";

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

    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as Category;
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
