import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/vitals?patient_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patient_id = searchParams.get("patient_id");
  if (!patient_id) return NextResponse.json({ error: "patient_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("patient_vitals")
    .select("*")
    .eq("patient_id", patient_id)
    .order("recorded_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/vitals
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("patient_vitals")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/vitals
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase
    .from("patient_vitals")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}