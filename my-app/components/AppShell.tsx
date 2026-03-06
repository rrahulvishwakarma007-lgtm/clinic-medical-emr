"use client";
import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import hospitalConfig from "@/config/hospital";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f8" }}>

      {/* Sidebar */}
      <aside style={{
        width: open ? "220px" : "0px",
        minWidth: open ? "220px" : "0px",
        background: "#1a202c",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "white", lineHeight: 1.3 }}>{hospitalConfig.name}</div>
          <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px" }}>{hospitalConfig.tagline}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <SidebarNav />
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar with toggle button */}
        <div style={{ height: "48px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", paddingLeft: "12px", gap: "12px", position: "sticky", top: 0, zIndex: 99, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "4px", transition: "background 0.15s" }}
            title={open ? "Close sidebar" : "Open sidebar"}
            onMouseEnter={e => (e.currentTarget.style.background = "#f0f4f8")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <span style={{ display: "block", width: "18px", height: "2px", background: "#4a5568", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "18px", height: "2px", background: "#4a5568", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "18px", height: "2px", background: "#4a5568", borderRadius: "2px" }} />
          </button>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#4a5568" }}>{hospitalConfig.name}</span>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}