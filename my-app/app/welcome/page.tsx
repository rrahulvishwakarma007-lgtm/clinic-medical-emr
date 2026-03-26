"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

const FEATURES = [
  { icon: "👥", title: "Patient Management", desc: "Complete digital records — history, vitals, allergies, blood group, all in one place." },
  { icon: "📅", title: "Smart Appointments", desc: "Schedule, reschedule, track OPD queue and follow-ups with real-time status updates." },
  { icon: "💊", title: "Digital Prescriptions", desc: "Write and print professional prescriptions in seconds. Auto-filled patient details." },
  { icon: "🧾", title: "Billing & Invoices", desc: "Generate GST-ready invoices, track payments, and monitor pending dues effortlessly." },
  { icon: "📈", title: "Revenue Analytics", desc: "Live revenue dashboard — daily, weekly, monthly trends. Export CSV any time." },
  { icon: "🤖", title: "Maya AI Assistant", desc: "Voice-powered AI fills prescriptions hands-free in Hinglish. Speak, she types." },
  { icon: "📊", title: "Reports & Analytics", desc: "Auto-generated reports for patients, billing, appointments and prescriptions." },
  { icon: "🩺", title: "Vitals Tracking", desc: "Record and visualise BP, sugar, temperature, SpO2 trends over time." },
];

const STATS = [
  { value: "10+", label: "Modules" },
  { value: "AI", label: "Powered" },
  { value: "100%", label: "Digital" },
  { value: "0", label: "Paper" },
];

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setVisible(true), 100);
  }, []);

  function handleGetStarted() {
    // Check if already logged in
    const user = typeof window !== "undefined" ? localStorage.getItem("clinic_user") : null;
    router.push(user ? "/" : "/login");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060d1a",
      fontFamily: "'Outfit', 'DM Sans', -apple-system, sans-serif",
      color: "#e2e8f0",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 10px; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-12px); } }
        @keyframes pulse-ring { 0% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(59,130,246,0.4); } 70% { transform:scale(1); box-shadow:0 0 0 16px rgba(59,130,246,0); } 100% { transform:scale(0.95); } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes gradientShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }

        .hero-gradient-text {
          background: linear-gradient(135deg, #60a5fa, #a78bfa, #34d399, #60a5fa);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease infinite;
        }

        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.25s;
        }
        .feature-card:hover {
          background: rgba(59,130,246,0.06);
          border-color: rgba(59,130,246,0.2);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(59,130,246,0.1);
        }

        .glow-btn {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: white;
          border: none;
          padding: 16px 40px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          box-shadow: 0 0 0 0 rgba(59,130,246,0.4);
          animation: pulse-ring 2.5s infinite;
          letter-spacing: 0.3px;
        }
        .glow-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 8px 32px rgba(59,130,246,0.5);
        }

        .stat-card {
          text-align: center;
          padding: 20px 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
        }

        .floating-emoji {
          animation: float 3s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 36px !important; }
          .hero-sub { font-size: 15px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .hero-section { padding: 60px 20px 40px !important; }
          .section-pad { padding: 48px 20px !important; }
          .contact-row { flex-direction: column !important; text-align: center !important; gap: 10px !important; }
        }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,13,26,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "9px",
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>🏥</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "white", lineHeight: 1.2 }}>
              {hospitalConfig.name}
            </div>
            <div style={{ fontSize: "10px", color: "#4a5568" }}>{hospitalConfig.tagline}</div>
          </div>
        </div>
        <button onClick={handleGetStarted} style={{
          background: "rgba(59,130,246,0.15)",
          border: "1px solid rgba(59,130,246,0.3)",
          color: "#60a5fa", padding: "8px 20px",
          borderRadius: "20px", fontSize: "13px", fontWeight: "700",
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
        }}>
          Open App →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{
        padding: "80px 32px 60px",
        textAlign: "center",
        maxWidth: "900px",
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        animation: visible ? "fadeUp 0.7s ease both" : "none",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: "50px", padding: "6px 16px",
          fontSize: "12px", fontWeight: "700", color: "#60a5fa",
          marginBottom: "28px", letterSpacing: "0.5px",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
          NEXT-GEN CLINIC EMR · POWERED BY AI
        </div>

        {/* Title */}
        <h1 className="hero-title" style={{
          fontSize: "54px", fontWeight: "900", lineHeight: 1.1,
          margin: "0 0 20px", color: "white",
          fontFamily: "'Playfair Display', serif",
        }}>
          Your Clinic,{" "}
          <span className="hero-gradient-text">Fully Digital.</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-sub" style={{
          fontSize: "18px", color: "#94a3b8", lineHeight: 1.7,
          maxWidth: "680px", margin: "0 auto 36px", fontWeight: "400",
        }}>
          {hospitalConfig.name} — a complete cloud-based EMR system that manages patients, prescriptions, appointments, billing, and analytics — all in one place. With Maya AI, even prescriptions write themselves.
        </p>

        {/* CTA */}
        <button className="glow-btn" onClick={handleGetStarted}>
          🚀 Get Started — It's Free
        </button>

        {/* Floating emojis decoration */}
        <div style={{ marginTop: "48px", display: "flex", justifyContent: "center", gap: "28px", fontSize: "32px", opacity: 0.6 }}>
          {["🏥","💊","📋","🤖","📈"].map((e, i) => (
            <span key={i} className="floating-emoji" style={{ animationDelay: `${i * 0.4}s` }}>{e}</span>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="section-pad" style={{ padding: "0 32px 60px", maxWidth: "900px", margin: "0 auto" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
          {STATS.map((s, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: "32px", fontWeight: "900", color: "#60a5fa", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section-pad" style={{ padding: "60px 32px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#4a5568", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>
              Everything You Need
            </div>
            <h2 style={{ fontSize: "36px", fontWeight: "800", color: "white", margin: "0 0 12px", fontFamily: "'Playfair Display', serif" }}>
              One App. Complete Clinic.
            </h2>
            <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "500px", margin: "0 auto" }}>
              No more paper files, no more missed appointments, no more billing confusion.
            </p>
          </div>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: "16px" }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "12px",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", marginBottom: "14px",
                }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#f0f6ff", marginBottom: "8px" }}>{f.title}</div>
                <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAYA AI HIGHLIGHT ── */}
      <section className="section-pad" style={{ padding: "72px 32px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(29,78,216,0.15), rgba(124,58,237,0.15))",
          border: "1px solid rgba(99,179,237,0.2)",
          borderRadius: "24px", padding: "48px 40px",
        }}>
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>🤖</div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px" }}>
            Meet Maya
          </div>
          <h2 style={{ fontSize: "32px", fontWeight: "800", color: "white", margin: "0 0 14px", fontFamily: "'Playfair Display', serif" }}>
            Your AI-Powered Voice Assistant
          </h2>
          <p style={{ fontSize: "15px", color: "#94a3b8", maxWidth: "540px", margin: "0 auto 24px", lineHeight: 1.7 }}>
            Just talk to Maya in Hinglish — she listens, understands, and fills in the prescription form automatically. No typing, no clicks. Doctor bolein, Maya likhegi.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            {["🎤 Voice Input", "🇮🇳 Hinglish Support", "💊 Auto Prescription", "⚡ Instant Save"].map((tag, i) => (
              <span key={i} style={{
                background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.2)",
                color: "#93c5fd", padding: "6px 14px", borderRadius: "20px",
                fontSize: "12px", fontWeight: "600",
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#030810",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Powered by + contact */}
          <div className="contact-row" style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "20px",
            marginBottom: "24px",
            padding: "20px 24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
          }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "white", marginBottom: "4px" }}>
                ⚡ Powered by <span style={{ color: "#60a5fa" }}>Nxt Gen AI Labs</span>
              </div>
              <div style={{ fontSize: "11px", color: "#4a5568" }}>
                Building next-generation healthcare technology
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px", padding: "10px 16px",
            }}>
              <span style={{ fontSize: "18px" }}>📞</span>
              <div>
                <div style={{ fontSize: "10px", color: "#4a5568", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Having Issues?
                </div>
                <a href="tel:9098779146" style={{
                  fontSize: "14px", fontWeight: "800", color: "#60a5fa",
                  textDecoration: "none", letterSpacing: "0.5px",
                }}>
                  9098779146
                </a>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ fontSize: "12px", color: "#2d3748" }}>
              © {new Date().getFullYear()} {hospitalConfig.name} · All rights reserved
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["Patients", "Appointments", "Prescriptions", "Billing", "Reports"].map(p => (
                <span key={p} style={{ fontSize: "11px", color: "#2d3748", padding: "3px 8px" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}