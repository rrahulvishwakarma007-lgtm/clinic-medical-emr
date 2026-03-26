"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";
import hospitalConfig from "@/config/hospital";
import VoiceAssistant from "@/components/VoiceAssistant";
import VoiceDiagnosis from "@/components/VoiceDiagnosis";
import PinLock from "@/components/PinLock";
import OfflineBanner from "@/components/OfflineBanner";

// Pages that don't need auth or sidebar
const PUBLIC_PATHS = ["/login", "/welcome", "/print-preview", "/opd-token"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(p => pathname?.startsWith(p));

    if (isPublic) {
      // Public page — no auth needed, just render
      setChecked(true);
      return;
    }

    // Protected page — check login
    const user = localStorage.getItem("clinic_user");
    if (!user) {
      router.replace("/login");
      return;
    }

    setIsAuthed(true);
    setChecked(true);

    function checkMobile() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setOpen(!mobile);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [pathname]);

  // Still checking auth — show spinner briefly
  if (!checked) return (
    <div style={{ minHeight:"100vh", background:"#060d1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"36px", height:"36px", border:"3px solid #1e3a5f", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Public page — render without sidebar or PIN
  const isPublic = PUBLIC_PATHS.some(p => pathname?.startsWith(p));
  if (isPublic) return <>{children}</>;

  // Authed — render full app with sidebar + PIN lock
  return (
    <PinLock>
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f8", position: "relative" }}>

      {/* Overlay — mobile only, closes sidebar when tapping outside */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 150, touchAction: "none",
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: "220px",
        minWidth: "220px",
        background: "#1a202c",
        display: "flex",
        flexDirection: "column",
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 200,
        transform: open ? "translateX(0)" : "translateX(-220px)",
        transition: "transform 0.25s ease",
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "white", lineHeight: 1.3 }}>{hospitalConfig.name}</div>
            <div style={{ fontSize: "10px", color: "#718096", marginTop: "2px" }}>{hospitalConfig.tagline}</div>
          </div>
          {/* Close button — mobile only */}
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.08)", border: "none", color: "white",
                width: "28px", height: "28px", borderRadius: "6px", cursor: "pointer",
                fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >✕</button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <SidebarNav onNavigate={() => isMobile && setOpen(false)} />
        </div>
      </aside>

      {/* Main area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        marginLeft: isMobile ? 0 : (open ? "0px" : "-220px"),
        transition: "margin-left 0.25s ease",
        width: "100%",
      }}>
        {/* Top bar */}
        <div style={{
          height: "52px",
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          paddingLeft: "12px",
          paddingRight: "12px",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 99,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {/* Hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px", borderRadius: "8px",
              display: "flex", flexDirection: "column", gap: "4px",
              flexShrink: 0,
            }}
          >
            <span style={{ display: "block", width: "20px", height: "2px", background: "#4a5568", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: "#4a5568", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "20px", height: "2px", background: "#4a5568", borderRadius: "2px" }} />
          </button>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {hospitalConfig.name}
          </span>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant />

      {/* Voice Diagnosis */}
      <VoiceDiagnosis />

      {/* Offline Banner */}
      <OfflineBanner />
    </div>
    </PinLock>
  );
}