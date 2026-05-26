import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function guessNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "Imported Item";
    return decodeURIComponent(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Imported Item";
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { source_url } = await request.json();
  if (!source_url || typeof source_url !== "string") {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { data: materials } = await supabase
    .from("materials")
    .select("id, code")
    .eq("is_active", true)
    .limit(1);

  const materialId = materials?.[0]?.id;
  const name = guessNameFromUrl(source_url.trim());

  const { data: job, error: jobError } = await supabase
    .from("url_parse_jobs")
    .insert({
      user_id: user.id,
      source_url: source_url.trim(),
      status: "completed",
      result: { name, category: "bodysuit", material_id: materialId },
      completed_at: new Date().toISOString(),
    })
    .select("id, result")
    .single();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  const result = (job.result ?? {}) as {
    name?: string;
    category?: string;
    material_id?: string;
  };

  return NextResponse.json({
    job_id: job.id,
    name: result.name ?? name,
    category: result.category ?? "bodysuit",
    material_id: result.material_id ?? materialId,
  });
}
