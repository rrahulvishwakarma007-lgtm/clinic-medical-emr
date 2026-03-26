"use client";
import { useState, useEffect, useRef } from "react";

interface CallButtonProps {
  phone: string;
  patientName?: string;
  size?: "sm" | "md";
}

export default function CallButton({ phone, patientName, size = "sm" }: CallButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect mobile/tablet — covers Android APK (Capacitor) + mobile browsers
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || window.innerWidth < 768;
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    }
    if (showPopup) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPopup]);

  function handleCopy() {
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const cleanPhone = phone.replace(/\s+/g, "");

  const btnStyle: React.CSSProperties = {
    padding: size === "sm" ? "5px 10px" : "10px 16px",
    borderRadius: size === "sm" ? "6px" : "10px",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1.5px solid #bbf7d0",
    fontSize: size === "sm" ? "11px" : "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.15s",
    position: "relative" as const,
  };

  // ── MOBILE: direct tel: link, opens dialer immediately ──
  if (isMobile) {
    return (
      <a href={`tel:${cleanPhone}`} style={btnStyle}>
        📞 Call
      </a>
    );
  }

  // ── DESKTOP: show popup with number + copy button ──
  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={popupRef}>
      <button
        style={btnStyle}
        onClick={() => setShowPopup(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.borderColor = "#86efac"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#bbf7d0"; }}
      >
        📞 Call
      </button>

      {showPopup && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "white",
          border: "1.5px solid #e2e8f0",
          borderRadius: "12px",
          padding: "14px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          zIndex: 9999,
          minWidth: "200px",
          animation: "callpop 0.15s ease",
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: "-7px", left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: "12px", height: "12px",
            background: "white",
            border: "1.5px solid #e2e8f0",
            borderTop: "none", borderLeft: "none",
          }} />

          {/* Title */}
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            📞 Call Patient
          </div>

          {/* Patient name */}
          {patientName && (
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
              {patientName}
            </div>
          )}

          {/* Phone number — large and readable */}
          <div style={{
            fontSize: "20px", fontWeight: 800, color: "#0f172a",
            letterSpacing: "1px", marginBottom: "12px",
            fontFamily: "monospace",
          }}>
            {phone}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, padding: "8px 10px", borderRadius: "8px",
                background: copied ? "#f0fdf4" : "#f8fafc",
                color: copied ? "#15803d" : "#475569",
                border: `1.5px solid ${copied ? "#bbf7d0" : "#e2e8f0"}`,
                fontSize: "12px", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
            <a
              href={`tel:${cleanPhone}`}
              style={{
                flex: 1, padding: "8px 10px", borderRadius: "8px",
                background: "#0f4c81", color: "white",
                border: "none", fontSize: "12px", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                textDecoration: "none", display: "flex",
                alignItems: "center", justifyContent: "center", gap: "4px",
              }}
              title="Opens your default calling app"
            >
              📞 Dial
            </a>
          </div>

          {/* Hint */}
          <div style={{ fontSize: "10px", color: "#b0bec5", marginTop: "8px", textAlign: "center" }}>
            Dial opens your default calling app
          </div>
        </div>
      )}

      <style>{`
        @keyframes callpop {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}