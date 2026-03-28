"use client";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
// app/opd/page.tsx  — Doctor's OPD Queue Management
import { useState, useEffect } from "react";
import hospitalConfig from "@/config/hospital";

interface QueueEntry {
  id: string;
  token: number;
  name: string;
  joinedAt: string;
  status: "waiting" | "called" | "done";
}

export default function OpdPage() {
  const [queue, setQueue]               = useState<QueueEntry[]>([]);
  const [currentServing, setCurrentServing] = useState(0);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [totalToday, setTotalToday]     = useState(0);
  const [loading, setLoading]           = useState(false);
  const [showQR, setShowQR]             = useState(false);
  const [qrUrl, setQrUrl]               = useState("");
  const [announcementOn, setAnnouncementOn] = useState(true);
  const [announcing, setAnnouncing]     = useState(false);
  const [lastAnnounced, setLastAnnounced] = useState("");

  useEffect(() => {
    // Build QR URL — points to patient page
    const base = window.location.origin;
    setQrUrl(`${base}/opd-token`);
    loadQueue();
    // Poll every 5 seconds
    const t = setInterval(loadQueue, 5000);
    return () => clearInterval(t);
  }, []);

  async function loadQueue() {
    try {
      const res = await fetch("/api/opd-queue");
      const data = await res.json();
      setQueue(data.queue || []);
      setCurrentServing(data.currentServing || 0);
      setTotalWaiting(data.totalWaiting || 0);
      setTotalToday(data.totalToday || 0);
    } catch {}
  }

  async function callNext() {
    setLoading(true);
    try {
      const res = await fetch("/api/opd-queue", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"call_next" }),
      });
      const data = await res.json();
      await loadQueue();
      // Announce the called patient
      if (data.called) {
        // Small delay so voices load
        setTimeout(() => announce(data.called.token, data.called.name), 300);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function markDone(id: string) {
    try {
      await fetch("/api/opd-queue", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"mark_done", id }),
      });
      await loadQueue();
    } catch {}
  }

  async function resetQueue() {
    if (!confirm("Reset entire queue? This cannot be undone.")) return;
    await fetch("/api/opd-queue", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"reset" }),
    });
    await loadQueue();
  }

  // ── Voice Announcement ──────────────────────────────────────
  function playChime(token: number, name: string) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const times = [0, 0.3, 0.6];
      const freqs = [523, 659, 784]; // C-E-G chord
      times.forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freqs[i];
        osc.type = "sine";
        gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + t + 0.5);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.5);
      });
    } catch {}
    setAnnouncing(false);
  }

  async function announce(token: number, name: string) {
    if (!announcementOn) return;
    setAnnouncing(true);
    const hindiText = `टोकन नंबर ${token}। ${name}। कृपया डॉक्टर के कमरे में आएं।`;
    const englishText = `Token number ${token}. ${name}. Please come to the doctor room.`;
    setLastAnnounced(`Token #${token} — ${name}`);
    try {
      await TextToSpeech.speak({ text: hindiText, lang: "hi-IN", rate: 0.85, pitch: 1.0, volume: 1.0, category: "ambient" });
      setAnnouncing(false); return;
    } catch (e) {
      try {
        await TextToSpeech.speak({ text: englishText, lang: "en-IN", rate: 0.85, pitch: 1.0, volume: 1.0, category: "ambient" });
        setAnnouncing(false); return;
      } catch (e2) {}
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v: any) => v.lang.startsWith("hi"));
      const u = new SpeechSynthesisUtterance(hindiVoice ? hindiText : englishText);
      if (hindiVoice) u.voice = hindiVoice;
      u.lang = hindiVoice ? "hi-IN" : "en-IN";
      u.rate = 0.82; u.volume = 1;
      u.onend = () => setAnnouncing(false);
      u.onerror = () => { setAnnouncing(false); playChime(token, name); };
      window.speechSynthesis.speak(u); return;
    }
    playChime(token, name);
  }

  function repeatAnnouncement() {
    if (!lastAnnounced) return;
    const parts = lastAnnounced.replace("Token #", "").split(" — ");
    if (parts.length === 2) announce(parseInt(parts[0]), parts[1]);
  }

  const waiting = queue.filter(q => q.status === "waiting");
  const called  = queue.filter(q => q.status === "called");
  const done    = queue.filter(q => q.status === "done");

  // QR code using Google Charts API — no library needed
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}&color=0f4c81&bgcolor=ffffff&margin=10`;

  return (
    <div style={{ padding:"24px", fontFamily:"'DM Sans',sans-serif", maxWidth:"1000px", margin:"0 auto" }}>
        <style>{`
          @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          .queue-card { animation: fadeIn 0.3s ease; }
        `}</style>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#0d1b2e", margin:0 }}>
              OPD Queue
            </h1>
            <p style={{ color:"#94a3b8", fontSize:"14px", marginTop:"4px" }}>
              {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long" })}
              {" · "}
              <span style={{ color:"#22c55e", fontWeight:"600" }}>● Live</span>
            </p>
          </div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>

            {/* Speaker toggle */}
            <button onClick={() => setAnnouncementOn(a => !a)}
              title={announcementOn ? "Announcements ON — click to turn off" : "Announcements OFF — click to turn on"}
              style={{
                background: announcementOn ? "#f0fdf4" : "#f8fafc",
                color: announcementOn ? "#059669" : "#94a3b8",
                border: `1.5px solid ${announcementOn ? "#bbf7d0" : "#e2e8f0"}`,
                padding:"10px 14px", borderRadius:"10px", fontSize:"14px",
                fontWeight:"700", cursor:"pointer",
                display:"flex", alignItems:"center", gap:"6px",
              }}>
              {announcementOn ? "🔊" : "🔇"}
              <span style={{ fontSize:"12px" }}>{announcementOn ? "ON" : "OFF"}</span>
            </button>

            {/* Repeat last announcement */}
            {lastAnnounced && (
              <button onClick={repeatAnnouncement}
                title={`Repeat: ${lastAnnounced}`}
                style={{
                  background: announcing ? "#fffbeb" : "#f8fafc",
                  color: announcing ? "#d97706" : "#64748b",
                  border:`1.5px solid ${announcing ? "#fde68a" : "#e2e8f0"}`,
                  padding:"10px 14px", borderRadius:"10px", fontSize:"13px",
                  fontWeight:"700", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:"6px",
                }}>
                {announcing ? "📢 Announcing..." : "🔁 Repeat"}
              </button>
            )}

            <button onClick={() => setShowQR(true)}
              style={{ background:"#0f4c81", color:"white", border:"none", padding:"10px 18px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
              📱 Show QR Code
            </button>
            <button onClick={callNext} disabled={loading || totalWaiting === 0}
              style={{ background: totalWaiting === 0 ? "#e2e8f0" : "linear-gradient(135deg,#059669,#10b981)", color: totalWaiting === 0 ? "#94a3b8" : "white", border:"none", padding:"10px 18px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor: totalWaiting === 0 ? "not-allowed" : "pointer" }}>
              🔔 Call Next
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:"12px", marginBottom:"24px" }}>
          {[
            { label:"Now Serving", value: currentServing || "—", color:"#059669", bg:"#f0fdf4", icon:"🔔" },
            { label:"Waiting",     value: totalWaiting,           color:"#d97706", bg:"#fffbeb", icon:"⏳" },
            { label:"Done Today",  value: done.length,            color:"#0f4c81", bg:"#eff6ff", icon:"✅" },
            { label:"Total Today", value: totalToday,             color:"#6d28d9", bg:"#f5f3ff", icon:"👥" },
          ].map((s, i) => (
            <div key={i} style={{ background:s.bg, borderRadius:"14px", padding:"16px", border:`1px solid ${s.color}20` }}>
              <div style={{ fontSize:"22px", marginBottom:"6px" }}>{s.icon}</div>
              <div style={{ fontSize:"28px", fontWeight:"800", color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:"#64748b", fontWeight:"600" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Currently Called */}
        {called.length > 0 && (
          <div style={{ background:"linear-gradient(135deg,#059669,#10b981)", borderRadius:"16px", padding:"20px 24px", marginBottom:"20px", color:"white", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ fontSize:"40px" }}>🔔</div>
              <div>
                <div style={{ fontSize:"12px", opacity:0.8, fontWeight:"600", textTransform:"uppercase", letterSpacing:"1px" }}>Now Calling</div>
                <div style={{ fontSize:"24px", fontWeight:"800" }}>Token #{called[0].token} — {called[0].name}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" as const }}>
              <button onClick={() => announce(called[0].token, called[0].name)}
                style={{ background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", color:"white", padding:"10px 16px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>
                📢 Announce Again
              </button>
              <button onClick={() => markDone(called[0].id)}
                style={{ background:"rgba(255,255,255,0.2)", border:"2px solid rgba(255,255,255,0.4)", color:"white", padding:"10px 20px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>
                ✅ Mark Done
              </button>
            </div>
          </div>
        )}

        {/* Waiting Queue */}
        <div style={{ background:"white", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <div style={{ fontWeight:"700", fontSize:"16px", color:"#0d1b2e" }}>
              ⏳ Waiting ({waiting.length})
            </div>
          </div>

          {waiting.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px", color:"#94a3b8" }}>
              <div style={{ fontSize:"40px", marginBottom:"8px" }}>🎉</div>
              <div style={{ fontWeight:"600" }}>Queue is empty!</div>
              <div style={{ fontSize:"13px", marginTop:"4px" }}>Show QR code to patients to join</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {waiting.map((p, i) => (
                <div key={p.id} className="queue-card" style={{
                  display:"flex", alignItems:"center", gap:"14px",
                  padding:"12px 16px", borderRadius:"12px",
                  background: i === 0 ? "#f0fdf4" : "#f8fafc",
                  border: i === 0 ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                }}>
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"10px",
                    background: i === 0 ? "#059669" : "#e2e8f0",
                    color: i === 0 ? "white" : "#64748b",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:"800", fontSize:"16px", flexShrink:0,
                  }}>
                    {p.token}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:"700", color:"#0d1b2e", fontSize:"15px" }}>{p.name}</div>
                    <div style={{ fontSize:"11px", color:"#94a3b8", marginTop:"1px" }}>
                      Joined {new Date(p.joinedAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                      {i === 0 && <span style={{ color:"#059669", fontWeight:"700", marginLeft:"8px" }}>← Next up</span>}
                    </div>
                  </div>
                  {i === 0 && (
                    <button onClick={callNext} disabled={loading}
                      style={{ background:"#059669", color:"white", border:"none", padding:"8px 14px", borderRadius:"8px", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>
                      Call
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Done section */}
        {done.length > 0 && (
          <div style={{ background:"white", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:"20px" }}>
            <div style={{ fontWeight:"700", fontSize:"16px", color:"#0d1b2e", marginBottom:"12px" }}>
              ✅ Completed ({done.length})
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {done.map(p => (
                <div key={p.id} style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"8px", padding:"6px 12px", fontSize:"13px", color:"#059669", fontWeight:"600" }}>
                  #{p.token} {p.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset button */}
        {totalToday > 0 && (
          <div style={{ textAlign:"center" }}>
            <button onClick={resetQueue}
              style={{ background:"none", border:"1px solid #e2e8f0", color:"#94a3b8", padding:"8px 20px", borderRadius:"8px", fontSize:"13px", cursor:"pointer" }}>
              🔄 Reset Queue for New Day
            </button>
          </div>
        )}

        {/* QR Modal */}
        {showQR && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}
            onClick={() => setShowQR(false)}>
            <div style={{ background:"white", borderRadius:"24px", padding:"32px", maxWidth:"340px", width:"100%", textAlign:"center" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:"24px", fontWeight:"800", color:"#0f4c81", marginBottom:"4px" }}>
                📱 Patient QR Code
              </div>
              <div style={{ fontSize:"13px", color:"#64748b", marginBottom:"20px" }}>
                Display this at reception — patients scan to join queue
              </div>

              {/* QR Code image */}
              <div style={{ background:"#f8fafc", borderRadius:"16px", padding:"16px", marginBottom:"16px", display:"inline-block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl} alt="QR Code" width={200} height={200} style={{ display:"block", borderRadius:"8px" }} />
              </div>

              <div style={{ background:"#eff6ff", borderRadius:"12px", padding:"12px 16px", marginBottom:"20px" }}>
                <div style={{ fontSize:"11px", color:"#64748b", marginBottom:"4px" }}>Patient URL:</div>
                <div style={{ fontSize:"12px", color:"#1d4ed8", fontWeight:"700", wordBreak:"break-all" }}>{qrUrl}</div>
              </div>

              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => window.open(qrUrl, "_blank")}
                  style={{ flex:1, background:"#0f4c81", color:"white", border:"none", padding:"12px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>
                  Preview Page
                </button>
                <button onClick={() => setShowQR(false)}
                  style={{ flex:1, background:"#f1f5f9", color:"#475569", border:"none", padding:"12px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}