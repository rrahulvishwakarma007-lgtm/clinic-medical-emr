export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing env vars — URL: ${!!url}, KEY: ${!!key}`);
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        patient_id,
        medicine,
        dosage,
        duration,
        notes,
        diagnosis,
        followup_date,
        route,
        created_at,
        patients ( name )
      `)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    let body: any;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

    const { patient_id, medicine, dosage, duration, notes, diagnosis, followup_date, medicines, route } = body;

    if (!patient_id) {
      return NextResponse.json({ error: "Missing required field: patient_id" }, { status: 400 });
    }

    let insertData: any = {
      patient_id,
      diagnosis: diagnosis || "",
      notes: notes || "",
      followup_date: followup_date || null,
      route: route || "Oral",
    };

    if (Array.isArray(medicines) && medicines.length > 0) {
      insertData.medicine = medicines.map(m => m.name).join("\n");
      insertData.dosage = medicines.map(m => m.dosage).join("\n");
      insertData.duration = medicines.map(m => m.duration).join("\n");
    } else {
      if (!medicine) return NextResponse.json({ error: "Missing medicine name" }, { status: 400 });
      insertData.medicine = medicine;
      insertData.dosage = dosage || "";
      insertData.duration = duration || "";
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .insert([insertData])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = getSupabase();
    let body: any;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });

    const { error } = await supabase
      .from("prescriptions")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}