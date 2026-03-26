"use client";
import { useState, useEffect } from "react";

const PIN_KEY        = "emr_pin_hash";
const LOCK_TIME_KEY  = "emr_lock_time";
const FAIL_KEY       = "emr_pin_fails";
const LOCKOUT_KEY    = "emr_pin_lockout";
const AUTO_LOCK_SECS = 5 * 60;
const MAX_FAILS      = 5;
const LOCKOUT_MINS   = 10;

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36) + pin.length;
}

type Mode = "none" | "setup" | "locked";

export default function PinLock({ children }: { children: React.ReactNode }) {
  const [mode, setMode]             = useState<Mode>("none");
  const [pin, setPin]               = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep]             = useState<"enter" | "confirm">("enter");
  const [error, setError]           = useState("");
  const [shake, setShake]           = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [fails, setFails]           = useState(0);
  const [unlockPin, setUnlockPin]   = useState("");
  const [tmpPin, setTmpPin]         = useState("");
  // Forgot PIN flow
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    // ── Only show PIN if user is already logged in ──
    const user = localStorage.getItem("clinic_user");
    if (!user) return; // not logged in → skip PIN, let login page handle it

    const storedPin = localStorage.getItem(PIN_KEY);
    if (!storedPin) { setMode("setup"); return; }
    if (storedPin === "SKIP") return;
    const lockout = localStorage.getItem(LOCKOUT_KEY);
    if (lockout && Date.now() < parseInt(lockout)) {
      setLockedUntil(parseInt(lockout));
      setMode("locked"); return;
    }
    const lockTime = localStorage.getItem(LOCK_TIME_KEY);
    if (lockTime) {
      const elapsed = (Date.now() - parseInt(lockTime)) / 1000;
      if (elapsed > AUTO_LOCK_SECS) { setMode("locked"); }
    }
    localStorage.removeItem(LOCK_TIME_KEY);
    const savedFails = parseInt(localStorage.getItem(FAIL_KEY) || "0");
    setFails(savedFails);
  }, []);

  useEffect(() => {
    function onVis() {
      const user = localStorage.getItem("clinic_user");
      if (!user) return; // not logged in — skip
      const storedPin = localStorage.getItem(PIN_KEY);
      if (!storedPin || storedPin === "SKIP") return;
      if (document.hidden) {
        localStorage.setItem(LOCK_TIME_KEY, Date.now().toString());
      } else {
        const lockout = localStorage.getItem(LOCKOUT_KEY);
        if (lockout && Date.now() < parseInt(lockout)) {
          setLockedUntil(parseInt(lockout)); setMode("locked"); return;
        }
        const lockTime = localStorage.getItem(LOCK_TIME_KEY);
        if (lockTime) {
          const elapsed = (Date.now() - parseInt(lockTime)) / 1000;
          if (elapsed > AUTO_LOCK_SECS) { setMode("locked"); setUnlockPin(""); setError(""); }
        }
        localStorage.removeItem(LOCK_TIME_KEY);
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.setItem(FAIL_KEY, "0");
        setFails(0); setError("");
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 500); }

  // Verify login password then allow PIN reset
  function verifyAndReset() {
    if (!forgotPassword.trim()) { setForgotError("Please enter your password"); return; }
    try {
      const userJson = localStorage.getItem("clinic_user");
      if (!userJson) { setForgotError("Session expired. Please login again."); return; }
      const user = JSON.parse(userJson);
      // Check against hardcoded users (same as login page)
      const USERS = [
        { email: "doctor@clinic.com", password: "doctor123" },
        { email: "staff@clinic.com",  password: "staff123"  },
      ];
      const match = USERS.find(u => u.email === user.email && u.password === forgotPassword);
      if (match) {
        // Password correct — reset PIN and go to setup
        localStorage.removeItem(PIN_KEY);
        localStorage.removeItem(FAIL_KEY);
        localStorage.removeItem(LOCKOUT_KEY);
        setShowForgot(false);
        setForgotPassword("");
        setForgotError("");
        setMode("setup");
        setStep("enter");
        setPin(""); setConfirmPin(""); setUnlockPin("");
        setError(""); setFails(0); setLockedUntil(null);
      } else {
        setForgotError("Wrong password. Try again.");
      }
    } catch {
      setForgotError("Something went wrong. Try again.");
    }
  }

  function handleSetupDigit(d: string) {
    if (step === "enter") {
      const next = pin + d;
      setPin(next); setError("");
      if (next.length === 4) {
        setTmpPin(next);
        setTimeout(() => { setStep("confirm"); setPin(""); }, 250);
      }
    } else {
      const next = confirmPin + d;
      setConfirmPin(next); setError("");
      if (next.length === 4) {
        setTimeout(() => {
          if (next === tmpPin) {
            localStorage.setItem(PIN_KEY, hashPin(next));
            localStorage.setItem(FAIL_KEY, "0");
            setMode("none");
          } else {
            setError("PINs don't match. Try again.");
            triggerShake();
            setConfirmPin(""); setStep("enter"); setPin(""); setTmpPin("");
          }
        }, 250);
      }
    }
  }

  function handleUnlockDigit(d: string) {
    if (lockedUntil && Date.now() < lockedUntil) return;
    const next = unlockPin + d;
    setUnlockPin(next); setError("");
    if (next.length === 4) {
      setTimeout(() => {
        const stored = localStorage.getItem(PIN_KEY);
        if (stored && stored === hashPin(next)) {
          localStorage.setItem(FAIL_KEY, "0");
          localStorage.removeItem(LOCKOUT_KEY);
          setMode("none"); setUnlockPin(""); setFails(0);
        } else {
          const newFails = fails + 1;
          setFails(newFails);
          localStorage.setItem(FAIL_KEY, newFails.toString());
          triggerShake(); setUnlockPin("");
          if (newFails >= MAX_FAILS) {
            const until = Date.now() + LOCKOUT_MINS * 60 * 1000;
            localStorage.setItem(LOCKOUT_KEY, until.toString());
            setLockedUntil(until);
            setError(`Too many attempts. Locked for ${LOCKOUT_MINS} minutes.`);
          } else {
            setError(`Wrong PIN. ${MAX_FAILS - newFails} attempt${MAX_FAILS - newFails === 1 ? "" : "s"} left.`);
          }
        }
      }, 250);
    }
  }

  const currentPin = mode === "setup" ? (step === "enter" ? pin : confirmPin) : unlockPin;
  const remainingMins = lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 60000) : 0;

  if (mode === "none") return <>{children}</>;

  return (
    <>
      <style>{`
        @keyframes pinShake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
        }
        @keyframes pinFadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        .pin-btn:active { transform: scale(0.92) !important; }
        .pin-wrap {
          width: 100%;
          max-width: 300px;
          animation: pinFadeIn 0.3s ease;
          padding: 0 4px;
          box-sizing: border-box;
        }
        .pin-numpad {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
        }
        .pin-numpad-btn {
          height: 48px;
          border-radius: 12px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.1s;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .pin-numpad-btn.del {
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.12);
          color: #f87171;
        }
        /* Compact for mobile screens */
        @media (max-height: 780px) {
          .pin-header { margin-bottom: 16px !important; }
          .pin-icon { width: 50px !important; height: 50px !important; font-size: 22px !important; margin-bottom: 10px !important; }
          .pin-title { font-size: 17px !important; }
          .pin-subtitle { font-size: 11px !important; }
          .pin-dots-row { gap: 14px !important; margin-bottom: 4px !important; }
          .pin-error { margin-bottom: 10px !important; }
          .pin-numpad { gap: 7px !important; }
          .pin-numpad-btn { height: 48px !important; font-size: 20px !important; }
        }
        @media (max-height: 650px) {
          .pin-icon { width: 42px !important; height: 42px !important; font-size: 18px !important; }
          .pin-numpad-btn { height: 42px !important; font-size: 18px !important; }
          .pin-numpad { gap: 5px !important; }
        }
      `}</style>

      <div style={{
        position:"fixed", inset:0, zIndex:99999,
        background:"linear-gradient(160deg,#060d1a 0%,#0f1f3d 60%,#060d1a 100%)",
        display:"grid",
        gridTemplateRows:"1fr auto 1fr",
        alignItems:"center",
        justifyItems:"center",
        fontFamily:"'Outfit',-apple-system,sans-serif",
        padding:"0 16px",
        boxSizing:"border-box",
      }}>
        {/* Top empty row */}
        <div/>

        {/* PIN card — sits in middle row */}
        <div className="pin-wrap">

          {/* Icon + Title */}
          <div className="pin-header" style={{ textAlign:"center", marginBottom:"20px" }}>
            <div className="pin-icon" style={{
              width:"52px", height:"52px", borderRadius:"16px",
              background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"24px", margin:"0 auto 10px",
              boxShadow:"0 8px 24px rgba(59,130,246,0.4)",
            }}>{mode === "setup" ? "🔐" : "🔒"}</div>
            <div className="pin-title" style={{ fontSize:"18px", fontWeight:"800", color:"white", marginBottom:"4px" }}>
              {mode === "setup" ? (step === "enter" ? "Set PIN" : "Confirm PIN") : "App Locked"}
            </div>
            <div style={{ fontSize:"12px", color:"#64748b", lineHeight:1.5, padding:"0 8px" }}>
              {mode === "setup"
                ? (step === "enter" ? "Choose a 4-digit PIN to protect patient data" : "Enter PIN again to confirm")
                : lockedUntil
                  ? `Too many attempts. Try again in ${remainingMins} min.`
                  : "Enter your PIN to continue"}
            </div>
          </div>

          {/* PIN dots */}
          <div className="pin-dots-row" style={{
            display:"flex", justifyContent:"center", gap:"16px", marginBottom:"6px",
            animation: shake ? "pinShake 0.5s ease" : "none",
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width:"14px", height:"14px", borderRadius:"50%",
                background: currentPin.length > i ? "#3b82f6" : "rgba(255,255,255,0.08)",
                border:`2px solid ${currentPin.length > i ? "#3b82f6" : "rgba(255,255,255,0.15)"}`,
                transition:"all 0.15s",
                transform: currentPin.length === i + 1 ? "scale(1.35)" : "scale(1)",
                boxShadow: currentPin.length > i ? "0 0 10px rgba(59,130,246,0.6)" : "none",
              }}/>
            ))}
          </div>

          {/* Error */}
          <div className="pin-error" style={{ textAlign:"center", fontSize:"12px", color:"#f87171", minHeight:"20px", marginBottom:"10px", fontWeight:"600" }}>
            {error}
          </div>

          {/* Numpad */}
          <div className="pin-numpad" style={{
            opacity: lockedUntil ? 0.35 : 1,
            pointerEvents: lockedUntil ? "none" : "auto",
          }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => {
              if (d === "") return <div key={i}/>;
              const isDel = d === "⌫";
              return (
                <button key={i} className={`pin-btn pin-numpad-btn${isDel ? " del" : ""}`}
                  onClick={() => {
                    if (isDel) {
                      if (mode === "setup") {
                        if (step === "enter") setPin(p => p.slice(0, -1));
                        else setConfirmPin(p => p.slice(0, -1));
                      } else {
                        setUnlockPin(p => p.slice(0, -1));
                      }
                    } else {
                      mode === "setup" ? handleSetupDigit(String(d)) : handleUnlockDigit(String(d));
                    }
                  }}>
                  {d}
                </button>
              );
            })}
          </div>

          {/* Forgot PIN — only on lock screen */}
          {mode === "locked" && !lockedUntil && (
            <div style={{ textAlign:"center", marginTop:"18px" }}>
              <button onClick={() => { setShowForgot(true); setForgotError(""); setForgotPassword(""); }}
                style={{ background:"none", border:"none", color:"#475569", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>
                Forgot PIN? Reset
              </button>
            </div>
          )}

          {/* Forgot PIN — Password Verification Modal */}
          {showForgot && (
            <div style={{
              position:"fixed", inset:0, zIndex:100000,
              background:"rgba(0,0,0,0.8)",
              display:"flex", alignItems:"center", justifyContent:"center",
              padding:"24px",
            }}>
              <div style={{
                background:"#0f1f3d", borderRadius:"16px",
                padding:"28px 24px", width:"100%", maxWidth:"300px",
                border:"1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ textAlign:"center", marginBottom:"20px" }}>
                  <div style={{ fontSize:"32px", marginBottom:"8px" }}>🔑</div>
                  <div style={{ color:"white", fontWeight:"800", fontSize:"16px", marginBottom:"4px" }}>Verify Identity</div>
                  <div style={{ color:"#64748b", fontSize:"12px" }}>Enter your login password to reset PIN</div>
                </div>

                <input
                  type="password"
                  value={forgotPassword}
                  onChange={e => { setForgotPassword(e.target.value); setForgotError(""); }}
                  placeholder="Enter your password"
                  autoFocus
                  style={{
                    width:"100%", padding:"12px 14px",
                    background:"rgba(255,255,255,0.06)",
                    border:`1.5px solid ${forgotError ? "#f87171" : "rgba(255,255,255,0.12)"}`,
                    borderRadius:"10px", color:"white",
                    fontSize:"14px", fontFamily:"inherit",
                    outline:"none", boxSizing:"border-box",
                    marginBottom:"8px",
                  }}
                  onKeyDown={e => { if (e.key === "Enter") verifyAndReset(); }}
                />

                {forgotError && (
                  <div style={{ color:"#f87171", fontSize:"12px", marginBottom:"10px", textAlign:"center" }}>
                    {forgotError}
                  </div>
                )}

                <button onClick={verifyAndReset}
                  style={{
                    width:"100%", background:"#1d4ed8", color:"white",
                    border:"none", padding:"12px", borderRadius:"10px",
                    fontSize:"14px", fontWeight:"700", cursor:"pointer",
                    fontFamily:"inherit", marginBottom:"10px",
                  }}>
                  Verify & Reset PIN
                </button>
                <button onClick={() => { setShowForgot(false); setForgotPassword(""); setForgotError(""); }}
                  style={{
                    width:"100%", background:"rgba(255,255,255,0.05)", color:"#94a3b8",
                    border:"1px solid rgba(255,255,255,0.08)", padding:"10px",
                    borderRadius:"10px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit",
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer — third grid row, bottom */}
        <div style={{ textAlign:"center", padding:"16px 0", alignSelf:"end", paddingBottom:"20px" }}>
          <div style={{ fontSize:"11px", color:"#1e3a5f", fontWeight:"600", marginBottom:"3px" }}>
            ⚡ Powered by <span style={{ color:"#2563eb" }}>Nxt Gen AI Labs</span>
          </div>
          <div style={{ fontSize:"10px", color:"#1a2f4a" }}>
            Facing Troubles? Call{" "}
            <a href="tel:9098779146" style={{ color:"#2563eb", textDecoration:"none", fontWeight:"700" }}>
              9098779146
            </a>
          </div>
        </div>

      </div>
    </>
  );
}