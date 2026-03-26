"use client";
import { useEffect, useState } from "react";

export default function PrintPreviewPage() {
  const [html, setHtml] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("emr_print_html") || "";
    setHtml(stored);
    setLoaded(true);
  }, []);

  function handlePrint() {
    window.print();
  }

  function showShareOptions() {
    const overlay = document.getElementById("share-overlay");
    if (overlay) overlay.style.display = "flex";
  }

  if (!loaded) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060d1a" }}>
      <div style={{ color:"white", textAlign:"center" }}>
        <div style={{ fontSize:"32px", marginBottom:"12px" }}>📄</div>
        <div>Loading...</div>
      </div>
    </div>
  );

  if (!html) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060d1a", fontFamily:"sans-serif" }}>
      <div style={{ textAlign:"center", padding:"32px" }}>
        <div style={{ fontSize:"48px", marginBottom:"16px" }}>⚠️</div>
        <div style={{ fontWeight:"700", fontSize:"18px", color:"white", marginBottom:"8px" }}>No prescription found</div>
        <div style={{ color:"#94a3b8", marginBottom:"24px" }}>Go back and tap 📄 again</div>
        <button onClick={() => window.history.back()}
          style={{ background:"#1d4ed8", color:"white", border:"none", padding:"12px 24px", borderRadius:"10px", fontSize:"15px", fontWeight:"700", cursor:"pointer" }}>
          ← Go Back
        </button>
      </div>
    </div>
  );

  // Parse HTML to render inline
  const parser = typeof window !== "undefined" ? new DOMParser() : null;
  const doc = parser?.parseFromString(html, "text/html");
  const bodyContent = doc?.body.innerHTML || "";
  const styleContent = Array.from(doc?.querySelectorAll("style") || [])
    .map(s => s.textContent).join("\n");

  return (
    <div style={{ fontFamily:"sans-serif", background:"white", minHeight:"100vh" }}>

      {/* ── Top action bar ── */}
      <div id="action-bar" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:9999,
        background:"#0f4c81", padding:"8px 12px 8px 10px",
        display:"flex", alignItems:"center", gap:"6px",
      }}>
        <button onClick={() => window.history.back()}
          style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 10px", borderRadius:"8px", fontSize:"15px", fontWeight:"700", cursor:"pointer", flexShrink:0 }}>
          ←
        </button>

        <span style={{ color:"white", fontWeight:"700", fontSize:"12px", flex:1, textAlign:"center" }}>
          Prescription
        </span>

        {/* Zoom Out */}
        <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)))}
          style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 10px", borderRadius:"8px", fontSize:"14px", cursor:"pointer", flexShrink:0 }}>
          🔍−
        </button>

        {/* Zoom % reset */}
        <button onClick={() => setZoom(1)}
          style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"rgba(255,255,255,0.85)", padding:"6px 7px", borderRadius:"8px", fontSize:"11px", fontWeight:"700", cursor:"pointer", flexShrink:0, minWidth:"36px" }}>
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom In */}
        <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)))}
          style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 10px", borderRadius:"8px", fontSize:"14px", cursor:"pointer", flexShrink:0 }}>
          🔍+
        </button>

        <button onClick={() => {
          if (navigator.share) {
            navigator.share({ title: "Prescription", text: "Prescription from clinic", url: window.location.href }).catch(() => {});
          } else {
            showShareOptions();
          }
        }}
          style={{ background:"#25D366", border:"none", color:"white", padding:"8px 10px", borderRadius:"8px", fontSize:"13px", fontWeight:"700", cursor:"pointer", flexShrink:0 }}>
          Share
        </button>

        <button onClick={handlePrint}
          style={{ background:"white", border:"none", color:"#0f4c81", padding:"8px 12px", borderRadius:"8px", fontSize:"13px", fontWeight:"700", cursor:"pointer", flexShrink:0, marginRight:"4px" }}>
          🖨 PDF
        </button>
      </div>

      {/* ── Instructions bar ── */}
      <div style={{
        marginTop:"52px", padding:"10px 16px",
        background:"#fffbeb", borderBottom:"1px solid #fde68a",
        fontSize:"12px", color:"#92400e", textAlign:"center",
        paddingBottom:"10px", marginBottom:"0",
      }}>
        Zoom in → Screenshot → Send on WhatsApp 📸 &nbsp;|&nbsp; Or tap 🖨 → Save as PDF
      </div>

      {/* ── Prescription content rendered directly with zoom ── */}
      <div style={{ padding:"0", background:"#e2e8f0", minHeight:"100vh", overflow:"auto" }}>
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
        <div style={{
          transformOrigin: "top center",
          transform: `scale(${zoom})`,
          transition: "transform 0.2s ease",
          background: "white",
          width: `${100 / zoom}%`,
          margin: "0 auto",
          minHeight: "600px",
          boxShadow: zoom > 1 ? "0 4px 32px rgba(0,0,0,0.2)" : "none",
        }}>
          <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
        </div>
      </div>

      {/* ── Bottom zoom bar ── */}
      <div id="action-bar" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:9998,
        background:"#0a1628", padding:"10px 16px",
        display:"flex", alignItems:"center", justifyContent:"center", gap:"20px",
      }}>
        <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)))}
          style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"white", borderRadius:"50%", width:"42px", height:"42px", fontSize:"20px", cursor:"pointer", fontWeight:"700", display:"flex", alignItems:"center", justifyContent:"center" }}>
          −
        </button>
        <div style={{ color:"white", textAlign:"center" }}>
          <div style={{ fontWeight:"800", fontSize:"18px" }}>{Math.round(zoom * 100)}%</div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.5)" }}>Zoom</div>
        </div>
        <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)))}
          style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"white", borderRadius:"50%", width:"42px", height:"42px", fontSize:"20px", cursor:"pointer", fontWeight:"700", display:"flex", alignItems:"center", justifyContent:"center" }}>
          +
        </button>
      </div>

      {/* ── Share options overlay ── */}
      <div id="share-overlay" style={{
        display:"none", position:"fixed", inset:0,
        background:"rgba(0,0,0,0.75)", zIndex:99999,
        alignItems:"flex-end", justifyContent:"center",
      }}>
        <div style={{
          background:"white", borderRadius:"20px 20px 0 0",
          padding:"24px 20px 36px", width:"100%", maxWidth:"480px",
        }}>
          <div style={{ width:"36px", height:"4px", background:"#e2e8f0", borderRadius:"2px", margin:"0 auto 16px" }} />
          <div style={{ textAlign:"center", marginBottom:"20px" }}>
            <div style={{ fontSize:"36px", marginBottom:"8px" }}>📤</div>
            <div style={{ fontWeight:"800", fontSize:"16px", color:"#0f4c81" }}>Share / Save Options</div>
          </div>

          {/* Screenshot tip */}
          <div style={{ background:"#f0fdf4", borderRadius:"12px", padding:"14px", marginBottom:"12px", fontSize:"13px", color:"#166534", lineHeight:"1.8" }}>
            📸 <b>Easiest on Redmi:</b><br/>
            Take a screenshot → send on WhatsApp<br/>
            <span style={{ fontSize:"11px", color:"#16a34a" }}>(Volume Down + Power button at same time)</span>
          </div>

          <div style={{ background:"#eff6ff", borderRadius:"12px", padding:"14px", marginBottom:"16px", fontSize:"13px", color:"#1e40af", lineHeight:"1.8" }}>
            📄 <b>For proper PDF:</b><br/>
            1. Tap <b>🖨 Print</b> button above<br/>
            2. In print dialog → tap top dropdown<br/>
            3. Select <b>"Save as PDF"</b> → Save<br/>
            4. Go to Downloads → share via WhatsApp
          </div>

          <button
            onClick={() => {
              const el = document.getElementById("share-overlay");
              if (el) el.style.display = "none";
            }}
            style={{ width:"100%", background:"#0f4c81", color:"white", border:"none", padding:"14px", borderRadius:"12px", fontSize:"15px", fontWeight:"700", cursor:"pointer" }}>
            Got it ✓
          </button>
        </div>
      </div>

      {/* Print styles — hides all UI, shows only prescription */}
      <style>{`
        @media print {
          #action-bar,
          #share-overlay,
          .no-print { display: none !important; }
          body { margin: 0 !important; background: white !important; }
          div[style*="marginTop:52"] { margin-top: 0 !important; }
          div[style*="margin-top:52"] { margin-top: 0 !important; }
          div[style*="0a1628"] { display: none !important; }
          div[style*="fffbeb"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
