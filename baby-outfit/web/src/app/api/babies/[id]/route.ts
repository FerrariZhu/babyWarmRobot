import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.birth_date !== undefined) updates.birth_date = body.birth_date;
  if (body.height_cm !== undefined) {
    updates.height_cm = body.height_cm === "" || body.height_cm == null ? null : Number(body.height_cm);
  }
  if (body.weight_kg !== undefined) {
    updates.weight_kg = body.weight_kg === "" || body.weight_kg == null ? null : Number(body.weight_kg);
  }
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("babies")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, birth_date, avatar_url, height_cm, weight_kg")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
