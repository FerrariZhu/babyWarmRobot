import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    category,
    material_id,
    thickness = "medium",
    size_label,
    weight_grams,
    baby_id,
    notes,
    source_url,
  } = body;

  if (!name || !category || !material_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const breathability =
    thickness === "thin" ? "high" : thickness === "thick" ? "low" : "medium";

  const { data, error } = await supabase
    .from("clothing_items")
    .insert({
      user_id: user.id,
      baby_id: baby_id ?? null,
      name: String(name).trim(),
      category,
      material_id,
      thickness,
      size_label: size_label ?? null,
      weight_grams: weight_grams ?? null,
      notes: notes ?? null,
      source_url: source_url ?? null,
      source: source_url ? "url" : "manual",
      breathability,
      is_available: true,
    })
    .select("id, name, size_label, breathability, image_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
