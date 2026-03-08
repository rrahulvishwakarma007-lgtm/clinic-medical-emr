export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing env vars — URL: ${!!url}, KEY: ${!!key}`);
  return createClient(url, key);
}

// GET — list all uploaded reports
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — upload a file
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const patient_name = formData.get("patient_name") as string;
    const category = formData.get("category") as string || "Lab Result";
    const notes = formData.get("notes") as string || "";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!patient_name) return NextResponse.json({ error: "Patient name is required" }, { status: 400 });

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = `uploads/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    // Save record to DB
    const { data, error: dbError } = await supabase
      .from("reports")
      .insert([{
        patient_name,
        category,
        notes,
        name: file.name,
        path: filePath,
        size: file.size,
      }])
      .select();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove file from storage and DB
export async function DELETE(req: Request) {
  try {
    const supabase = getSupabase();
    const { id, path } = await req.json();

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Delete from storage
    if (path) {
      await supabase.storage.from("reports").remove([path]);
    }

    // Delete from DB
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}