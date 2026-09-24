import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const client = sb();
    const [cats, brands, colors, sizes] = await Promise.all([
      client.from("categories").select("name,slug").order("name").limit(40),
      client.from("brands").select("name,slug").order("name").limit(40),
      client
        .from("colors")
        .select("name,slug")
        .order("name")
        .limit(30),
      client
        .from("sizes")
        .select("name,slug")
        .order("name")
        .limit(30),
    ]);
    return NextResponse.json({
      categories: cats.data ?? [],
      brands: brands.data ?? [],
      colors: colors.data ?? [],
      sizes: sizes.data ?? [],
    });
  } catch (e) {
    console.error("facets", e);
    return NextResponse.json(
      { categories: [], brands: [], colors: [], sizes: [] },
      { status: 200 }
    );
  }
}
