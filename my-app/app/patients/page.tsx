"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import Link from "next/link";

function calcAge(dob: string): number {
  if (!dob) return 0;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", dob: "", blood_group: "", phone: "",
    type: "General Patient", address: "", allergies: "",
  });

  const previewAge = form.dob ? calcAge(form.dob) : null;

  useEffect(() => { loadPatients(); }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function loadPatients() {
    setLoading(true);
    try {
      const res = await fetch("/api/patients", { cache: "no-store" });
      if (!res.ok) return;
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) setPatients(result.data);
      else if (Array.isArray(result)) setPatients(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function savePatient() {
    if (!form.name || !form.dob || !form.phone) return alert("Name, Date of Birth, and Phone are required.");
    setIsSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: calcAge(form.dob) }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || result.error);
      setShowAdd(false);
      setForm({ name: "", dob: "", blood_group: "", phone: "", type: "General Patient", address: "", allergies: "" });
      loadPatients();
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setIsSaving(false); }
  }

  const inputStyle: any = {
    width: "100%", padding: "10px 14px", borderRadius: "8px",
    border: "1.5px solid #e2e8f0", fontSize: "14px",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .patient-row:hover { background-color: #f0f7ff !important; transform: translateY(-1px); }
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .modal-anim{animation:slideUp 0.22s ease}
      `}</style>

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", fontWeight: "bold", color: "#0f4c81", margin: 0 }}>Patients Directory</h1>
          <p style={{ color: "#718096", fontSize: "14px", marginTop: "4px" }}>Manage and view all patient medical records</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a0aec0" }}>🔍</span>
            <input
              type="text" placeholder="Search by name..."
              style={{ padding: "10px 12px 10px 38px", border: "1.5px solid #e2e8f0", borderRadius: "10px", width: "280px", fontSize: "14px", fontFamily: "inherit" }}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ background: "#0f4c81", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", fontFamily: "inherit" }}
          >
            + Register Patient
          </button>
        </div>
      </header>

      <div style={{ background: "white", borderRadius: "16px", padding: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #edf2f7" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {["Patient Details", "Age / DOB", "Allergies", "Classification", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "10px 16px", color: "#a0aec0", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "#3182ce", fontWeight: "600" }}>Fetching records...</td></tr>
            ) : filteredPatients.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "#a0aec0" }}>
                <div style={{ fontSize: "40px", marginBottom: "1rem" }}>👥</div>No patient records found.
              </td></tr>
            ) : filteredPatients.map(p => (
              <tr key={p.id} className="patient-row" style={{ background: "white", transition: "all 0.2s" }}>
                <td style={{ padding: "14px 16px", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc", borderLeft: "1px solid #f7fafc", borderRadius: "12px 0 0 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", background: "#ebf8ff", color: "#3182ce", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "700", color: "#2d3748", fontSize: "15px" }}>{p.name}</div>
                      <div style={{ fontSize: "12px", color: "#a0aec0" }}>#{p.id.slice(0, 8)} &bull; {p.phone || "—"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc", color: "#4a5568" }}>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{p.age} yrs</div>
                  {p.dob && (
                    <div style={{ fontSize: "11px", color: "#aaa" }}>
                      {new Date(p.dob + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  )}
                </td>
                <td style={{ padding: "14px 16px", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc" }}>
                  {p.allergies ? (
                    <span style={{ background: "#fff5f5", color: "#c53030", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                      ⚠️ {p.allergies}
                    </span>
                  ) : (
                    <span style={{ color: "#ccc", fontSize: "12px" }}>None</span>
                  )}
                </td>
                <td style={{ padding: "14px 16px", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc" }}>
                  <span style={{ padding: "4px 12px", borderRadius: "8px", fontSize: "12px", background: p.type === "Emergency" ? "#fff5f5" : "#ebf8ff", color: p.type === "Emergency" ? "#c53030" : "#3182ce", fontWeight: "700" }}>
                    {p.type}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#48bb78" }}></span>
                    <span style={{ fontSize: "13px", color: "#4a5568", fontWeight: "500" }}>Active</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc", borderRight: "1px solid #f7fafc", borderRadius: "0 12px 12px 0", textAlign: "right" }}>
                  <Link href={`/patients/${p.id}`}
                    style={{ background: "#f7fafc", color: "#3182ce", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "700", fontSize: "13px" }}>
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Register Patient Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", padding: "32px", borderRadius: "16px", width: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#0f4c81", marginBottom: "4px" }}>Register New Patient</h2>
            <p style={{ color: "#999", fontSize: "13px", marginBottom: "20px" }}>Add a new patient to clinic records</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Patient Name *" style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

              {/* DOB with live age preview */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Date of Birth *</label>
                <input type="date" style={inputStyle} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                {previewAge !== null && (
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#0f4c81", background: "#dbeafe", padding: "2px 10px", borderRadius: "10px", fontWeight: "600" }}>
                      Age: {previewAge} years
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="Phone Number *" style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <select style={inputStyle} value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                  <option value="">Blood Group</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>

              <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option>General Patient</option>
                <option>Emergency</option>
                <option>Follow-up</option>
              </select>

              {/* Allergies field */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Known Allergies</label>
                <input placeholder="e.g. Penicillin, Sulfa, Aspirin (leave blank if none)" style={inputStyle}
                  value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>⚠️ Will show as a warning on prescriptions</div>
              </div>

              <textarea placeholder="Address (optional)" style={{ ...inputStyle, minHeight: "60px", resize: "none" }}
                value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Cancel</button>
              <button onClick={savePatient} disabled={isSaving}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", background: isSaving ? "#93c5fd" : "#0f4c81", color: "white", border: "none", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>
                {isSaving ? "Saving..." : "Save Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}