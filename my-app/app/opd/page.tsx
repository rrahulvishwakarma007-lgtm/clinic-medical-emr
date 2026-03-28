"use client";
import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import hospitalConfig from "@/config/hospital";

interface QueueEntry {
  id: string;
  token: number;
  name: string;
  joinedAt: string;
  status: "waiting" | "called" | "done";
}

// ── Universal speak — works in APK + browser ──
async function speakText(text: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.stop();
      await TextToSpeech.speak({
        text,
        lang: "hi-IN",
        rate: 0.85,
        pitch: 1.0,
        volume: 1.0,
      });
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        await new Promise<void>((resolve) => {
          const voices = window.speechSynthesis.getVoices();
          const hindiVoice = voices.find((v) => v.lang.startsWith("hi"));
          const u = new SpeechSynthesisUtterance(text);
          if (hindiVoice) u.voice = hindiVoice;
          u.lang = "hi-IN";
          u.rate = 0.85;
          u.volume = 1.0;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          window.speechSynthesis.speak(u);
        });
      }
    }
  } catch (err) {
    console.error("TTS error:", err);
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-IN";
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      }
    } catch {}
  }
}

export default function OpdPage() {
  const [queue, setQueue]                   = useState<QueueEntry[]>([]);
  const [currentServing, setCurrentServing] = useState(0);
  const [totalWaiting, setTotalWaiting]     = useState(0);
  const [totalToday, setTotalToday]         = useState(0);
  const [loading, setLoading]               = useState(false);
  const [showQR, setShowQR]                 = useState(false);
  const [qrUrl, setQrUrl]                   = useState("");
  const [announcementOn, setAnnouncementOn] = useState(true);
  const [announcing, setAnnouncing]         = useState(false);
  const [lastAnnounced, setLastAnnounced]   = useState("");

  useEffect(() => {
    const base = window.location.origin;
    setQrUrl(`${base}/opd-token`);
    loadQueue();
    const t = setInterval(loadQueue, 5000);
    return () => clearInterval(t);
  }, []);

  async function loadQueue() {
    try {
      const res  = await fetch("/api/opd-queue");
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
      const res  = await fetch("/api/opd-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "call_next" }),
      });
      const data = await res.json();
      await loadQueue();
      if (data.called) {
        setTimeout(() => announce(data.called.token, data.called.name), 300);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function markDone(id: string) {
    try {
      await fetch("/api/opd-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_done", id }),
      });
      await loadQueue();
    } catch {}
  }

  async function resetQueue() {
    if (!confirm("Reset entire queue? This cannot be undone.")) return;
    await fetch("/api/opd-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    await loadQueue();
  }

  async function announce(token: number, name: string) {
    if (!announcementOn) return;
    setAnnouncing(true);
    const hindiText = `टोकन नंबर ${token}। ${name}। कृपया डॉक्टर के कमरे में आएं।`;
    setLastAnnounced(`Token #${token} — ${name}`);
    try {
      await speakText(hindiText);
    } finally {
      setAnnouncing(false);
    }
  }

  function repeatAnnouncement() {
    if (!lastAnnounced) return;
    const parts = lastAnnounced.replace("Token #", "").split(" — ");
    if (parts.length === 2) announce(parseInt(parts[0]), parts[1]);
  }

  const waiting = queue.filter((q) => q.status === "waiting");
  const called  = queue.filter((q) => q.status === "called");
  const done    = queue.filter((q) => q.status === "done");

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}&color=0f4c81&bgcolor=ffffff&margin=10`;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .queue-card { animation: fadeIn 0.3s ease; }
        .opd-wrap { padding: 24px; max-width: 1000px; margin: 0 auto; }
        .opd-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .opd-header h1 { font-family:'Playfair Display',serif; font-size:28px; color:#0d1b2e; margin:0; }
        .opd-header-btns { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .opd-stats { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:12px; margin-bottom:24px; }
        .opd-btn { border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; padding:10px 18px; white-space:nowrap; min-height:44px; display:flex; align-items:center; gap:6px; font-family:inherit; -webkit-tap-highlight-color:transparent; }
        .q-row { display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; }

        @media (max-width: 767px) {
          .opd-wrap { padding: 10px 8px; }
          .opd-header h1 { font-size: 18px; }
          .opd-header-btns { width: 100%; }
          .opd-btn { font-size: 12px; padding: 8px 10px; }
          .opd-stats { grid-template-columns: 1fr 1fr; gap: 8px; }
          .calling-card { flex-direction: column !important; align-items: flex-start !important; }
          .calling-card-btns { width: 100%; display: flex; gap: 8px; }
          .calling-card-btns button { flex: 1; font-size:12px !important; padding:8px !important; }
          .calling-title { font-size: 16px !important; }
        }
        @media (max-width: 360px) {
          .opd-stats { grid-template-columns: 1fr; }
          .opd-btn { font-size: 11px; padding: 8px; }
        }
      `}</style>

      <div className="opd-wrap">

        {/* Header */}
        <div className="opd-header">
          <div>
            <h1>🏥 OPD Queue</h1>
            <p style={{ color:"#94a3b8", fontSize:"14px", marginTop:"4px", margin:0 }}>
              {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long" })}
              {" · "}<span style={{ color:"#22c55e", fontWeight:"600" }}>● Live</span>
            </p>
          </div>
          <div className="opd-header-btns">
            <button className="opd-btn"
              onClick={() => setAnnouncementOn(a => !a)}
              style={{ background: announcementOn ? "#f0fdf4" : "#fef2f2", color: announcementOn ? "#059669" : "#dc2626", border:`1.5px solid ${announcementOn ? "#bbf7d0" : "#fecaca"}` }}>
              {announcementOn ? "🔊 Voice ON" : "🔇 Voice OFF"}
            </button>
            {lastAnnounced && (
              <button className="opd-btn" onClick={repeatAnnouncement} disabled={announcing}
                style={{ background:"#eff6ff", color:"#1d4ed8", border:"1.5px solid #bfdbfe", opacity: announcing ? 0.6 : 1 }}>
                {announcing ? <span style={{ animation:"pulse 1s infinite" }}>📢 Speaking…</span> : "🔁 Repeat"}
              </button>
            )}
            <button className="opd-btn" onClick={() => setShowQR(true)}
              style={{ background:"#eff6ff", color:"#1d4ed8", border:"1.5px solid #bfdbfe" }}>
              📱 QR Code
            </button>
            <button className="opd-btn" onClick={callNext} disabled={loading || totalWaiting === 0}
              style={{ background: totalWaiting === 0 ? "#e2e8f0" : "linear-gradient(135deg,#059669,#10b981)", color: totalWaiting === 0 ? "#94a3b8" : "white", cursor: totalWaiting === 0 ? "not-allowed" : "pointer" }}>
              {loading ? "⏳ Calling…" : "🔔 Call Next"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="opd-stats">
          {[
            { label:"Now Serving", value: currentServing || "—", color:"#059669", bg:"#f0fdf4", icon:"🔔" },
            { label:"Waiting",     value: totalWaiting,           color:"#d97706", bg:"#fffbeb", icon:"⏳" },
            { label:"Done Today",  value: done.length,            color:"#0f4c81", bg:"#eff6ff", icon:"✅" },
            { label:"Total Today", value: totalToday,             color:"#6d28d9", bg:"#f5f3ff", icon:"👥" },
          ].map((s, i) => (
            <div key={i} style={{ background:s.bg, borderRadius:"14px", padding:"16px", border:`1px solid ${s.color}25` }}>
              <div style={{ fontSize:"22px", marginBottom:"6px" }}>{s.icon}</div>
              <div style={{ fontSize:"26px", fontWeight:"800", color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:"#64748b", fontWeight:"600" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Currently Called */}
        {called.length > 0 && (
          <div className="calling-card" style={{ background:"linear-gradient(135deg,#059669,#10b981)", borderRadius:"16px", padding:"20px 24px", marginBottom:"20px", color:"white", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ fontSize:"36px" }}>🔔</div>
              <div>
                <div style={{ fontSize:"11px", opacity:0.8, fontWeight:"600", textTransform:"uppercase", letterSpacing:"1px" }}>Now Calling</div>
                <div className="calling-title" style={{ fontSize:"20px", fontWeight:"800" }}>Token #{called[0].token} — {called[0].name}</div>
              </div>
            </div>
            <div className="calling-card-btns" style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              <button onClick={() => announce(called[0].token, called[0].name)}
                style={{ background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", color:"white", padding:"10px 16px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", minHeight:"44px", whiteSpace:"nowrap" }}>
                📢 Announce Again
              </button>
              <button onClick={() => markDone(called[0].id)}
                style={{ background:"rgba(255,255,255,0.2)", border:"2px solid rgba(255,255,255,0.4)", color:"white", padding:"10px 20px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", minHeight:"44px", whiteSpace:"nowrap" }}>
                ✅ Mark Done
              </button>
            </div>
          </div>
        )}

        {/* Waiting Queue */}
        <div style={{ background:"white", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:"20px" }}>
          <div style={{ fontWeight:"700", fontSize:"16px", color:"#0d1b2e", marginBottom:"16px" }}>⏳ Waiting ({waiting.length})</div>
          {waiting.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px", color:"#94a3b8" }}>
              <div style={{ fontSize:"40px", marginBottom:"8px" }}>🎉</div>
              <div style={{ fontWeight:"600" }}>Queue is empty!</div>
              <div style={{ fontSize:"13px", marginTop:"4px" }}>Show QR code to patients to join</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {waiting.map((p, i) => (
                <div key={p.id} className="queue-card q-row"
                  style={{ background: i === 0 ? "#f0fdf4" : "#f8fafc", border: i === 0 ? "1px solid #bbf7d0" : "1px solid #e2e8f0" }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"10px", background: i === 0 ? "#059669" : "#e2e8f0", color: i === 0 ? "white" : "#64748b", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"16px", flexShrink:0 }}>
                    {p.token}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:"700", color:"#0d1b2e", fontSize:"15px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                    <div style={{ fontSize:"11px", color:"#94a3b8", marginTop:"1px" }}>
                      Joined {new Date(p.joinedAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                      {i === 0 && <span style={{ color:"#059669", fontWeight:"700", marginLeft:"8px" }}>← Next</span>}
                    </div>
                  </div>
                  {i === 0 && (
                    <button onClick={callNext} disabled={loading}
                      style={{ background:"#059669", color:"white", border:"none", padding:"8px 14px", borderRadius:"8px", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", flexShrink:0, minHeight:"38px" }}>
                      Call
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Done */}
        {done.length > 0 && (
          <div style={{ background:"white", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:"20px" }}>
            <div style={{ fontWeight:"700", fontSize:"16px", color:"#0d1b2e", marginBottom:"12px" }}>✅ Completed ({done.length})</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {done.map(p => (
                <div key={p.id} style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"8px", padding:"6px 12px", fontSize:"13px", color:"#059669", fontWeight:"600" }}>
                  #{p.token} {p.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset */}
        {totalToday > 0 && (
          <div style={{ textAlign:"center", paddingBottom:"16px" }}>
            <button onClick={resetQueue}
              style={{ background:"none", border:"1px solid #e2e8f0", color:"#94a3b8", padding:"10px 24px", borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", minHeight:"44px" }}>
              🔄 Reset Queue for New Day
            </button>
          </div>
        )}

        {/* QR Modal */}
        {showQR && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
            onClick={() => setShowQR(false)}>
            <div style={{ background:"white", borderRadius:"24px", padding:"28px 20px", maxWidth:"340px", width:"100%", textAlign:"center" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:"22px", fontWeight:"800", color:"#0f4c81", marginBottom:"4px" }}>📱 Patient QR Code</div>
              <div style={{ fontSize:"13px", color:"#64748b", marginBottom:"20px" }}>Display at reception — patients scan to join queue</div>
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
                  style={{ flex:1, background:"#0f4c81", color:"white", border:"none", padding:"12px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", minHeight:"44px" }}>
                  Preview
                </button>
                <button onClick={() => setShowQR(false)}
                  style={{ flex:1, background:"#f1f5f9", color:"#475569", border:"none", padding:"12px", borderRadius:"10px", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", minHeight:"44px" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}