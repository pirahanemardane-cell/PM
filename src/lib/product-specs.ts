import { createClient } from "@/lib/supabase/server";

export async function getProductSpecRows(productId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_attribute_values")
      .select(
        `
        attribute_id,
        option_id,
        value_text,
        attributes:attribute_id ( name, slug ),
        attribute_options:option_id ( value )
      `,
      )
      .eq("product_id", productId);
    if (error || !data?.length) return [] as { label: string; value: string }[];

    const rows: { label: string; value: string }[] = [];
    for (const row of data as Array<Record<string, unknown>>) {
      const attr = row.attributes as { name?: string; slug?: string } | null;
      const opt = row.attribute_options as { value?: string } | null;
      const label = (attr?.name || attr?.slug || "").trim();
      const value = (
        opt?.value ||
        (typeof row.value_text === "string" ? row.value_text : "") ||
        ""
      ).trim();
      if (label && value) rows.push({ label, value });
    }
    return rows;
  } catch {
    return [] as { label: string; value: string }[];
  }
}
