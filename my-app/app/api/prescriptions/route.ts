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

    const { patient_id, medicine, dosage, duration, notes, diagnosis, medicines } = body;

    if (!patient_id) {
      return NextResponse.json({ error: "Missing required field: patient_id" }, { status: 400 });
    }

    // If 'medicines' is provided as an array, we store the first one in the main columns
    // and potentially the rest as well, or we store the JSON blob.
    // To maintain compatibility with the existing table schema while supporting multiple medicines:
    // We will store the primary medicine info in the standard columns, 
    // and the full list in the 'notes' or a new 'medicines' column if it exists.
    // Given I should not change the schema if possible, I'll store the medicines as a JSON string in the 'medicine' column 
    // OR just handle the list. 
    // Actually, the best way to support "one prescription with multiple medicines" without changing schema 
    // is to join the medicine names into the 'medicine' column and dosages into 'dosage' etc.
    
    let insertData: any = {
      patient_id,
      diagnosis: diagnosis || "",
      notes: notes || "",
    };

    if (Array.isArray(medicines) && medicines.length > 0) {
      // Multiple medicines: Join them with a delimiter or store as string
      insertData.medicine = medicines.map(m => m.name).join("\n");
      insertData.dosage = medicines.map(m => m.dosage).join("\n");
      insertData.duration = medicines.map(m => m.duration).join("\n");
      // Include route and individual instructions in the notes if needed, 
      // but let's keep it simple for now as requested.
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

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

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