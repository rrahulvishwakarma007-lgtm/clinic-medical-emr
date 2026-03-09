"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ExtractedMedicine {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

interface ExtractionResult {
  patient_name?: string;
  diagnosis?: string;
  medicines: ExtractedMedicine[];
  notes?: string;
}

type RecordingState = "idle" | "recording" | "processing" | "done" | "error";

// ─── Web Speech API types ─────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VoicePrescription() {
  const router = useRouter();
  const [state, setState] = useState<RecordingState>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [extracted, setExtracted] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  const [pulse, setPulse] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  // Pulse animation for idle mic
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser. Please use Chrome.");
      setState("error");
      return;
    }

    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimText("");
    setExtracted(null);
    setError("");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Auto-detect Hindi + English
    recognition.lang = "hi-IN"; // hi-IN handles Hinglish well; falls back to English
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState("recording");

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += text + " ";
          setTranscript(finalTranscriptRef.current);
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "aborted") {
        setError("Microphone error: " + e.error);
        setState("error");
      }
    };

    recognition.onend = () => {
      setInterimText("");
      const final = finalTranscriptRef.current.trim();
      if (final && state !== "error") {
        extractWithAI(final);
      } else if (!final) {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state]);

  async function extractWithAI(text: string) {
    setState("processing");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a medical AI assistant embedded in a clinic EMR system. Extract prescription information from this doctor's voice note (may be in English, Hindi, or Hinglish).

Voice transcript: "${text}"

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "patient_name": "patient name if mentioned, else empty string",
  "diagnosis": "diagnosis if mentioned, else empty string",
  "notes": "any general instructions like rest, diet, follow-up if mentioned, else empty string",
  "medicines": [
    {
      "medicine": "medicine name (normalized to proper English name)",
      "dosage": "e.g. 500mg, 10ml, 1 tablet",
      "frequency": "e.g. Once daily, Twice daily, Three times a day, SOS",
      "duration": "e.g. 5 days, 1 week, 10 days",
      "route": "Oral or Topical or Injection or Eye Drops or Ear Drops or Nasal Drops or Inhalation or IV Injection",
      "instructions": "e.g. After food, Before food, With warm water, empty string if none"
    }
  ]
}

Rules:
- If dosage not mentioned, use empty string
- If duration not mentioned, use empty string  
- If frequency not mentioned, use empty string
- Route defaults to "Oral" unless specified
- Normalize Hindi medicine names to English (e.g. "paracetamol" stays, "bukhar ki dawai" → "Paracetamol")
- Extract ALL medicines mentioned
- medicines array must never be empty — if no medicine found, return one entry with medicine: "Unknown" and empty other fields`
          }]
        })
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || "";

      // Strip any accidental markdown fences
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed: ExtractionResult = JSON.parse(clean);

      // Ensure medicines is always an array
      if (!Array.isArray(parsed.medicines)) parsed.medicines = [];

      setExtracted(parsed);
      setState("done");
    } catch (err: any) {
      setError("AI extraction failed: " + (err.message || "Unknown error"));
      setState("error");
    }
  }

  function handleStop() {
    stopRecording();
    // onend will trigger extraction
  }

  function updateMedicine(idx: number, field: keyof ExtractedMedicine, value: string) {
    if (!extracted) return;
    const updated = [...extracted.medicines];
    updated[idx] = { ...updated[idx], [field]: value };
    setExtracted({ ...extracted, medicines: updated });
  }

  function removeMedicine(idx: number) {
    if (!extracted) return;
    setExtracted({ ...extracted, medicines: extracted.medicines.filter((_, i) => i !== idx) });
  }

  function addBlankMedicine() {
    if (!extracted) return;
    setExtracted({
      ...extracted,
      medicines: [...extracted.medicines, { medicine: "", dosage: "", frequency: "", duration: "", route: "Oral", instructions: "" }]
    });
  }

  function handleUsePrescription() {
    if (!extracted) return;
    // Store in sessionStorage for the prescription page to pick up
    sessionStorage.setItem("voice_prescription", JSON.stringify(extracted));
    setIsOpen(false);
    setState("idle");
    setTranscript("");
    setExtracted(null);
    router.push("/prescriptions?voice=1");
  }

  function handleReset() {
    stopRecording();
    setState("idle");
    setTranscript("");
    setInterimText("");
    setExtracted(null);
    setError("");
  }

  const FREQ_OPTIONS = ["Once daily", "Twice daily", "Three times a day", "Four times a day", "Every 8 hours", "Every 6 hours", "At bedtime", "Morning & Night", "SOS / As needed"];
  const ROUTE_OPTIONS = ["Oral", "Topical", "Injection", "IV Injection", "IM Injection", "Eye Drops", "Ear Drops", "Nasal Drops", "Nasal Spray", "Inhalation", "Sublingual", "Rectal", "Transdermal Patch"];

  const btnStyle: any = {
    border: "none", borderRadius: "8px", cursor: "pointer",
    fontFamily: "inherit", fontWeight: "600", fontSize: "13px",
    padding: "8px 14px", transition: "all 0.15s"
  };

  return (
    <>
      {/* ── Floating Mic Button ── */}
      <button
        onClick={() => { setIsOpen(true); if (state === "idle") startRecording(); }}
        title="Voice Prescription"
        style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 9999,
          width: "58px", height: "58px", borderRadius: "50%",
          background: state === "recording" ? "#dc2626" : state === "processing" ? "#d97706" : "#0f4c81",
          color: "white", border: "none", cursor: "pointer",
          boxShadow: state === "recording"
            ? "0 0 0 8px rgba(220,38,38,0.2), 0 4px 20px rgba(220,38,38,0.4)"
            : "0 4px 20px rgba(15,76,129,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", transition: "all 0.3s",
          transform: pulse && state === "idle" ? "scale(1.08)" : "scale(1)",
        }}
      >
        {state === "recording" ? "⏹" : state === "processing" ? "⏳" : "🎙️"}
      </button>

      {/* ── Modal Panel ── */}
      {isOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.45)", display: "flex",
          alignItems: "flex-end", justifyContent: "flex-end",
          padding: "24px"
        }} onClick={e => { if (e.target === e.currentTarget) { handleReset(); setIsOpen(false); } }}>
          <div style={{
            background: "white", borderRadius: "20px", width: "520px", maxWidth: "95vw",
            maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            fontFamily: "'DM Sans', -apple-system, sans-serif"
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "17px", color: "#1a1a2e" }}>🎙️ Voice Prescription</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                  {state === "recording" && "🔴 Listening... speak now"}
                  {state === "processing" && "⚙️ AI is extracting medicines..."}
                  {state === "done" && "✅ Review extracted data below"}
                  {state === "idle" && "Press mic to start speaking"}
                  {state === "error" && "❌ " + error}
                </div>
              </div>
              <button onClick={() => { handleReset(); setIsOpen(false); }} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#aaa", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {/* Recording State */}
              {(state === "recording" || state === "processing") && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    width: "80px", height: "80px", borderRadius: "50%", margin: "0 auto 20px",
                    background: state === "recording" ? "#fee2e2" : "#fef3c7",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
                    animation: state === "recording" ? "voicePulse 1s infinite" : "none",
                    boxShadow: state === "recording" ? "0 0 0 12px rgba(220,38,38,0.1)" : "none"
                  }}>
                    {state === "recording" ? "🎤" : "🤖"}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: state === "recording" ? "#dc2626" : "#d97706" }}>
                    {state === "recording" ? "Recording in progress" : "Analyzing with AI..."}
                  </div>

                  {/* Live transcript */}
                  {(transcript || interimText) && (
                    <div style={{ marginTop: "16px", background: "#f8fafc", borderRadius: "12px", padding: "14px", textAlign: "left", fontSize: "13px", color: "#444", lineHeight: "1.6", maxHeight: "120px", overflowY: "auto" }}>
                      <span>{transcript}</span>
                      <span style={{ color: "#aaa" }}>{interimText}</span>
                    </div>
                  )}

                  {state === "recording" && (
                    <button onClick={handleStop} style={{ ...btnStyle, marginTop: "20px", background: "#dc2626", color: "white", padding: "11px 28px", fontSize: "14px" }}>
                      ⏹ Stop & Extract
                    </button>
                  )}
                </div>
              )}

              {/* Error State */}
              {state === "error" && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>❌</div>
                  <div style={{ color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>{error}</div>
                  <button onClick={handleReset} style={{ ...btnStyle, background: "#0f4c81", color: "white" }}>Try Again</button>
                </div>
              )}

              {/* Done — Show extracted data */}
              {state === "done" && extracted && (
                <div>
                  {/* Original transcript (collapsed) */}
                  <details style={{ marginBottom: "16px" }}>
                    <summary style={{ fontSize: "12px", color: "#888", cursor: "pointer", userSelect: "none" }}>
                      📝 View original transcript
                    </summary>
                    <div style={{ marginTop: "8px", background: "#f8fafc", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#555", lineHeight: "1.6" }}>
                      {transcript || "—"}
                    </div>
                  </details>

                  {/* Patient & Diagnosis */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Patient Name</label>
                      <input value={extracted.patient_name || ""} onChange={e => setExtracted({ ...extracted, patient_name: e.target.value })}
                        placeholder="Type or leave blank"
                        style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Diagnosis</label>
                      <input value={extracted.diagnosis || ""} onChange={e => setExtracted({ ...extracted, diagnosis: e.target.value })}
                        placeholder="e.g. Viral fever"
                        style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
                    </div>
                  </div>

                  {/* Medicines */}
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "#1a1a2e", marginBottom: "10px" }}>
                    💊 Medicines Extracted ({extracted.medicines.length})
                  </div>

                  {extracted.medicines.map((med, idx) => (
                    <div key={idx} style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px", marginBottom: "10px", border: "1.5px solid #e8f1fb", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                          #{idx + 1}
                        </span>
                        <button onClick={() => removeMedicine(idx)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600", padding: "3px 8px" }}>✕ Remove</button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={{ fontSize: "11px", color: "#888" }}>Medicine Name</label>
                          <input value={med.medicine} onChange={e => updateMedicine(idx, "medicine", e.target.value)}
                            style={{ width: "100%", marginTop: "3px", padding: "7px 10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontWeight: "600", boxSizing: "border-box", fontFamily: "inherit" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "#888" }}>Dosage</label>
                          <input value={med.dosage} onChange={e => updateMedicine(idx, "dosage", e.target.value)}
                            placeholder="e.g. 500mg"
                            style={{ width: "100%", marginTop: "3px", padding: "7px 10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "#888" }}>Duration</label>
                          <input value={med.duration} onChange={e => updateMedicine(idx, "duration", e.target.value)}
                            placeholder="e.g. 5 days"
                            style={{ width: "100%", marginTop: "3px", padding: "7px 10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "#888" }}>Frequency</label>
                          <select value={med.frequency} onChange={e => updateMedicine(idx, "frequency", e.target.value)}
                            style={{ width: "100%", marginTop: "3px", padding: "7px 10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit", background: "white" }}>
                            <option value="">— select —</option>
                            {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "#888" }}>Route</label>
                          <select value={med.route} onChange={e => updateMedicine(idx, "route", e.target.value)}
                            style={{ width: "100%", marginTop: "3px", padding: "7px 10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit", background: "white" }}>
                            {ROUTE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        {med.instructions && (
                          <div style={{ gridColumn: "1/-1" }}>
                            <label style={{ fontSize: "11px", color: "#888" }}>Instructions</label>
                            <input value={med.instructions} onChange={e => updateMedicine(idx, "instructions", e.target.value)}
                              style={{ width: "100%", marginTop: "3px", padding: "7px 10px", borderRadius: "7px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button onClick={addBlankMedicine} style={{ ...btnStyle, background: "#f0f4f8", color: "#555", width: "100%", marginBottom: "12px", textAlign: "center" }}>
                    + Add Medicine
                  </button>

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>General Notes / Instructions</label>
                    <textarea value={extracted.notes || ""} onChange={e => setExtracted({ ...extracted, notes: e.target.value })}
                      placeholder="e.g. Rest for 3 days, avoid cold food..."
                      style={{ width: "100%", marginTop: "4px", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", minHeight: "60px", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {state === "done" && extracted && (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "10px" }}>
                <button onClick={handleReset} style={{ ...btnStyle, background: "#f0f4f8", color: "#555", flex: 1 }}>
                  🔄 Re-record
                </button>
                <button onClick={handleUsePrescription} style={{ ...btnStyle, background: "#0f4c81", color: "white", flex: 2, fontSize: "14px" }}>
                  ✅ Open Prescription Form →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes voicePulse {
          0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.3)}
          50%{box-shadow:0 0 0 16px rgba(220,38,38,0)}
        }
      `}</style>
    </>
  );
}