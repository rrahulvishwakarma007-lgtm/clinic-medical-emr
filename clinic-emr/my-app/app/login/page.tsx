"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

export default function LoginPage() {
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Please enter email and password.");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      if (data.session) router.push("/");
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        .login-input{width:100%;padding:13px 16px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:14px;font-family:inherit;transition:all 0.2s;background:white;color:#1a1a2e}
        .login-input:focus{outline:none;border-color:#0f4c81;box-shadow:0 0 0 3px rgba(15,76,129,0.1)}
        .login-input::placeholder{color:#bbb}
        .login-btn{width:100%;padding:14px;border-radius:10px;border:none;background:#0f4c81;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s}
        .login-btn:hover:not(:disabled){background:#0a3d6b;transform:translateY(-1px);box-shadow:0 6px 20px rgba(15,76,129,0.35)}
        .login-btn:disabled{background:#93c5fd;cursor:not-allowed}
        .show-pw{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;font-size:18px;padding:4px}
        .error-box{background:#fee2e2;border:1px solid #fecaca;color:#991b1b;padding:12px 16px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:8px}
        .feature-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.08)}
        .feature-item:last-child{border-bottom:none}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .fade-in{animation:fadeIn 0.6s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .grid-bg{
          background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);
          background-size:40px 40px;
        }
      `}</style>

      {/* Left Panel */}
      <div className="grid-bg" style={{ flex: 1, background: "linear-gradient(145deg, #0a2d52 0%, #0f4c81 50%, #1a6eb5 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "-120px", left: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", border: "1px solid rgba(255,255,255,0.2)" }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "white", lineHeight: 1 }}>{hospitalConfig.name}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px", letterSpacing: "1.5px", textTransform: "uppercase" }}>EMR System</div>
          </div>
        </div>

        {/* Center */}
        <div className="fade-in">
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>Clinical Management</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "42px", color: "white", lineHeight: 1.15, marginBottom: "20px", fontWeight: "400" }}>
            Better Care<br/>
            <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>Starts Here</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.8, maxWidth: "320px" }}>
            Manage patients, appointments, prescriptions and billing — all in one secure platform built for your clinic.
          </p>
          <div style={{ marginTop: "40px" }}>
            {[
              { icon: "👥", label: "Patient Records", desc: "Complete medical history" },
              { icon: "📅", label: "Appointments", desc: "Smart scheduling" },
              { icon: "💊", label: "Prescriptions", desc: "Digital Rx with print" },
              { icon: "🧾", label: "Billing", desc: "Invoicing with GST" },
            ].map(f => (
              <div key={f.label} className="feature-item">
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: "600" }}>{f.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>System Online &bull; {hospitalConfig.appName} &bull; Secure Connection</span>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: "480px", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px", background: "#f8fafc" }}>
        <div className="fade-in">
          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "11px", color: "#0f4c81", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", marginBottom: "10px" }}>Secure Access</div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#1a1a2e", marginBottom: "8px", fontWeight: "400" }}>Welcome Back</h1>
            <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.6 }}>Sign in with your clinic credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "7px" }}>Email Address</label>
              <input className="login-input" type="email" placeholder="doctor@clinic.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "7px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="login-input" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: "46px" }} />
                <button type="button" className="show-pw" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-box">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: "6px" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "12px", color: "#bbb" }}>CLINIC ACCESS</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          <div style={{ background: "#f0f7ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "600", marginBottom: "4px" }}>🔐 Staff Access Only</div>
            <div style={{ fontSize: "12px", color: "#3b82f6", lineHeight: 1.6 }}>
              This system is restricted to authorised clinic staff. Contact your administrator to create or manage accounts via Supabase Auth.
            </div>
          </div>

          <div style={{ marginTop: "36px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#bbb" }}>{hospitalConfig.name} &bull; {hospitalConfig.appName}</div>
            <div style={{ fontSize: "11px", color: "#ddd", marginTop: "4px" }}>Secured by Supabase Auth &bull; All data encrypted</div>
          </div>
        </div>
      </div>
    </div>
  );
}
