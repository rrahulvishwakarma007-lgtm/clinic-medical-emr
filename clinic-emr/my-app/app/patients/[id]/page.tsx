"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

const DOSAGE_PRESETS = ["1-0-1", "1-1-1", "0-0-1", "1-0-0", "0-1-0", "SOS", "Once daily", "Twice daily"];
const DURATION_PRESETS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month"];
const ROUTE_OPTIONS = ["Oral", "Topical", "Inhalation", "Injection", "Sublingual", "Nasal Drops", "Eye Drops"];

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  route: string;
  instructions: string;
}

export default function PatientProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] as Medicine[],
    notes: "",
    diagnosis: "",
  });

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const pRes = await fetch("/api/patients");
      const pResult = await pRes.json();
      if (pResult.success) {
        const found = pResult.data.find((p: any) => String(p.id) === String(id));
        if (found) setPatient(found);
      }

      const prRes = await fetch("/api/prescriptions");
      const prData = await prRes.json();
      if (Array.isArray(prData)) {
        const filtered = prData.filter((pr: any) => String(pr.patient_id) === String(id));
        setPrescriptions(filtered);
      }
    } catch (err) {
      console.error("Error loading patient data:", err);
    } finally {
      setLoading(false);
    }
  }

  function addMedicineRow() {
    setForm(f => ({ ...f, medicines: [...f.medicines, { name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] }));
  }

  function removeMedicineRow(idx: number) {
    setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));
  }

  function updateMedicine(idx: number, field: keyof Medicine, value: string) {
    setForm(f => ({ ...f, medicines: f.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m) }));
  }

  async function savePrescription() {
    if (form.medicines.some(m => !m.name)) return alert("Please fill in medicine names.");
    setIsSaving(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: id,
          medicines: form.medicines,
          notes: form.notes,
          diagnosis: form.diagnosis,
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      setForm({ medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }], notes: "", diagnosis: "" });
      loadData();
      setTab("prescriptions");
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handlePrint(p: any) {
    const patientName = patient?.name || "Patient";
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    
    const medicines = p.medicine.split("\n");
    const dosages = (p.dosage || "").split("\n");
    const durations = (p.duration || "").split("\n");

    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Prescription - ${patientName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'DM Sans',sans-serif;padding:50px;color:#1a1a2e;font-size:13px;line-height:1.6}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #0f4c81;margin-bottom:28px}
      .clinic-name{font-family:'DM Serif Display',serif;font-size:26px;color:#0f4c81}
      .clinic-sub{font-size:11px;color:#888;margin-top:4px;line-height:1.8}
      .doctor-info{text-align:right;font-size:12px;color:#666;line-height:1.8}
      .doctor-name{font-weight:700;color:#1a1a2e;font-size:14px}
      .patient-box{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;background:#f8fbff;padding:18px 22px;border-radius:10px;margin-bottom:24px;border:1px solid #e8f1fb}
      .label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:4px;font-weight:600}
      .value{font-size:14px;font-weight:500;color:#1a1a2e}
      .rx-title{font-family:'DM Serif Display',serif;font-size:18px;color:#0f4c81;margin-bottom:16px;display:flex;align-items:center;gap:10px}
      .rx-title::after{content:'';flex:1;height:1px;background:#e2e8f0}
      .medicine-row{display:grid;grid-template-columns:30px 1fr 120px 100px 120px;gap:12px;padding:12px 0;border-bottom:1px dashed #eee;align-items:start}
      .med-num{width:26px;height:26px;background:#0f4c81;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}
      .med-name{font-weight:700;font-size:15px;color:#1a1a2e}
      .med-label{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
      .med-val{font-size:13px;color:#444;font-weight:500}
      .notes-box{margin-top:24px;padding:14px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;font-size:13px;color:#555}
      .footer{margin-top:50px;padding-top:20px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end}
      .sign-area{text-align:right}
      .sign-line{width:160px;border-top:1px solid #333;margin-bottom:6px;margin-left:auto}
      .sign-label{font-size:11px;color:#666}
      .footer-note{font-size:10px;color:#aaa;line-height:1.8}
    </style></head><body>
    <div class="header">
      <div>
        <div class="clinic-name">${hospitalConfig.name}</div>
        <div class="clinic-sub">${hospitalConfig.address}, ${hospitalConfig.city}, ${hospitalConfig.state}<br/>
        Phone: ${hospitalConfig.phone} &nbsp;|&nbsp; ${hospitalConfig.email}</div>
      </div>
      <div class="doctor-info">
        <div class="doctor-name">${hospitalConfig.doctorName}</div>
        <div>${hospitalConfig.doctorDegree}</div>
        <div>${hospitalConfig.department}</div>
        <div>Reg. No: MCI-XXXXX</div>
      </div>
    </div>

    <div class="patient-box">
      <div><div class="label">Patient Name</div><div class="value">${patientName}</div></div>
      <div><div class="label">Date</div><div class="value">${new Date(p.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
      <div><div class="label">Prescription ID</div><div class="value" style="font-family:monospace;font-size:12px">RX-${(p.id || "").slice(0,8).toUpperCase()}</div></div>
      ${p.diagnosis ? `<div style="grid-column:1/-1"><div class="label">Diagnosis / Chief Complaint</div><div class="value">${p.diagnosis}</div></div>` : ""}
    </div>

    <div class="rx-title">℞ &nbsp; Prescribed Medications</div>

    <div>
      <div class="medicine-row" style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;padding-bottom:8px">
        <div></div><div>Medicine</div><div>Dosage</div><div>Duration</div><div>Route</div>
      </div>
      ${medicines.map((m: string, i: number) => `
        <div class="medicine-row">
          <div class="med-num">${i + 1}</div>
          <div><div class="med-name">${m}</div></div>
          <div><div class="med-label">Dosage</div><div class="med-val">${dosages[i] || "—"}</div></div>
          <div><div class="med-label">Duration</div><div class="med-val">${durations[i] || "—"}</div></div>
          <div><div class="med-label">Route</div><div class="med-val">Oral</div></div>
        </div>
      `).join("")}
    </div>

    ${p.notes ? `<div class="notes-box"><strong>Instructions:</strong> ${p.notes}</div>` : ""}

    <div class="footer">
      <div class="footer-note">
        This is a computer-generated prescription.<br/>
        Valid for 30 days from date of issue.<br/>
        ${hospitalConfig.name} &bull; ${hospitalConfig.appName}
      </div>
      <div class="sign-area">
        <div class="sign-line"></div>
        <div class="sign-label">${hospitalConfig.doctorName}</div>
        <div class="sign-label" style="color:#aaa">${hospitalConfig.doctorDegree}</div>
      </div>
    </div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
    w.document.close();
  }

  if (loading) return <div style={{ padding: 40, color: "#3182ce", textAlign: "center", fontWeight: "600" }}>Loading Medical Profile...</div>;
  if (!patient) return <div style={{ padding: 40, textAlign: "center" }}>Patient record not found.</div>;

  const inputStyle: any = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f8fbff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .tab-btn{padding:10px 20px;border:none;background:none;cursor:pointer;font-weight:600;color:#a0aec0;border-bottom:3px solid transparent;transition:all 0.2s;font-size:14px}
        .tab-btn.active{color:#0f4c81;border-bottom-color:#0f4c81}
        .card{background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.04);padding:24px;border:1px solid #edf2f7}
        .preset-chip{padding:4px 10px;border-radius:20px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:11px;font-weight:500;transition:all 0.15s}
        .preset-chip:hover{border-color:#0f4c81;color:#0f4c81;background:#ebf8ff}
        .action-btn{padding:8px 16px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;border:none;transition:all 0.2s}
      `}</style>

      {/* Header Profile Info */}
      <div className="card" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ width: "80px", height: "80px", background: "#0f4c81", color: "white", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "bold", boxShadow: "0 8px 16px rgba(15,76,129,0.2)" }}>
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "4px" }}>Medical Profile</div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: 0, fontFamily: "'DM Serif Display', serif" }}>{patient.name}</h1>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px", color: "#718096", fontSize: "14px" }}>
              <span><strong>Age:</strong> {patient.age} Yrs</span>
              <span>&bull;</span>
              <span><strong>Type:</strong> {patient.type}</span>
              <span>&bull;</span>
              <span><strong>ID:</strong> #{patient.id.slice(0,8)}</span>
            </div>
          </div>
        </div>
        <button onClick={() => router.back()} className="action-btn" style={{ background: "#edf2f7", color: "#4a5568" }}>← Back to Directory</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #edf2f7", marginBottom: "2rem" }}>
        <button onClick={() => setTab("overview")} className={`tab-btn ${tab === "overview" ? "active" : ""}`}>Overview</button>
        <button onClick={() => setTab("prescribe")} className={`tab-btn ${tab === "prescribe" ? "active" : ""}`}>New Prescription</button>
        <button onClick={() => setTab("prescriptions")} className={`tab-btn ${tab === "prescriptions" ? "active" : ""}`}>Medical History</button>
      </div>

      {/* Content */}
      <div className="card">
        {tab === "overview" && (
          <div>
            <h3 style={{ fontSize: "20px", color: "#0f4c81", marginBottom: "1.5rem", fontFamily: "'DM Serif Display', serif" }}>Patient Overview</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ padding: "16px", background: "#f8fbff", borderRadius: "12px", border: "1px solid #e8f1fb" }}>
                <div style={{ color: "#718096", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Contact Information</div>
                <div style={{ color: "#2d3748", fontSize: "14px", lineHeight: "1.8" }}>
                  <div><strong>Phone:</strong> {patient.phone || "Not provided"}</div>
                  <div><strong>Address:</strong> {patient.address || "No address on record"}</div>
                </div>
              </div>
              <div style={{ padding: "16px", background: "#f8fbff", borderRadius: "12px", border: "1px solid #e8f1fb" }}>
                <div style={{ color: "#718096", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Vital Records</div>
                <div style={{ color: "#2d3748", fontSize: "14px", lineHeight: "1.8" }}>
                  <div><strong>Blood Group:</strong> {patient.blood_group || "Unknown"}</div>
                  <div><strong>Status:</strong> <span style={{ color: "#38a169", fontWeight: "700" }}>Active Record</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "prescribe" && (
          <div>
            <h3 style={{ fontSize: "20px", color: "#0f4c81", marginBottom: "1.5rem", fontFamily: "'DM Serif Display', serif" }}>Create Prescription</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "8px" }}>DIAGNOSIS / CHIEF COMPLAINT</label>
                <input style={inputStyle} placeholder="e.g. Chronic Cough, Seasonal Allergies" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "12px" }}>MEDICATIONS</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {form.medicines.map((med, idx) => (
                    <div key={idx} style={{ padding: "16px", background: "#f8fbff", borderRadius: "12px", border: "1.5px solid #e8f1fb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#0f4c81", background: "#dbeafe", padding: "2px 10px", borderRadius: "10px" }}>Medication #{idx + 1}</span>
                        {form.medicines.length > 1 && <button onClick={() => removeMedicineRow(idx)} style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Remove</button>}
                      </div>
                      <input style={{ ...inputStyle, marginBottom: "12px", fontWeight: "600" }} placeholder="Medicine name (e.g. Paracetamol 500mg)" value={med.name} onChange={e => updateMedicine(idx, "name", e.target.value)} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Dosage</div>
                          <input style={inputStyle} placeholder="1-0-1" value={med.dosage} onChange={e => updateMedicine(idx, "dosage", e.target.value)} />
                          <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                            {DOSAGE_PRESETS.slice(0, 4).map(d => <button key={d} className="preset-chip" onClick={() => updateMedicine(idx, "dosage", d)}>{d}</button>)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Duration</div>
                          <input style={inputStyle} placeholder="5 Days" value={med.duration} onChange={e => updateMedicine(idx, "duration", e.target.value)} />
                          <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                            {DURATION_PRESETS.slice(0, 3).map(d => <button key={d} className="preset-chip" onClick={() => updateMedicine(idx, "duration", d)}>{d}</button>)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Route</div>
                          <select style={inputStyle} value={med.route} onChange={e => updateMedicine(idx, "route", e.target.value)}>
                            {ROUTE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>
                      <input style={inputStyle} placeholder="Special instructions (e.g. Take after food)" value={med.instructions} onChange={e => updateMedicine(idx, "instructions", e.target.value)} />
                    </div>
                  ))}
                </div>
                <button onClick={addMedicineRow} style={{ marginTop: "12px", width: "100%", padding: "10px", background: "none", border: "1.5px dashed #cbd5e0", borderRadius: "10px", color: "#718096", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>+ Add Another Medicine</button>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "8px" }}>GENERAL INSTRUCTIONS</label>
                <textarea style={{ ...inputStyle, minHeight: "80px", resize: "none" }} placeholder="Rest, diet advice, follow-up..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <button onClick={savePrescription} disabled={isSaving} style={{ background: "#0f4c81", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "700", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(15,76,129,0.2)" }}>
                {isSaving ? "Saving Record..." : "Confirm & Save Prescription"}
              </button>
            </div>
          </div>
        )}

        {tab === "prescriptions" && (
          <div>
            <h3 style={{ fontSize: "20px", color: "#0f4c81", marginBottom: "1.5rem", fontFamily: "'DM Serif Display', serif" }}>Medical History</h3>
            {prescriptions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#a0aec0" }}>No medical records found for this patient.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {prescriptions.map((p) => (
                  <div key={p.id} style={{ padding: "16px", border: "1px solid #edf2f7", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e" }}>
                        {p.diagnosis || "Medical Consultation"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#a0aec0", margin: "4px 0 8px" }}>{new Date(p.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {(p.medicine || "").split("\n").map((m: string, i: number) => (
                          <span key={i} style={{ background: "#ebf8ff", color: "#3182ce", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handlePrint(p)} className="action-btn" style={{ background: "#0f4c81", color: "white" }}>Print Rx 🖨️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}