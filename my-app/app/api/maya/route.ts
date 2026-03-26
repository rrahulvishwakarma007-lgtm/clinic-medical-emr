// app/api/maya/route.ts
// Uses Google Gemini API — free, no credit card needed
// Get key at: aistudio.google.com → Get API Key

import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in environment variables");

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [{
        role: "user",
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(req: NextRequest) {
  try {
    const { userSaid, currentStage, data, mode } = await req.json();

    // ── DIAGNOSIS MODE ────────────────────────────────────────
    if (mode === "diagnosis") {
      const systemInstruction = `You are Maya, an AI medical assistant in an Indian clinic helping doctors.
Analyse patient symptoms and suggest diagnosis.
Rules:
- Use proper medical terminology for the doctor
- Consider common Indian diseases (dengue, typhoid, malaria, TB, viral fever, UTI etc)
- Suggest practical medicines available in India
- Always include Hindi summary
- Return ONLY valid JSON, no extra text`;

      const prompt = `Patient symptoms described by doctor: ${userSaid}

Respond ONLY with this exact JSON format:
{
  "diagnosis": "Most likely diagnosis",
  "confidence": "High",
  "explanation": "2-3 sentences why based on symptoms",
  "suggestedMedicines": [
    {"name": "Paracetamol 500mg", "dosage": "1-0-1", "duration": "5 days", "notes": "after food"},
    {"name": "Cetirizine 10mg", "dosage": "0-0-1", "duration": "3 days", "notes": "at night"}
  ],
  "investigations": ["CBC", "Dengue NS1"],
  "redFlags": ["If fever persists beyond 5 days"],
  "hindiSummary": "Viral bukhar hai, 5 din ki dawai leni hai, pani zyada piyen"
}`;

      const reply = await callGemini(prompt, systemInstruction);

      // Extract JSON from response
      const jsonStart = reply.indexOf("{");
      const jsonEnd   = reply.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("Invalid response from AI");
      const jsonStr = reply.substring(jsonStart, jsonEnd + 1);
      const parsed  = JSON.parse(jsonStr);

      return NextResponse.json({ reply: JSON.stringify(parsed) });
    }

    // ── NORMAL MAYA PRESCRIPTION MODE ────────────────────────
    const systemInstruction = `You are Maya, a friendly AI assistant in an Indian clinic EMR.
Speak Hinglish in Roman script ONLY (no Devanagari).
Extract patient and prescription data from doctor's speech.
Return ONLY valid JSON.`;

    const prompt = `Stage: "${currentStage}"
Data so far: ${JSON.stringify(data || {}, null, 2)}
Doctor said: "${userSaid || "start"}"

Stage flow: ask_patient_name → ask_age → ask_phone → ask_symptoms → ask_diagnosis → ask_medicines → ask_notes → confirming → done

Return this exact JSON:
{"reply":"warm short Hinglish reply max 2 sentences","extracted":{"patient":{"name":"","age":"","phone":""},"prescription":{"diagnosis":"","symptoms":"","symptom_duration":"","medicines":[],"notes":""}},"filledField":"Patient Name/Age/Phone/Symptoms/Diagnosis/Medicines/Notes","nextStage":"next stage name"}`;

    const reply = await callGemini(prompt, systemInstruction);

    // Parse JSON from response
    const jsonStart = reply.indexOf("{");
    const jsonEnd   = reply.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const clean  = reply.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ reply, extracted: {}, nextStage: currentStage });

  } catch (err: any) {
    console.error("Maya API error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}