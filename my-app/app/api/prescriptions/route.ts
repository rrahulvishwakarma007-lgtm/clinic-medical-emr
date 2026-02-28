import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: Fetches prescriptions AND joins the patient names
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        id,
        medicine,
        dosage,
        duration,
        notes,
        created_at,
        patient_id,
        patients ( name )
      `) // The link we made in Step 1 makes this line work
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Saves the form data
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([
        {
          patient_id: body.patient_id,
          medicine: body.medicine,
          dosage: body.dosage,
          duration: body.duration,
          notes: body.notes
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}