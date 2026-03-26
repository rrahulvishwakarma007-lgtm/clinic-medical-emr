"use client";
// components/VoiceDiagnosis.tsx
// Doctor speaks symptoms → Maya AI suggests diagnosis + medicines

import { useState, useRef, useEffect } from "react";

type DxStage = "idle" | "listening" | "thinking" | "result" | "error";

interface DiagnosisSuggestion {
  diagnosis: string;
  confidence: "High" | "Medium" | "Low";
  explanation: string;
  suggestedMedicines: { name: string; dosage: string; duration: string; notes: string }[];
  investigations: string[];
  redFlags: string[];
  hindiSummary: string;
}

export default function VoiceDiagnosis() {
  const [open, setOpen]           = useState(false);
  const [stage, setStage]         = useState<DxStage>("idle");
  const [symptoms, setSymptoms]   = useState("");
  const [interimText, setInterim] = useState("");
  const [result, setResult]       = useState<DiagnosisSuggestion | null>(null);
  const [error, setError]         = useState("");
  const [useTextInput, setUseText] = useState(false);
  const [textSymptoms, setTextSymptoms] = useState("");
  const recognitionRef            = useRef<any>(null);

  // Detect if speech recognition is available
  const hasSpeech = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setUseText(true); return; }

    setStage("listening");
    setSymptoms("");
    setInterim("");
    setResult(null);
    setError("");

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "hi-IN"; // Hindi first, fallback to English

    r.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (const res of e.results) {
        if (res.isFinal) final += res[0].transcript + " ";
        else interim = res[0].transcript;
      }
      if (final) setSymptoms(s => s + final);
      setInterim(interim);
    };

    r.onerror = () => { setUseText(true); setStage("idle"); };
    r.onend = () => {
      setInterim("");
      if (symptoms || textSymptoms) getDiagnosis(symptoms || textSymptoms);
    };

    recognitionRef.current = r;
    r.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  async function getDiagnosis(symptomText: string) {
    if (!symptomText.trim()) { setError("Please describe the symptoms first."); return; }
    setStage("thinking");
    setError("");

    try {
      const res = await fetch("/api/maya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userSaid: symptomText,
          currentStage: "voice_diagnosis",
          data: {},
          mode: "diagnosis",
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Parse diagnosis from response
      let suggestion: DiagnosisSuggestion;
      try {
        const clean = data.reply.replace(/```json|```/g, "").trim();
        suggestion = JSON.parse(clean);
      } catch {
        // If not valid JSON, create a simple result from text
        suggestion = {
          diagnosis: "Based on symptoms described",
          confidence: "Medium",
          explanation: data.reply,
          suggestedMedicines: [],
          investigations: [],
          redFlags: [],
          hindiSummary: "",
        };
      }
      setResult(suggestion);
      setStage("result");
    } catch (e: any) {
      setError("Could not get diagnosis. Please try again.");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setSymptoms("");
    setInterim("");
    setResult(null);
    setError("");
    setTextSymptoms("");
  }

  const confColor = {
    High: { bg:"#f0fdf4", border:"#86efac", text:"#166534" },
    Medium: { bg:"#fffbeb", border:"#fcd34d", text:"#92400e" },
    Low: { bg:"#fef2f2", border:"#fca5a5", text:"#991b1b" },
  };

  return (
    <>
      <style>{`
        @keyframes dxPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes dxFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dxSpin { to{transform:rotate(360deg)} }
        @keyframes dxListen { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 70%{box-shadow:0 0 0 16px rgba(220,38,38,0)} }
      `}</style>

      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Voice to Diagnosis"
          style={{
            position:"fixed", bottom:"88px", right:"16px", zIndex:8000,
            width:"52px", height:"52px", borderRadius:"50%",
            background:"linear-gradient(135deg,#7c3aed,#a855f7)",
            border:"none", color:"white", fontSize:"22px",
            cursor:"pointer", boxShadow:"0 4px 16px rgba(124,58,237,0.5)",
            animation:"dxPulse 3s ease-in-out infinite",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
          🩺
        </button>
      )}

      {/* Main panel */}
      {open && (
        <div style={{
          position:"fixed", inset:0, zIndex:9000,
          background:"rgba(0,0,0,0.6)",
          display:"flex", alignItems:"flex-end", justifyContent:"center",
          padding:"0",
        }} onClick={e => { if (e.target === e.currentTarget) { reset(); setOpen(false); }}}>
          <div style={{
            background:"white", borderRadius:"24px 24px 0 0",
            width:"100%", maxWidth:"560px",
            maxHeight:"90vh", overflowY:"auto",
            padding:"24px 20px 32px",
            animation:"dxFadeUp 0.3s ease",
            fontFamily:"'DM Sans',-apple-system,sans-serif",
          }}>

            {/* Handle bar */}
            <div style={{ width:"40px", height:"4px", background:"#e2e8f0", borderRadius:"2px", margin:"0 auto 20px" }} />

            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <div>
                <div style={{ fontSize:"18px", fontWeight:"800", color:"#0d1b2e" }}>
                  🩺 Voice to Diagnosis
                </div>
                <div style={{ fontSize:"12px", color:"#94a3b8", marginTop:"2px" }}>
                  Speak or type symptoms — Maya suggests diagnosis
                </div>
              </div>
              <button onClick={() => { reset(); setOpen(false); }}
                style={{ background:"#f1f5f9", border:"none", borderRadius:"50%", width:"34px", height:"34px", fontSize:"16px", cursor:"pointer" }}>
                ✕
              </button>
            </div>

            {/* ── IDLE / INPUT ── */}
            {(stage === "idle" || stage === "error") && (
              <div style={{ animation:"dxFadeUp 0.3s ease" }}>
                {!useTextInput ? (
                  <>
                    {/* Voice button */}
                    <button onClick={startListening}
                      style={{
                        width:"100%", padding:"20px",
                        background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                        color:"white", border:"none", borderRadius:"16px",
                        fontSize:"16px", fontWeight:"800", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                        boxShadow:"0 6px 24px rgba(124,58,237,0.35)",
                        marginBottom:"12px",
                      }}>
                      🎤 Speak Symptoms
                    </button>
                    <button onClick={() => setUseText(true)}
                      style={{ width:"100%", padding:"12px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"12px", fontSize:"14px", color:"#64748b", cursor:"pointer", fontFamily:"inherit" }}>
                      ⌨️ Type instead
                    </button>
                  </>
                ) : (
                  <>
                    <textarea
                      value={textSymptoms}
                      onChange={e => setTextSymptoms(e.target.value)}
                      placeholder="Type symptoms here... e.g. Bukhar 3 din se hai, sar dard, khansi bhi hai"
                      autoFocus
                      style={{
                        width:"100%", minHeight:"120px", padding:"14px 16px",
                        border:"1.5px solid #e2e8f0", borderRadius:"12px",
                        fontSize:"14px", fontFamily:"inherit", resize:"vertical",
                        outline:"none", marginBottom:"12px", boxSizing:"border-box",
                        lineHeight:"1.6",
                      }}
                    />
                    <div style={{ display:"flex", gap:"10px" }}>
                      <button onClick={() => getDiagnosis(textSymptoms)}
                        disabled={!textSymptoms.trim()}
                        style={{
                          flex:1, padding:"13px",
                          background: textSymptoms.trim() ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "#e2e8f0",
                          color: textSymptoms.trim() ? "white" : "#94a3b8",
                          border:"none", borderRadius:"12px", fontSize:"14px",
                          fontWeight:"700", cursor: textSymptoms.trim() ? "pointer" : "not-allowed",
                          fontFamily:"inherit",
                        }}>
                        🔍 Get Diagnosis
                      </button>
                      <button onClick={() => setUseText(false)}
                        style={{ padding:"13px 16px", background:"#f1f5f9", border:"none", borderRadius:"12px", fontSize:"14px", cursor:"pointer", color:"#64748b" }}>
                        🎤
                      </button>
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ marginTop:"12px", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", color:"#991b1b" }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>
            )}

            {/* ── LISTENING ── */}
            {stage === "listening" && (
              <div style={{ textAlign:"center", animation:"dxFadeUp 0.3s ease" }}>
                <button onClick={stopListening}
                  style={{
                    width:"80px", height:"80px", borderRadius:"50%",
                    background:"#dc2626", border:"none", color:"white",
                    fontSize:"32px", cursor:"pointer", margin:"0 auto 16px",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    animation:"dxListen 1.5s ease-in-out infinite",
                    boxShadow:"0 4px 20px rgba(220,38,38,0.4)",
                  }}>
                  🎤
                </button>
                <div style={{ fontWeight:"700", fontSize:"16px", color:"#dc2626", marginBottom:"8px" }}>
                  Listening... tap to stop
                </div>
                {(symptoms || interimText) && (
                  <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"12px", padding:"14px", fontSize:"14px", color:"#334155", textAlign:"left", lineHeight:"1.6", marginTop:"12px" }}>
                    {symptoms}
                    <span style={{ color:"#94a3b8" }}>{interimText}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── THINKING ── */}
            {stage === "thinking" && (
              <div style={{ textAlign:"center", padding:"32px 0", animation:"dxFadeUp 0.3s ease" }}>
                <div style={{ width:"48px", height:"48px", border:"4px solid #ede9fe", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"dxSpin 0.8s linear infinite", margin:"0 auto 16px" }} />
                <div style={{ fontWeight:"700", fontSize:"16px", color:"#7c3aed", marginBottom:"6px" }}>
                  Maya is analysing...
                </div>
                <div style={{ fontSize:"13px", color:"#94a3b8" }}>
                  Checking symptoms against medical database
                </div>
                {symptoms && (
                  <div style={{ background:"#f8fafc", borderRadius:"10px", padding:"12px", fontSize:"13px", color:"#64748b", marginTop:"16px", textAlign:"left" }}>
                    <strong>Symptoms:</strong> {symptoms || textSymptoms}
                  </div>
                )}
              </div>
            )}

            {/* ── RESULT ── */}
            {stage === "result" && result && (
              <div style={{ animation:"dxFadeUp 0.3s ease" }}>

                {/* Diagnosis card */}
                <div style={{
                  background: confColor[result.confidence].bg,
                  border:`1.5px solid ${confColor[result.confidence].border}`,
                  borderRadius:"16px", padding:"18px 20px", marginBottom:"16px",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                    <div style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", textTransform:"uppercase", letterSpacing:"1px" }}>
                      Suggested Diagnosis
                    </div>
                    <span style={{
                      background: confColor[result.confidence].border,
                      color: confColor[result.confidence].text,
                      padding:"2px 10px", borderRadius:"20px",
                      fontSize:"11px", fontWeight:"700",
                    }}>
                      {result.confidence} confidence
                    </span>
                  </div>
                  <div style={{ fontSize:"20px", fontWeight:"800", color:"#0d1b2e", marginBottom:"8px" }}>
                    {result.diagnosis}
                  </div>
                  <div style={{ fontSize:"13px", color:"#475569", lineHeight:"1.6" }}>
                    {result.explanation}
                  </div>
                  {result.hindiSummary && (
                    <div style={{ marginTop:"10px", fontSize:"13px", color:"#64748b", fontStyle:"italic", borderTop:"1px solid rgba(0,0,0,0.06)", paddingTop:"10px" }}>
                      {result.hindiSummary}
                    </div>
                  )}
                </div>

                {/* Suggested Medicines */}
                {result.suggestedMedicines?.length > 0 && (
                  <div style={{ marginBottom:"14px" }}>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:"#0d1b2e", marginBottom:"8px" }}>
                      💊 Suggested Medicines
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                      {result.suggestedMedicines.map((m, i) => (
                        <div key={i} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"10px", padding:"10px 14px" }}>
                          <div style={{ fontWeight:"700", color:"#0d1b2e", fontSize:"14px" }}>{m.name}</div>
                          <div style={{ fontSize:"12px", color:"#64748b", marginTop:"3px" }}>
                            {m.dosage && <span>📋 {m.dosage} </span>}
                            {m.duration && <span>· ⏱ {m.duration} </span>}
                            {m.notes && <span>· {m.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigations */}
                {result.investigations?.length > 0 && (
                  <div style={{ marginBottom:"14px" }}>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:"#0d1b2e", marginBottom:"8px" }}>
                      🔬 Suggested Tests
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                      {result.investigations.map((inv, i) => (
                        <span key={i} style={{ background:"#eff6ff", color:"#1d4ed8", padding:"4px 12px", borderRadius:"20px", fontSize:"12px", fontWeight:"600" }}>
                          {inv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Red Flags */}
                {result.redFlags?.length > 0 && (
                  <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:"12px", padding:"12px 14px", marginBottom:"14px" }}>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:"#991b1b", marginBottom:"6px" }}>
                      ⚠️ Warning Signs
                    </div>
                    {result.redFlags.map((f, i) => (
                      <div key={i} style={{ fontSize:"12px", color:"#7f1d1d", marginTop:"3px" }}>• {f}</div>
                    ))}
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:"10px", padding:"10px 14px", fontSize:"11px", color:"#92400e", marginBottom:"16px" }}>
                  ⚕️ <strong>AI Suggestion Only</strong> — Always confirm with clinical examination. This is a decision support tool, not a replacement for medical judgment.
                </div>

                {/* Actions */}
                <div style={{ display:"flex", gap:"10px" }}>
                  <button onClick={reset}
                    style={{ flex:1, padding:"12px", background:"#f1f5f9", border:"none", borderRadius:"12px", fontSize:"14px", fontWeight:"700", cursor:"pointer", color:"#475569", fontFamily:"inherit" }}>
                    🔄 New Diagnosis
                  </button>
                  <button onClick={() => { reset(); setOpen(false); }}
                    style={{ flex:1, padding:"12px", background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:"12px", fontSize:"14px", fontWeight:"700", cursor:"pointer", color:"white", fontFamily:"inherit" }}>
                    ✓ Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}