import { BaseRepository } from "./base.repository";
import type { Attribute, AttributeOption } from "@/types/database";

export type AttributeWithOptions = Attribute & {
  options: AttributeOption[];
};

export class AttributeRepository extends BaseRepository {
  async findFilterableWithOptions(): Promise<AttributeWithOptions[]> {
    const client = await this.getClient();

    const { data: attrs, error } = await client
      .from("attributes")
      .select("id, name, slug, type, is_filterable, is_required, sort_order, created_at")
      .eq("is_filterable", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    const attributeRows = (attrs ?? []) as Attribute[];
    if (!attributeRows.length) return [];

    const ids = attributeRows.map((a) => a.id);
    const { data: options, error: optErr } = await client
      .from("attribute_options")
      .select("id, attribute_id, value, slug, sort_order")
      .in("attribute_id", ids)
      .order("sort_order", { ascending: true });

    if (optErr) throw optErr;
    const optionRows = (options ?? []) as AttributeOption[];

    const byAttr = new Map<string, AttributeOption[]>();
    for (const o of optionRows) {
      const list = byAttr.get(o.attribute_id) ?? [];
      list.push(o);
      byAttr.set(o.attribute_id, list);
    }

    return attributeRows.map((a) => ({
      ...a,
      options: byAttr.get(a.id) ?? [],
    }));
  }
}
