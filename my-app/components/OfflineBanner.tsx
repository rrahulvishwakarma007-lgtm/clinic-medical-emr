"use client";
import { useOffline } from "@/hooks/useOffline";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const isOffline = useOffline();
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowBackOnline(false);
    } else if (wasOffline) {
      // Just came back online — show "back online" briefly
      setShowBackOnline(true);
      const t = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOffline]);

  if (!isOffline && !showBackOnline) return null;

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0; }
        }
        .offline-banner {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 99999;
          animation: slideDown 0.3s ease;
        }
      `}</style>

      {/* ── OFFLINE banner ── */}
      {isOffline && (
        <div className="offline-banner">
          <div style={{
            background: "linear-gradient(135deg, #92400e, #b45309)",
            color: "white",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>📵</span>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13px" }}>
                  You're Offline
                </div>
                <div style={{ fontSize: "11px", opacity: 0.85 }}>
                  Showing cached data — changes won't be saved until you reconnect
                </div>
              </div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: "700",
              whiteSpace: "nowrap",
            }}>
              📋 Read-only mode
            </div>
          </div>
          {/* Progress bar pulse */}
          <div style={{ height: "3px", background: "rgba(180,83,9,0.3)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
              animation: "shimmer 1.8s infinite",
              width: "60%",
            }} />
          </div>
          <style>{`
            @keyframes shimmer {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(250%); }
            }
          `}</style>
        </div>
      )}

      {/* ── BACK ONLINE banner ── */}
      {showBackOnline && !isOffline && (
        <div className="offline-banner">
          <div style={{
            background: "linear-gradient(135deg, #065f46, #059669)",
            color: "white",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}>
            <span style={{ fontSize: "18px" }}>✅</span>
            <div>
              <div style={{ fontWeight: "700", fontSize: "13px" }}>Back Online!</div>
              <div style={{ fontSize: "11px", opacity: 0.85 }}>
                Data will refresh automatically
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}