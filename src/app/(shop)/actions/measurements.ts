"use server";

import { createClient } from "@/lib/supabase/server";

export type MeasurementsDTO = {
  chest_cm: number | null;
  waist_cm: number | null;
  shoulder_cm: number | null;
  sleeve_cm: number | null;
  length_cm: number | null;
  neck_cm: number | null;
  preferred_size: string | null;
  notes: string | null;
  updated_at?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getMyMeasurementsAction() {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required", data: null };
    const { data, error } = await supabase
      .from("user_measurements")
      .select(
        "chest_cm, waist_cm, shoulder_cm, sleeve_cm, length_cm, neck_cm, preferred_size, notes, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return { ok: true as const, data: (data as MeasurementsDTO | null) ?? null };
  } catch (e) {
    console.error("[getMyMeasurements]", e);
    return { ok: false as const, error: "server", data: null };
  }
}

export async function saveMyMeasurementsAction(input: MeasurementsDTO) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const num = (v: number | null | undefined) => {
      if (v == null || v === ("" as unknown)) return null;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
    };

    const row = {
      user_id: user.id,
      chest_cm: num(input.chest_cm),
      waist_cm: num(input.waist_cm),
      shoulder_cm: num(input.shoulder_cm),
      sleeve_cm: num(input.sleeve_cm),
      length_cm: num(input.length_cm),
      neck_cm: num(input.neck_cm),
      preferred_size: (input.preferred_size || "").trim() || null,
      notes: (input.notes || "").trim().slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_measurements")
      .upsert(row, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[saveMyMeasurements]", e);
    return { ok: false as const, error: "server" };
  }
}
