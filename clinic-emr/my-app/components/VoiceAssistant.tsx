"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatientData {
  name: string;
  age: string;
  phone: string;
  blood_group: string;
  address: string;
  allergies: string;
  type: string;
}

interface Medicine {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

interface PrescriptionData {
  patient_name: string;
  diagnosis: string;
  symptoms: string;
  symptom_duration: string;
  medicines: Medicine[];
  notes: string;
}

interface CollectedData {
  patient: Partial<PatientData>;
  prescription: Partial<PrescriptionData>;
}

type Stage =
  | "idle"
  | "ask_patient_name"
  | "ask_age"
  | "ask_phone"
  | "ask_symptoms"
  | "ask_diagnosis"
  | "ask_medicines"
  | "ask_notes"
  | "confirming"
  | "saving"
  | "done"
  | "thinking"
  | "error";

interface Message {
  role: "assistant" | "user";
  text: string;
  time: string;
  fieldFilled?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function FieldFillBadge({ field }: { field: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: "#d1fae5", color: "#065f46", padding: "3px 10px",
      borderRadius: "20px", fontSize: "11px", fontWeight: "600", marginTop: "6px"
    }}>
      ✅ {field} filled
    </div>
  );
}

// ─── Best voice picker ────────────────────────────────────────────────────────
// Priority: Hindi female > Hindi any > English India female > English UK female > any English female
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const hi = voices.filter(v => v.lang.startsWith("hi"));
  if (hi.length) {
    const hiFemale = hi.find(v => /female|woman|girl/i.test(v.name));
    return hiFemale || hi[0];
  }
  const enIN = voices.filter(v => v.lang === "en-IN");
  if (enIN.length) {
    const enINFemale = enIN.find(v => /female|woman|girl/i.test(v.name));
    return enINFemale || enIN[0];
  }
  const enUKFemale = voices.find(v => v.name.includes("Google UK English Female"));
  if (enUKFemale) return enUKFemale;
  const anyFemale = voices.find(v => /female|samantha|karen|moira|tessa|fiona/i.test(v.name) && v.lang.startsWith("en"));
  return anyFemale || voices.find(v => v.lang.startsWith("en")) || null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [collected, setCollected] = useState<CollectedData>({ patient: {}, prescription: {} });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [pulse, setPulse] = useState(false);
  const [filledFields, setFilledFields] = useState<string[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const finalRef = useRef("");
  const stageRef = useRef<Stage>("idle");
  const collectedRef = useRef(collected);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mouthInterval = useRef<any>(null);
  const [mouthOpen, setMouthOpen] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { collectedRef.current = collected; }, [collected]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Load voices (async, browser may delay loading) ────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const v = synthRef.current!.getVoices();
      if (v.length) {
        voicesRef.current = v;
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    // Chrome fires voiceschanged asynchronously
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    // Fallback: poll for 3 seconds
    const poll = setInterval(() => {
      const v = synthRef.current?.getVoices() || [];
      if (v.length) {
        voicesRef.current = v;
        setVoicesLoaded(true);
        clearInterval(poll);
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(poll), 3000);
    return () => { clearInterval(poll); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  // ── Speak ──────────────────────────────────────────────────────────────────
  // Key fix: use hi-IN voice for proper Hindi pronunciation
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!synthRef.current) { onDone?.(); return; }
    synthRef.current.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    // Pick best available voice
    const voices = voicesRef.current.length
      ? voicesRef.current
      : synthRef.current.getVoices();

    const best = pickBestVoice(voices);
    if (best) {
      utter.voice = best;
      // Use hi-IN lang so browser attempts Hindi phonetics
      utter.lang = best.lang.startsWith("hi") ? "hi-IN" : "en-IN";
    } else {
      utter.lang = "hi-IN";
    }

    utter.rate = 0.88;   // slightly slower so Hindi words are clear
    utter.pitch = 1.1;
    utter.volume = 1;

    utter.onstart = () => {
      setIsSpeaking(true);
      mouthInterval.current = setInterval(() => setMouthOpen(m => !m), 160);
    };
    utter.onend = () => {
      setIsSpeaking(false);
      setMouthOpen(false);
      clearInterval(mouthInterval.current);
      onDone?.();
    };
    utter.onerror = (e) => {
      console.warn("TTS error:", e);
      setIsSpeaking(false);
      setMouthOpen(false);
      clearInterval(mouthInterval.current);
      onDone?.();
    };

    // Chrome bug: synthesis can silently stall after ~15s, kick it
    synthRef.current.speak(utter);
    let keepAlive: any;
    if (typeof window !== "undefined") {
      keepAlive = setInterval(() => {
        if (synthRef.current?.speaking) {
          synthRef.current.pause();
          synthRef.current.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);
    }
    utter.onend = () => {
      clearInterval(keepAlive);
      setIsSpeaking(false);
      setMouthOpen(false);
      clearInterval(mouthInterval.current);
      onDone?.();
    };
    utter.onerror = () => {
      clearInterval(keepAlive);
      setIsSpeaking(false);
      setMouthOpen(false);
      clearInterval(mouthInterval.current);
      onDone?.();
    };
  }, []);

  // ── Add message ────────────────────────────────────────────────────────────
  const addMsg = useCallback((role: "assistant" | "user", text: string, fieldFilled?: string) => {
    setMessages(prev => [...prev, { role, text, time: nowTime(), fieldFilled }]);
  }, []);

  // ── Listen ─────────────────────────────────────────────────────────────────
  // KEY FIX: Use en-IN as primary language for recognition.
  // en-IN handles Hinglish (mixed Hindi+English) FAR better than hi-IN in Web Speech API,
  // especially for medical terms like "Paracetamol", "BP", "fever", "twice daily", etc.
  // We also try multiple languages sequentially if the first yields no result.
  const listen = useCallback((onResult: (text: string) => void) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      onResult("");
      return;
    }

    finalRef.current = "";
    setInterimText("");
    setIsListening(true);

    const rec = new SR();
    rec.continuous = true;          // Keep listening until silence
    rec.interimResults = true;
    // en-IN handles Hinglish best — recognises both Devanagari-romanised Hindi and English medical terms
    rec.lang = "en-IN";
    rec.maxAlternatives = 3;        // Give us alternatives to pick best

    let silenceTimer: any = null;

    rec.onresult = (e: any) => {
      // Reset silence timer on every result
      clearTimeout(silenceTimer);

      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalRef.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);

      // Auto-stop after 1.5s of silence post last word
      silenceTimer = setTimeout(() => {
        rec.stop();
      }, 1500);
    };

    rec.onend = () => {
      clearTimeout(silenceTimer);
      setIsListening(false);
      setInterimText("");
      const result = finalRef.current.trim();
      onResult(result);
    };

    rec.onerror = (e: any) => {
      clearTimeout(silenceTimer);
      console.warn("STT error:", e.error);
      setIsListening(false);
      setInterimText("");
      // On "no-speech" — retry once automatically
      if (e.error === "no-speech") {
        onResult("");
      } else {
        onResult(finalRef.current.trim() || "");
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, []);

  // ── Claude AI: extract + decide next step ─────────────────────────────────
  const processWithAI = useCallback(async (userSaid: string, currentStage: Stage, data: CollectedData) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are Maya, a friendly AI assistant inside a clinic EMR system in India. You speak in Hinglish (mix of Hindi and English) — casual, warm, like a real Indian clinic staff member.

IMPORTANT FOR TTS: Since the text-to-speech may use an English voice, write Hindi words in a way that sounds natural when read aloud by an English TTS. Keep responses SHORT (1-2 sentences max). Use common Hinglish phrases that an English TTS can pronounce clearly. Avoid pure Devanagari script — use Roman transliteration only.

You are currently in stage: "${currentStage}"
Collected data so far: ${JSON.stringify(data, null, 2)}

Your job: Extract data from the doctor's response for the current stage, give a warm Hinglish confirmation, then move to the next stage.

Stage flow: ask_patient_name → ask_age → ask_phone → ask_symptoms → ask_diagnosis → ask_medicines → ask_notes → confirming → done

Stage-specific extraction:
- ask_patient_name: extract patient name
- ask_age: extract age (number only)  
- ask_phone: extract phone number
- ask_symptoms: extract symptoms list AND duration if mentioned
- ask_diagnosis: extract diagnosis/condition name
- ask_medicines: extract ALL medicines with dosage, frequency, duration, route (default Oral), instructions
- ask_notes: extract follow-up instructions, rest advice, diet etc
- confirming: if doctor says haan/yes/sahi/theek/ok/correct/confirm → nextStage="done", else ask what to correct

Example replies (short, TTS-friendly Hinglish):
- "Theek hai, Rahul Sharma note kar liya. Age batayein?"
- "Got it! Teen din se fever aur headache. Koi diagnosis?"
- "Perfect! Paracetamol 500mg twice daily. Koi aur medicine?"
- "Sab theek hai. Confirm karein?"

Respond ONLY with valid JSON (no markdown):
{
  "reply": "Maya's Hinglish response — max 2 short sentences, Roman script only",
  "extracted": {
    "patient": { "name":"", "age":"", "phone":"" },
    "prescription": { "diagnosis":"", "symptoms":"", "symptom_duration":"", "medicines":[], "notes":"" }
  },
  "filledField": "human-readable label of what was just filled e.g. Patient Name",
  "nextStage": "next stage string"
}
Only include extracted fields relevant to current stage. medicines format: [{medicine,dosage,frequency,duration,route,instructions}]`,
        messages: [{ role: "user", content: userSaid || "(no response)" }]
      })
    });

    const data2 = await res.json();
    const raw = (data2.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  }, []);

  // ── Handle doctor's response ───────────────────────────────────────────────
  const handleResponse = useCallback(async (userText: string) => {
    if (!userText) {
      const retry = "Lagta hai awaaz nahi aayi. Please dobara bolein.";
      addMsg("assistant", retry);
      speak(retry, () => setTimeout(() => listen(handleResponse), 300));
      return;
    }

    addMsg("user", userText);
    setStage("thinking");

    try {
      const { reply, extracted, filledField, nextStage } = await processWithAI(
        userText, stageRef.current, collectedRef.current
      );

      setCollected(prev => {
        const next = {
          patient: { ...prev.patient, ...(extracted?.patient || {}) },
          prescription: { ...prev.prescription, ...(extracted?.prescription || {}) }
        };
        if (extracted?.prescription?.medicines?.length > 0) {
          next.prescription.medicines = extracted.prescription.medicines;
        }
        return next;
      });

      if (filledField) setFilledFields(prev => [...prev, filledField]);

      addMsg("assistant", reply, filledField);
      setStage(nextStage as Stage);

      if (nextStage === "done") {
        speak(reply, () => {
          setTimeout(() => {
            const c = collectedRef.current;
            sessionStorage.setItem("voice_prescription", JSON.stringify({
              patient_name: c.patient.name || "",
              diagnosis: c.prescription.diagnosis || "",
              symptoms: c.prescription.symptoms || "",
              notes: [c.prescription.notes, c.prescription.symptom_duration ? `Symptoms since: ${c.prescription.symptom_duration}` : ""].filter(Boolean).join(". "),
              medicines: c.prescription.medicines || [],
            }));
            sessionStorage.setItem("voice_patient", JSON.stringify(c.patient));
            setIsOpen(false);
            resetState();
            router.push("/prescriptions?voice=1");
          }, 600);
        });
        return;
      }

      speak(reply, () => setTimeout(() => listen(handleResponse), 300));

    } catch (err) {
      console.error("AI error:", err);
      const errMsg = "Sorry, kuch problem ho gayi. Dobara bolein?";
      addMsg("assistant", errMsg);
      speak(errMsg, () => setTimeout(() => listen(handleResponse), 300));
      setStage(stageRef.current);
    }
  }, [addMsg, processWithAI, speak, listen, router]);

  // ── Start conversation ─────────────────────────────────────────────────────
  const startConversation = useCallback(() => {
    resetState();
    setStage("ask_patient_name");
    const greeting = "Hello Doctor! Main Maya hoon. Patient ka naam batayein please?";
    addMsg("assistant", greeting);
    speak(greeting, () => setTimeout(() => listen(handleResponse), 300));
  }, [addMsg, speak, listen, handleResponse]);

  function resetState() {
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    clearInterval(mouthInterval.current);
    setMessages([]);
    setCollected({ patient: {}, prescription: {} });
    setFilledFields([]);
    setIsListening(false);
    setIsSpeaking(false);
    setMouthOpen(false);
    setInterimText("");
  }

  function handleClose() {
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    clearInterval(mouthInterval.current);
    setIsOpen(false);
    setStage("idle");
    resetState();
  }

  // ── Filled fields panel ───────────────────────────────────────────────────
  const allFields = [
    { key: "name", label: "Patient Name", value: collected.patient.name },
    { key: "age", label: "Age", value: collected.patient.age },
    { key: "phone", label: "Phone", value: collected.patient.phone },
    { key: "symptoms", label: "Symptoms", value: collected.prescription.symptoms },
    { key: "diagnosis", label: "Diagnosis", value: collected.prescription.diagnosis },
    { key: "medicines", label: "Medicines", value: collected.prescription.medicines?.length ? `${collected.prescription.medicines.length} medicine(s)` : "" },
    { key: "notes", label: "Notes", value: collected.prescription.notes },
  ];

  const stageLabel: Record<Stage, string> = {
    idle: "Tap to start",
    ask_patient_name: "🎤 Patient name sun rahi hoon...",
    ask_age: "🎤 Age sun rahi hoon...",
    ask_phone: "🎤 Phone number sun rahi hoon...",
    ask_symptoms: "🎤 Symptoms sun rahi hoon...",
    ask_diagnosis: "🎤 Diagnosis sun rahi hoon...",
    ask_medicines: "🎤 Medicines sun rahi hoon...",
    ask_notes: "🎤 Notes sun rahi hoon...",
    confirming: "🎤 Confirmation sun rahi hoon...",
    saving: "💾 Saving...",
    done: "✅ Form fill ho raha hai...",
    thinking: "🤔 Samajh rahi hoon...",
    error: "Kuch problem ho gayi",
  };

  const stageOrder: Stage[] = ["ask_patient_name","ask_age","ask_phone","ask_symptoms","ask_diagnosis","ask_medicines","ask_notes","confirming"];
  const currentStep = stageOrder.indexOf(stage);
  const progressPct = currentStep >= 0 ? ((currentStep + 1) / stageOrder.length) * 100 : stage === "done" ? 100 : 0;

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => { setIsOpen(true); if (stage === "idle") startConversation(); }}
        title="Maya — AI Voice Assistant"
        style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 9999,
          width: "62px", height: "62px", borderRadius: "50%",
          background: isListening ? "#dc2626" : isSpeaking ? "#7c3aed" : stage !== "idle" ? "#059669" : "#0f4c81",
          color: "white", border: "3px solid white", cursor: "pointer",
          boxShadow: isListening
            ? "0 0 0 8px rgba(220,38,38,0.2), 0 8px 24px rgba(220,38,38,0.5)"
            : isSpeaking
            ? "0 0 0 8px rgba(124,58,237,0.2), 0 8px 24px rgba(124,58,237,0.5)"
            : "0 8px 24px rgba(15,76,129,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "26px", transition: "all 0.3s",
          transform: isListening ? "scale(1.15)" : pulse && stage === "idle" ? "scale(1.07)" : "scale(1)",
        }}
      >
        {isListening ? "🎤" : isSpeaking ? "🔊" : stage !== "idle" ? "💬" : "🤖"}
      </button>

      {/* Tooltip */}
      {!isOpen && stage === "idle" && (
        <div style={{
          position: "fixed", bottom: "98px", right: "16px", zIndex: 9998,
          background: "#1a202c", color: "white", fontSize: "11px", fontWeight: "600",
          padding: "5px 12px", borderRadius: "8px", whiteSpace: "nowrap",
          opacity: pulse ? 1 : 0, transition: "opacity 0.6s",
          fontFamily: "inherit", pointerEvents: "none"
        }}>
          🤖 Maya se baat karein
        </div>
      )}

      {/* Voice status banner */}
      {!voicesLoaded && isOpen && (
        <div style={{
          position: "fixed", top: "12px", left: "50%", transform: "translateX(-50%)",
          zIndex: 10001, background: "#fef3c7", color: "#92400e",
          padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "600"
        }}>
          ⏳ Voices load ho rahi hain...
        </div>
      )}

      {/* ── Main Panel ── */}
      {isOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(10,10,30,0.55)",
          display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
          padding: "20px", fontFamily: "'DM Sans', -apple-system, sans-serif"
        }} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>

          <div style={{
            display: "flex", gap: "12px", alignItems: "flex-end",
            width: "800px", maxWidth: "95vw"
          }}>

            {/* ── Left: Live Form Preview ── */}
            <div style={{
              flex: 1, background: "white", borderRadius: "20px",
              overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              maxHeight: "580px", display: "flex", flexDirection: "column"
            }}>
              <div style={{ padding: "16px 18px", background: "#f8fafc", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#1a1a2e" }}>📋 Live Form Preview</div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Automatic fill ho raha hai</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
                {allFields.map(f => (
                  <div key={f.key} style={{
                    padding: "10px 12px", marginBottom: "8px", borderRadius: "10px",
                    background: f.value ? "#f0fdf4" : "#f8fafc",
                    border: `1.5px solid ${f.value ? "#86efac" : "#f0f0f0"}`,
                    transition: "all 0.4s"
                  }}>
                    <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>{f.label}</div>
                    {f.value ? (
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "#16a34a", fontSize: "12px" }}>✓</span>
                        {f.value}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#ccc", fontStyle: "italic" }}>
                        {stage === `ask_${f.key}` || (f.key === "medicines" && stage === "ask_medicines") ? "🎤 Sun rahi hoon..." : "Abhi nahi..."}
                      </div>
                    )}
                  </div>
                ))}

                {(collected.prescription.medicines?.length || 0) > 0 && (
                  <div style={{ marginTop: "4px" }}>
                    {collected.prescription.medicines!.map((m, i) => (
                      <div key={i} style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "8px", padding: "8px 12px", marginBottom: "6px", fontSize: "12px" }}>
                        <span style={{ fontWeight: "700", color: "#1e40af" }}>{m.medicine}</span>
                        {m.dosage && <span style={{ color: "#555" }}> · {m.dosage}</span>}
                        {m.frequency && <span style={{ color: "#555" }}> · {m.frequency}</span>}
                        {m.duration && <span style={{ color: "#555" }}> · {m.duration}</span>}
                        {m.instructions && <span style={{ color: "#888" }}> ({m.instructions})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Chat ── */}
            <div style={{
              width: "340px", background: "white", borderRadius: "20px",
              height: "580px", display: "flex", flexDirection: "column",
              overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.2)"
            }}>
              {/* Header */}
              <div style={{
                background: "linear-gradient(135deg, #0f4c81, #1e3a5f)",
                padding: "16px 18px", color: "white"
              }}>
                <button onClick={handleClose} style={{
                  float: "right", background: "rgba(255,255,255,0.15)", border: "none",
                  color: "white", borderRadius: "50%", width: "26px", height: "26px",
                  cursor: "pointer", fontSize: "13px"
                }}>✕</button>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                    boxShadow: isSpeaking ? "0 0 0 5px rgba(255,255,255,0.2)" : "none",
                    transition: "box-shadow 0.3s"
                  }}>👩‍⚕️</div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "15px" }}>Maya</div>
                    <div style={{ fontSize: "11px", opacity: 0.75 }}>
                      {isSpeaking ? "🔊 Bol rahi hoon..." : isListening ? "🎤 Sun rahi hoon..." : stage === "thinking" ? "🤔 Samajh rahi hoon..." : "AI Assistant"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px" }}>
                    <div style={{ height: "100%", background: "white", borderRadius: "2px", width: `${progressPct}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>
                    {currentStep >= 0 ? `Step ${currentStep + 1} of ${stageOrder.length}` : stage === "done" ? "Complete!" : ""}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "8px", background: "#f8fafc" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "assistant" ? "flex-start" : "flex-end" }}>
                    <div style={{
                      maxWidth: "85%",
                      background: msg.role === "assistant" ? "white" : "#0f4c81",
                      color: msg.role === "assistant" ? "#1a1a2e" : "white",
                      padding: "9px 13px",
                      borderRadius: msg.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                      fontSize: "13px", lineHeight: "1.5",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.07)"
                    }}>
                      {msg.text}
                      <div style={{ fontSize: "9px", opacity: 0.45, marginTop: "3px", textAlign: "right" }}>{msg.time}</div>
                    </div>
                    {msg.fieldFilled && <FieldFillBadge field={msg.fieldFilled} />}
                  </div>
                ))}

                {stage === "thinking" && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: "white", padding: "10px 14px", borderRadius: "4px 14px 14px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0f4c81", animation: `dotBounce 1s ${i*0.2}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Live transcript */}
              {isListening && (
                <div style={{ padding: "8px 14px", background: "#fff5f5", borderTop: "1px solid #fee2e2", fontSize: "12px", color: "#555", minHeight: "34px", display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#dc2626", display: "inline-block", animation: "blink 1s infinite", flexShrink: 0 }} />
                  <span style={{ fontStyle: interimText ? "normal" : "italic", color: interimText ? "#1a1a2e" : "#aaa" }}>
                    {interimText || "Bol sakte hain..."}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", color: isListening ? "#dc2626" : isSpeaking ? "#7c3aed" : "#888", fontWeight: "500" }}>
                  {stageLabel[stage]}
                </div>
                <button onClick={() => { recognitionRef.current?.stop(); synthRef.current?.cancel(); startConversation(); }}
                  style={{ background: "#f0f4f8", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: "600", color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                  🔄 Restart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </>
  );
}
