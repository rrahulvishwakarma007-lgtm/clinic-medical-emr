export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing env vars`);
  return createClient(url, key);
}

// POST — generate signed download URL
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { path } = await req.json();

    if (!path) return NextResponse.json({ error: "Missing file path" }, { status: 400 });

    const { data, error } = await supabase.storage
      .from("reports")
      .createSignedUrl(path, 60); // URL valid for 60 seconds

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ url: data.signedUrl });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}