"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  "Confirmed":   { bg: "#dbeafe", color: "#1e40af" },
  "Waiting":     { bg: "#fef3c7", color: "#92400e" },
  "In Progress": { bg: "#ede9fe", color: "#6d28d9" },
  "Completed":   { bg: "#d1fae5", color: "#065f46" },
  "Cancelled":   { bg: "#fee2e2", color: "#991b1b" },
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalPatients: 0, todaysAppointments: 0, prescriptionsIssued: 0, pendingBilling: 0 });
  const [todaysList, setTodaysList] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newPatient, setNewPatient] = useState({
    name: "", age: "", type: "General Patient",
    date: new Date().toISOString().split("T")[0],
    status: "Confirmed", phone: "", address: "", blood_group: "",
  });

  useEffect(() => {
    // ── Login guard ──
    const user = localStorage.getItem("clinic_user");
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setMounted(true);
    loadDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [pRes, aRes, prRes, bRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/appointments"),
        fetch("/api/prescriptions"),
        fetch("/api/billing"),
      ]);
      const pData = await pRes.json();
      const aData = await aRes.json();
      const prData = await prRes.json();
      const bData = await bRes.json();

      const today = new Date().toISOString().split("T")[0];
      const todaysAppointments = Array.isArray(aData) ? aData.filter((a: any) => a.date === today) : [];
      const pendingBilling = Array.isArray(bData) ? bData.filter((b: any) => b.status === "Pending").length : 0;

      setStats({
        totalPatients: pData.success ? pData.data.length : 0,
        todaysAppointments: todaysAppointments.length,
        prescriptionsIssued: Array.isArray(prData) ? prData.length : 0,
        pendingBilling,
      });
      setTodaysList(todaysAppointments.sort((a: any, b: any) => (a.time || "").localeCompare(b.time || "")));
      setRecentPatients(pData.success ? pData.data.slice(0, 6) : []);
      setRecentPrescriptions(Array.isArray(prData) ? prData.slice(0, 4) : []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally { setLoading(false); }
  }

  async function handleRegisterPatient() {
    if (!newPatient.name || !newPatient.age || !newPatient.phone) return alert("Please enter Name, Age, and Phone.");
    setIsSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPatient, age: parseInt(newPatient.age) }),
      });
      const result = await res.json();
      if (!result.success) { alert("Error: " + (result.error?.message || result.error)); }
      else {
        setShowAddPatient(false);
        setNewPatient({ name: "", age: "", type: "General Patient", date: new Date().toISOString().split("T")[0], status: "Confirmed", phone: "", address: "", blood_group: "" });
        loadDashboardData();
      }
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setIsSaving(false); }
  }

  const filteredPatients = recentPatients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  function formatTime(t: string) {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  const inputStyle: any = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit" };

  const QUICK_LINKS = [
    { label: "New Appointment", icon: "📅", path: "/appointments", color: "#0f4c81", bg: "#dbeafe" },
    { label: "New Prescription", icon: "💊", path: "/prescriptions", color: "#065f46", bg: "#d1fae5" },
    { label: "Create Invoice", icon: "🧾", path: "/billing", color: "#92400e", bg: "#fef3c7" },
    { label: "View Reports", icon: "📊", path: "/reports", color: "#6d28d9", bg: "#ede9fe" },
  ];

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .stat-card{background:white;border-radius:14px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);transition:all 0.2s;cursor:default}
        .stat-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.1)}
        .quick-link{border:none;cursor:pointer;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;transition:all 0.15s;font-family:inherit}
        .quick-link:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.12)}
        .appt-row:hover td{background:#f0f7ff!important}
        .section-card{background:white;border-radius:14px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        .modal-anim{animation:slideUp 0.22s ease}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .search-input{padding:9px 14px 9px 36px;border-radius:9px;border:1.5px solid #e2e8f0;font-size:14px;width:220px;background:white;font-family:inherit}
        .search-input:focus{outline:none;border-color:#0f4c81;box-shadow:0 0 0 3px rgba(15,76,129,0.1)}
        .register-btn{background:#0f4c81;color:white;border:none;padding:10px 20px;border-radius:9px;cursor:pointer;font-weight:600;font-size:14px;font-family:inherit;transition:all 0.15s}
        .register-btn:hover{background:#0a3d6b}
      `}</style>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#0f4c81", margin: 0 }}>
            {hospitalConfig.dashboardTitle}
          </h1>
          <p style={{ color: "#888", marginTop: "4px", fontSize: "14px" }}>
            Welcome back, {hospitalConfig.doctorName} &nbsp;|&nbsp;
            {mounted ? currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" }) : ""} &nbsp;|&nbsp;
            {mounted ? currentTime.toLocaleTimeString() : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "15px" }}>🔍</span>
            <input type="text" placeholder="Search patients..." className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className="register-btn" onClick={() => setShowAddPatient(true)}>+ Register Patient</button>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "22px" }}>
        {[
          { label: "Total Patients", value: stats.totalPatients, color: "#0f4c81", icon: "👥", sub: "registered", trend: "+12%" },
          { label: "Today's Appointments", value: stats.todaysAppointments, color: "#6d28d9", icon: "📅", sub: "scheduled today", trend: "Normal" },
          { label: "Prescriptions", value: stats.prescriptionsIssued, color: "#065f46", icon: "💊", sub: "total issued", trend: "Active" },
          { label: "Pending Bills", value: stats.pendingBilling, color: "#92400e", icon: "🧾", sub: "awaiting payment", trend: "Action Required" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ fontSize: "22px" }}>{s.icon}</div>
              <div style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", fontWeight: "700" }}>{s.trend}</div>
            </div>
            <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "30px", fontWeight: "700", color: s.color, lineHeight: 1 }}>{loading ? "—" : s.value}</div>
            <div style={{ fontSize: "11px", color: "#bbb", marginTop: "4px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "22px" }}>
        {QUICK_LINKS.map(q => (
          <button key={q.label} className="quick-link" onClick={() => router.push(q.path)} style={{ background: q.bg, color: q.color }}>
            <span style={{ fontSize: "20px" }}>{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* Today's Schedule */}
        <div className="section-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "15px", margin: 0 }}>📅 Today's Schedule</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => loadDashboardData()} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>Refresh</button>
              <button onClick={() => router.push("/appointments")} style={{ background: "none", border: "none", color: "#0f4c81", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>View All →</button>
            </div>
          </div>
          {todaysList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#bbb" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
              <div style={{ fontSize: "13px" }}>No appointments scheduled for today</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {["Time", "Patient", "Type", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "1px", textAlign: "left", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todaysList.map((a) => {
                  const st = STATUS_STYLES[a.status] || STATUS_STYLES["Confirmed"];
                  return (
                    <tr key={a.id} className="appt-row" style={{ borderBottom: "1px solid #f7fafc" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f4c81", fontSize: "13px" }}>{formatTime(a.time)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1a1a2e", fontSize: "13px" }}>{a.patients?.name || a.patient_name || "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#666" }}>{a.visit_type || "Checkup"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: st.bg, color: st.color }}>{a.status || "Confirmed"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Patients */}
        <div className="section-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "15px", margin: 0 }}>👥 Recent Patients</h3>
            <button onClick={() => router.push("/patients")} style={{ background: "none", border: "none", color: "#0f4c81", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>View All →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredPatients.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#bbb", fontSize: "13px" }}>No patients found</div>
            ) : filteredPatients.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f7fafc" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#dbeafe", color: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", flexShrink: 0 }}>
                  {p.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{p.type || "General"} &bull; {p.blood_group || "—"} &bull; Age {p.age || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "15px", margin: 0 }}>💊 Recent Prescriptions</h3>
          <button onClick={() => router.push("/prescriptions")} style={{ background: "none", border: "none", color: "#0f4c81", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>View All →</button>
        </div>
        {recentPrescriptions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#bbb", fontSize: "13px" }}>No prescriptions yet</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "12px" }}>
            {recentPrescriptions.map(p => (
              <div key={p.id} style={{ background: "#f8fbff", borderRadius: "10px", padding: "14px 16px", borderLeft: "3px solid #0f4c81" }}>
                <div style={{ fontWeight: "700", color: "#1e40af", fontSize: "14px", marginBottom: "4px" }}>{p.medicine}</div>
                <div style={{ fontSize: "12px", color: "#555", marginBottom: "2px" }}>👤 {p.patients?.name || "—"}</div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>{p.dosage || "—"} &bull; {p.duration || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {showAddPatient && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", padding: "32px", borderRadius: "16px", width: "460px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#0f4c81", marginBottom: "4px" }}>Register New Patient</h2>
            <p style={{ color: "#999", fontSize: "13px", marginBottom: "20px" }}>Add a new patient to the clinic records</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Patient Name *" style={inputStyle} value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="Age *" type="number" style={inputStyle} value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} />
                <select style={inputStyle} value={newPatient.blood_group} onChange={e => setNewPatient({ ...newPatient, blood_group: e.target.value })}>
                  <option value="">Blood Group</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <input placeholder="Phone Number *" style={inputStyle} value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <select style={inputStyle} value={newPatient.type} onChange={e => setNewPatient({ ...newPatient, type: e.target.value })}>
                  <option>General Patient</option>
                  <option>Emergency</option>
                  <option>Follow-up</option>
                </select>
                <input type="date" style={inputStyle} value={newPatient.date} onChange={e => setNewPatient({ ...newPatient, date: e.target.value })} />
              </div>
              <textarea placeholder="Address (optional)" style={{ ...inputStyle, minHeight: "60px", resize: "none" }} value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button onClick={() => setShowAddPatient(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Cancel</button>
              <button onClick={handleRegisterPatient} disabled={isSaving} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: isSaving ? "#93c5fd" : "#0f4c81", color: "white", border: "none", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>
                {isSaving ? "Saving..." : "Save Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
