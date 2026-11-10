"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/require-permission";

export type SizeGuideAdminRow = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  rows: {
    id: string;
    size_label: string;
    chest_cm: number | null;
    waist_cm: number | null;
    shoulder_cm: number | null;
    sleeve_cm: number | null;
    length_cm: number | null;
    neck_cm: number | null;
    sort_order: number;
  }[];
};

export async function adminListSizeGuidesFullAction() {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] as SizeGuideAdminRow[] };
  try {
    const { data: guides, error } = await gate.supabase
      .from("size_guides")
      .select("id, name, description, category_id")
      .order("name");
    if (error) throw error;
    const ids = (guides ?? []).map((g) => g.id);
    let rows: SizeGuideAdminRow["rows"] = [];
    if (ids.length) {
      const { data: rowData, error: rErr } = await gate.supabase
        .from("size_guide_rows")
        .select(
          "id, size_guide_id, size_label, chest_cm, waist_cm, shoulder_cm, sleeve_cm, length_cm, neck_cm, sort_order",
        )
        .in("size_guide_id", ids)
        .order("sort_order");
      if (rErr) throw rErr;
      rows = (rowData ?? []) as SizeGuideAdminRow["rows"] &
        { size_guide_id: string }[];
    }
    const byGuide = new Map<string, SizeGuideAdminRow["rows"]>();
    for (const r of rows as (SizeGuideAdminRow["rows"][number] & { size_guide_id?: string })[]) {
      const gid = (r as { size_guide_id?: string }).size_guide_id;
      if (!gid) continue;
      const list = byGuide.get(gid) ?? [];
      list.push(r);
      byGuide.set(gid, list);
    }
    const items: SizeGuideAdminRow[] = (guides ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      category_id: g.category_id,
      rows: byGuide.get(g.id) ?? [],
    }));
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListSizeGuidesFull]", e);
    return { ok: false as const, error: "server", items: [] as SizeGuideAdminRow[] };
  }
}

export async function adminSaveSizeGuideAction(input: {
  id?: string;
  name: string;
  description?: string;
  rows: {
    id?: string;
    size_label: string;
    chest_cm?: number | null;
    waist_cm?: number | null;
    shoulder_cm?: number | null;
    sleeve_cm?: number | null;
    length_cm?: number | null;
    neck_cm?: number | null;
    sort_order?: number;
  }[];
}) {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const name = (input.name || "").trim();
  if (!name) return { ok: false as const, error: "name_required" };

  try {
    let guideId = input.id || "";
    if (guideId) {
      const { error } = await gate.supabase
        .from("size_guides")
        .update({
          name,
          description: (input.description || "").trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", guideId);
      if (error) throw error;
      await gate.supabase.from("size_guide_rows").delete().eq("size_guide_id", guideId);
    } else {
      const { data, error } = await gate.supabase
        .from("size_guides")
        .insert({
          name,
          description: (input.description || "").trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      guideId = data.id;
    }

    const rowInserts = (input.rows || [])
      .filter((r) => (r.size_label || "").trim())
      .map((r, i) => ({
        size_guide_id: guideId,
        size_label: r.size_label.trim(),
        chest_cm: r.chest_cm ?? null,
        waist_cm: r.waist_cm ?? null,
        shoulder_cm: r.shoulder_cm ?? null,
        sleeve_cm: r.sleeve_cm ?? null,
        length_cm: r.length_cm ?? null,
        neck_cm: r.neck_cm ?? null,
        sort_order: r.sort_order ?? i,
      }));
    if (rowInserts.length) {
      const { error: insErr } = await gate.supabase
        .from("size_guide_rows")
        .insert(rowInserts);
      if (insErr) throw insErr;
    }

    revalidatePath("/admin/size-guides");
    revalidatePath("/size-guide");
    return { ok: true as const, id: guideId };
  } catch (e) {
    console.error("[adminSaveSizeGuide]", e);
    return { ok: false as const, error: "server" };
  }
}

export async function adminDeleteSizeGuideAction(id: string) {
  const gate = await requirePermission("admin.products");
  if (!gate.ok) return { ok: false as const, error: gate.error };
  try {
    await gate.supabase.from("products").update({ size_guide_id: null }).eq("size_guide_id", id);
    await gate.supabase.from("size_guide_rows").delete().eq("size_guide_id", id);
    const { error } = await gate.supabase.from("size_guides").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/size-guides");
    return { ok: true as const };
  } catch (e) {
    console.error("[adminDeleteSizeGuide]", e);
    return { ok: false as const, error: "server" };
  }
}
