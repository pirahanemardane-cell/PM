import { BaseRepository } from "./base.repository";
import type { Brand } from "@/types/database";

export class BrandRepository extends BaseRepository {
  async findAllActive() {
    const client = await this.getClient();

    const { data, error } = await client
      .from("brands")
      .select("id, name, slug, logo_url, description, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Pick<
      Brand,
      "id" | "name" | "slug" | "logo_url" | "description" | "is_active"
    >[];
  }

  async findBySlug(slug: string) {
    const client = await this.getClient();

    const { data, error } = await client
      .from("brands")
      .select("id, name, slug, logo_url, description, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as Pick<
      Brand,
      "id" | "name" | "slug" | "logo_url" | "description" | "is_active"
    >;
  }
}
