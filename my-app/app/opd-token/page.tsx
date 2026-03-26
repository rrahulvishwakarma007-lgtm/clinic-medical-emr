"use client";
// app/opd-token/page.tsx
// Patient-facing — no login needed
// Token stored in localStorage — persists across phone lock/close/refresh

import { useState, useEffect, useRef } from "react";
import hospitalConfig from "@/config/hospital";

type Stage = "form" | "waiting" | "called" | "done";

const STORAGE_KEY = "opd_my_token";

export default function OpdTokenPage() {
  const [stage, setStage]             = useState<Stage>("form");
  const [name, setName]               = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [tokenId, setTokenId]         = useState("");
  const [tokenNum, setTokenNum]       = useState(0);
  const [waitingAhead, setWaitingAhead] = useState(0);
  const [currentServing, setCurrentServing] = useState(0);
  const [lastUpdated, setLastUpdated] = useState("");
  const [checking, setChecking]       = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── On mount: restore token from localStorage ──────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Check if it's today's token
        const today = new Date().toISOString().split("T")[0];
        if (data.date === today && data.id) {
          setTokenId(data.id);
          setTokenNum(data.token);
          setName(data.name);
          setStage("waiting");
        } else {
          // Old token from previous day — clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
    setChecking(false);
  }, []);

  // ── Poll for updates every 5 seconds when in queue ─────────
  useEffect(() => {
    if (stage !== "waiting" && stage !== "called") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    async function poll() {
      if (!tokenId) return;
      try {
        const res = await fetch(`/api/opd-queue?tokenId=${tokenId}`);
        if (res.status === 404) {
          // Token was deleted (queue reset by doctor)
          localStorage.removeItem(STORAGE_KEY);
          setStage("form");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setWaitingAhead(data.waitingAhead ?? 0);
        setCurrentServing(data.currentServing ?? 0);
        setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" }));

        if (data.status === "called") setStage("called");
        if (data.status === "done") {
          setStage("done");
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {}
    }

    poll(); // immediate
    pollRef.current = setInterval(poll, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [stage, tokenId]);

  async function joinQueue() {
    if (!name.trim()) { setError("Please enter your name"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/opd-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", name: name.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed to join queue"); return; }

      // Save to localStorage — survives phone lock/close
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: data.id,
        token: data.token,
        name: name.trim(),
        date: today,
      }));

      setTokenId(data.id);
      setTokenNum(data.token);
      setWaitingAhead(data.waitingAhead ?? 0);
      setCurrentServing(data.currentServing ?? 0);
      setStage("waiting");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function leaveQueue() {
    if (!confirm("Leave queue? You will lose your token number.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setStage("form");
    setName(""); setTokenId(""); setTokenNum(0);
    setWaitingAhead(0); setCurrentServing(0);
  }

  if (checking) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#060d1a,#0f1f3d)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"36px", height:"36px", border:"3px solid #1e3a5f", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#060d1a 0%,#0f1f3d 60%,#060d1a 100%)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"24px 20px",
      fontFamily:"'Outfit',-apple-system,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}70%{box-shadow:0 0 0 24px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:"28px", animation:"fadeUp 0.4s ease" }}>
        <div style={{ fontSize:"36px", marginBottom:"8px" }}>🏥</div>
        <div style={{ fontSize:"18px", fontWeight:"800", color:"white" }}>{hospitalConfig.name}</div>
        <div style={{ fontSize:"12px", color:"#475569", marginTop:"2px" }}>OPD Queue System</div>
      </div>

      {/* ── FORM ── */}
      {stage === "form" && (
        <div style={{
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:"20px", padding:"28px 24px", width:"100%", maxWidth:"340px",
          animation:"fadeUp 0.4s ease 0.1s both",
        }}>
          <div style={{ textAlign:"center", marginBottom:"20px" }}>
            <div style={{ fontSize:"28px", marginBottom:"6px" }}>🎫</div>
            <div style={{ fontSize:"17px", fontWeight:"800", color:"white", marginBottom:"4px" }}>Get Queue Token</div>
            <div style={{ fontSize:"12px", color:"#64748b" }}>Enter your name to join today's OPD queue</div>
          </div>

          <div style={{ marginBottom:"14px" }}>
            <label style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"7px" }}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && joinQueue()}
              placeholder="Enter your full name"
              autoFocus
              style={{
                width:"100%", padding:"13px 15px",
                background:"rgba(255,255,255,0.06)",
                border:`1.5px solid ${error ? "#f87171" : "rgba(255,255,255,0.12)"}`,
                borderRadius:"12px", color:"white",
                fontSize:"15px", fontFamily:"inherit", outline:"none",
              }}
            />
            {error && <div style={{ color:"#f87171", fontSize:"12px", marginTop:"5px" }}>⚠ {error}</div>}
          </div>

          <button onClick={joinQueue} disabled={loading} style={{
            width:"100%", padding:"14px",
            background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            color:"white", border:"none", borderRadius:"12px",
            fontSize:"15px", fontWeight:"800", cursor: loading ? "not-allowed" : "pointer",
            fontFamily:"inherit",
            boxShadow: loading ? "none" : "0 6px 20px rgba(59,130,246,0.4)",
          }}>
            {loading
              ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                  <span style={{ width:"14px", height:"14px", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }}/>
                  Joining Queue...
                </span>
              : "Join Queue 🎫"}
          </button>
        </div>
      )}

      {/* ── WAITING ── */}
      {stage === "waiting" && (
        <div style={{ width:"100%", maxWidth:"340px", animation:"fadeUp 0.4s ease", display:"flex", flexDirection:"column", gap:"14px" }}>

          {/* Big token number */}
          <div style={{
            background:"linear-gradient(135deg,rgba(29,78,216,0.25),rgba(59,130,246,0.15))",
            border:"1px solid rgba(59,130,246,0.3)",
            borderRadius:"20px", padding:"28px 24px", textAlign:"center",
          }}>
            <div style={{ fontSize:"12px", color:"#93c5fd", fontWeight:"700", textTransform:"uppercase", letterSpacing:"2px", marginBottom:"6px" }}>
              Your Token Number
            </div>
            <div style={{
              fontSize:"88px", fontWeight:"900", color:"white", lineHeight:1,
              animation:"pulse 2.5s ease-in-out infinite",
            }}>
              {tokenNum}
            </div>
            <div style={{ fontSize:"14px", color:"#93c5fd", marginTop:"8px" }}>
              {name} 👋
            </div>
          </div>

          {/* Queue status */}
          <div style={{
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:"16px", padding:"18px 20px",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div style={{ fontSize:"14px", fontWeight:"700", color:"white" }}>Live Queue Status</div>
              <div style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:"#22c55e" }}>
                <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#22c55e", display:"inline-block", animation:"blink 1.5s infinite" }}/>
                Live
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
              {[
                { label:"Patients ahead", value: waitingAhead, icon:"👥", color:"#f59e0b" },
                { label:"Now serving", value: currentServing || "—", icon:"🔔", color:"#22c55e" },
              ].map((s, i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.04)", borderRadius:"12px", padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:"20px", marginBottom:"4px" }}>{s.icon}</div>
                  <div style={{ fontSize:"26px", fontWeight:"800", color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:"11px", color:"#64748b", marginTop:"3px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Status message */}
            <div style={{
              background: waitingAhead === 0 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${waitingAhead === 0 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
              borderRadius:"10px", padding:"10px 14px",
              fontSize:"13px", color: waitingAhead === 0 ? "#22c55e" : "#94a3b8",
              textAlign:"center", fontWeight: waitingAhead === 0 ? "700" : "400",
            }}>
              {waitingAhead === 0
                ? "⚡ You're next! Please be ready."
                : `🕐 ${waitingAhead} patient${waitingAhead === 1 ? "" : "s"} ahead — please wait`}
            </div>

            {lastUpdated && (
              <div style={{ textAlign:"center", fontSize:"10px", color:"#334155", marginTop:"8px" }}>
                Updated at {lastUpdated} • refreshes every 5s
              </div>
            )}
          </div>

          {/* Important notice */}
          <div style={{
            background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.15)",
            borderRadius:"12px", padding:"12px 14px",
            fontSize:"12px", color:"#fbbf24", lineHeight:1.6,
          }}>
            📌 <strong>Your token is saved.</strong> You can close this page and come back — your number will still be here.
          </div>

          {/* Leave queue */}
          <button onClick={leaveQueue} style={{
            background:"none", border:"1px solid rgba(255,255,255,0.08)",
            color:"#475569", padding:"10px", borderRadius:"10px",
            fontSize:"12px", cursor:"pointer", fontFamily:"inherit",
          }}>
            Leave Queue
          </button>
        </div>
      )}

      {/* ── CALLED ── */}
      {stage === "called" && (
        <div style={{ width:"100%", maxWidth:"340px", textAlign:"center", animation:"fadeUp 0.4s ease" }}>
          <div style={{
            background:"rgba(34,197,94,0.1)", border:"2px solid rgba(34,197,94,0.4)",
            borderRadius:"20px", padding:"40px 24px",
            animation:"ringPulse 1.5s ease-in-out infinite",
          }}>
            <div style={{ fontSize:"64px", marginBottom:"14px" }}>🔔</div>
            <div style={{ fontSize:"28px", fontWeight:"900", color:"#22c55e", marginBottom:"6px" }}>
              It's Your Turn!
            </div>
            <div style={{ fontSize:"18px", color:"white", marginBottom:"8px" }}>
              Token <strong style={{ fontSize:"32px" }}>#{tokenNum}</strong>
            </div>
            <div style={{ fontSize:"14px", color:"#94a3b8", lineHeight:1.6 }}>
              Please proceed to the<br/>doctor's room now
            </div>
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {stage === "done" && (
        <div style={{ width:"100%", maxWidth:"340px", textAlign:"center", animation:"fadeUp 0.4s ease" }}>
          <div style={{
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:"20px", padding:"40px 24px",
          }}>
            <div style={{ fontSize:"56px", marginBottom:"14px" }}>✅</div>
            <div style={{ fontSize:"22px", fontWeight:"800", color:"white", marginBottom:"6px" }}>
              Visit Complete
            </div>
            <div style={{ fontSize:"13px", color:"#64748b", marginBottom:"24px", lineHeight:1.6 }}>
              Thank you for visiting<br/>{hospitalConfig.name}
            </div>
            <button onClick={() => { setStage("form"); setName(""); setTokenNum(0); setTokenId(""); }}
              style={{
                background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                color:"white", padding:"12px 24px", borderRadius:"10px",
                fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit",
              }}>
              Get New Token
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:"28px", textAlign:"center" }}>
        <div style={{ fontSize:"11px", color:"#1e3a5f", fontWeight:"600" }}>
          ⚡ Powered by <span style={{ color:"#2563eb" }}>Nxt Gen AI Labs</span>
        </div>
      </div>
    </div>
  );
}