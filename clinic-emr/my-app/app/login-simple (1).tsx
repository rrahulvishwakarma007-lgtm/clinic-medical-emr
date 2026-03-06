"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

const USERS = [
  { email: "doctor@clinic.com", password: "doctor123", role: "Doctor", name: hospitalConfig.doctorName },
  { email: "staff@clinic.com",  password: "staff123",  role: "Staff",  name: "Clinic Staff" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      const user = USERS.find(u => u.email === email.trim().toLowerCase() && u.password === password);
      if (user) {
        localStorage.setItem("clinic_user", JSON.stringify(user));
        router.push("/");
      } else {
        setError("Incorrect email or password.");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .login-input { width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:9px; font-size:14px; font-family:inherit; background:#fafbfc; transition:all 0.15s; }
        .login-input:focus { outline:none; border-color:#0f4c81; background:white; box-shadow:0 0 0 3px rgba(15,76,129,0.1); }
        .login-btn { width:100%; padding:13px; border-radius:9px; background:#0f4c81; color:white; border:none; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s; }
        .login-btn:hover:not(:disabled) { background:#0a3d6b; transform:translateY(-1px); box-shadow:0 6px 20px rgba(15,76,129,0.3); }
        .login-btn:disabled { background:#93c5fd; cursor:not-allowed; }
        .toggle-pw { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#aaa; font-size:15px; }
        .toggle-pw:hover { color:#0f4c81; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .shake { animation: shake 0.3s ease; }
        .spinner { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:8px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .card { animation: fadeIn 0.35s ease; }
      `}</style>

      <div className="card" style={{ background: "white", borderRadius: "20px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>

        {/* Logo / Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "56px", height: "56px", background: "#dbeafe", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", margin: "0 auto 16px" }}>
            🏥
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#0f4c81", marginBottom: "4px" }}>
            {hospitalConfig.name}
          </h1>
          <p style={{ fontSize: "13px", color: "#aaa" }}>Sign in to your clinic dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {error && (
            <div className="shake" style={{ background: "#fff5f5", border: "1.5px solid #fed7d7", borderRadius: "9px", padding: "11px 14px", color: "#c53030", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>Email</label>
            <input
              type="email"
              className="login-input"
              placeholder="Enter your email"
              value={email}
              autoFocus
              onChange={e => { setEmail(e.target.value); setError(""); }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Enter your password"
                value={password}
                style={{ paddingRight: "44px" }}
                onChange={e => { setPassword(e.target.value); setError(""); }}
              />
              <button type="button" className="toggle-pw" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: "4px" }}>
            {loading ? <><span className="spinner" />Signing in...</> : "Sign In"}
          </button>
        </form>

        {/* Hint box */}
        <div style={{ marginTop: "24px", background: "#f8fbff", borderRadius: "10px", padding: "14px 16px", border: "1px solid #e8f1fb" }}>
          <div style={{ fontSize: "11px", color: "#999", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Default Logins</div>
          <div style={{ fontSize: "12px", color: "#666", lineHeight: 2 }}>
            <div>👨‍⚕️ <strong>Doctor:</strong> doctor@clinic.com / doctor123</div>
            <div>👩‍💼 <strong>Staff:</strong> staff@clinic.com / staff123</div>
          </div>
          <div style={{ fontSize: "11px", color: "#bbb", marginTop: "8px" }}>Change these in <code style={{ background: "#eef", padding: "1px 5px", borderRadius: "4px" }}>app/login/page.tsx</code></div>
        </div>

      </div>
    </div>
  );
}
