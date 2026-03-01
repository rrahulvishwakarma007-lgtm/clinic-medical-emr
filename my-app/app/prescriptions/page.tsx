"use client";
import { useEffect, useState } from "react";
import hospitalConfig from "@/config/hospital";

const DOSAGE_PRESETS = ["1-0-1", "1-1-1", "0-0-1", "1-0-0", "0-1-0", "SOS", "Once daily", "Twice daily", "Thrice daily"];
const DURATION_PRESETS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month", "Ongoing"];
const ROUTE_OPTIONS = ["Oral", "Topical", "Inhalation", "Injection", "Sublingual", "Nasal Drops", "Eye Drops", "Ear Drops"];

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  route: string;
  instructions: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewPrescription, setViewPrescription] = useState<any | null>(null);

  const [form, setForm] = useState({
    patient_id: "",
    medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] as Medicine[],
    notes: "",
    diagnosis: "",
  });

  useEffect(() => { loadPrescriptions(); loadPatients(); }, []);

  async function loadPrescriptions() {
    setPageLoading(true);
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      if (Array.isArray(data)) setPrescriptions(data);
    } catch (err) { console.error(err); }
    finally { setPageLoading(false); }
  }

  async function loadPatients() {
    try {
      const res = await fetch("/api/patients");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) setPatients(result.data);
    } catch (err) { console.error(err); }
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
    if (!form.patient_id) return alert("Please select a patient.");
    if (form.medicines.some(m => !m.name)) return alert("Please fill in all medicine names.");
    setLoading(true);
    try {
      // Save as one single prescription record
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: form.patient_id,
          medicines: form.medicines,
          notes: form.notes,
          diagnosis: form.diagnosis,
        }),
      });
      
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setShowAdd(false);
      setForm({ patient_id: "", medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }], notes: "", diagnosis: "" });
      loadPrescriptions();
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setLoading(false); }
  }

  async function deletePrescription(id: string) {
    if (!confirm("Delete this prescription?")) return;
    await fetch("/api/prescriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadPrescriptions();
  }

  function handlePrint(p: any) {
    const patientName = p.patients?.name || patients.find(pat => pat.id === p.patient_id)?.name || "Patient";
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
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
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

  // Group prescriptions by patient + date for display
  const grouped = prescriptions.reduce((acc: any, p) => {
    const key = `${p.patient_id}_${(p.created_at || "").split("T")[0]}`;
    if (!acc[key]) acc[key] = { patient: p.patients?.name || "Unknown", date: (p.created_at || "").split("T")[0], items: [], id: p.id };
    acc[key].items.push(p);
    return acc;
  }, {});

  const filteredPrescriptions = prescriptions.filter(p => {
    const name = p.patients?.name || patients.find(pat => pat.id === p.patient_id)?.name || "";
    return !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || p.medicine?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const inputStyle: any = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .rx-row{transition:background 0.15s}
        .rx-row:hover td{background:#f0f7ff!important}
        .action-btn{border:none;cursor:pointer;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:600;transition:all 0.15s}
        .print-btn-sm{background:#dbeafe;color:#1e40af}
        .print-btn-sm:hover{background:#bfdbfe}
        .view-btn-sm{background:#ede9fe;color:#6d28d9}
        .view-btn-sm:hover{background:#ddd6fe}
        .del-btn-sm{background:#fee2e2;color:#991b1b}
        .del-btn-sm:hover{background:#fecaca}
        .add-medicine-btn{background:none;border:1.5px dashed #cbd5e0;width:100%;padding:10px;border-radius:8px;cursor:pointer;color:#888;font-size:13px;font-weight:500;transition:all 0.15s;font-family:inherit}
        .add-medicine-btn:hover{border-color:#0f4c81;color:#0f4c81;background:#f0f7ff}
        .remove-row-btn{background:none;border:none;cursor:pointer;color:#cbd5e0;padding:4px 8px;border-radius:6px;font-size:16px;transition:all 0.15s;line-height:1}
        .remove-row-btn:hover{color:#e53e3e;background:#fee2e2}
        .preset-chip{padding:4px 10px;border-radius:20px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:11px;font-weight:500;transition:all 0.15s;font-family:inherit}
        .preset-chip:hover{border-color:#0f4c81;color:#0f4c81;background:#ebf8ff}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        .modal-anim{animation:slideUp 0.22s ease}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .stat-card{background:white;border-radius:14px;padding:18px 22px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#0f4c81", margin: 0 }}>Prescriptions</h1>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>{hospitalConfig.name} &bull; {prescriptions.length} records</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "#0f4c81", color: "white", border: "none", padding: "11px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 14px rgba(15,76,129,0.25)" }}>
          + New Prescription
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "22px" }}>
        {[
          { label: "Total Prescriptions", value: prescriptions.length, color: "#0f4c81", icon: "💊" },
          { label: "Unique Patients", value: new Set(prescriptions.map(p => p.patient_id)).size, color: "#065f46", icon: "👥" },
          { label: "Today's Rx", value: prescriptions.filter(p => (p.created_at || "").split("T")[0] === new Date().toISOString().split("T")[0]).length, color: "#6d28d9", icon: "📋" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>{s.icon}</div>
            <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input type="text" placeholder="Search by patient name or medicine..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: "9px", border: "1.5px solid #e2e8f0", fontSize: "14px", width: "300px", background: "white" }} />
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0f4c81" }}>
              {["Rx ID", "Patient", "Medicine", "Dosage", "Duration", "Notes", "Date", "Actions"].map(h => (
                <th key={h} style={{ padding: "13px 16px", color: "white", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageLoading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>Loading...</td></tr>
            ) : filteredPrescriptions.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>💊</div>
                <div style={{ fontWeight: "600", color: "#999" }}>No prescriptions found</div>
              </td></tr>
            ) : filteredPrescriptions.map((p, i) => {
              const patientName = p.patients?.name || patients.find(pat => pat.id === p.patient_id)?.name || "N/A";
              return (
                <tr key={p.id} className="rx-row" style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "11px", color: "#aaa" }}>RX-{p.id?.slice(0, 8).toUpperCase()}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1a1a2e", fontSize: "14px" }}>{patientName}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#ebf8ff", color: "#1e40af", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>{p.medicine}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#555" }}>{p.dosage || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#555" }}>{p.duration || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#999", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.notes || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888" }}>{(p.created_at || "").split("T")[0]}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="action-btn print-btn-sm" onClick={() => handlePrint(p)}>🖨 Print</button>
                      <button className="action-btn del-btn-sm" onClick={() => deletePrescription(p.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Prescription Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", borderRadius: "16px", width: "680px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "28px 32px 0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#0f4c81", marginBottom: "4px" }}>New Prescription</h2>
              <p style={{ color: "#999", fontSize: "13px", marginBottom: "24px" }}>Write a prescription for a patient visit</p>
            </div>

            <div style={{ padding: "0 32px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Patient + Diagnosis */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Patient *</label>
                  <select style={inputStyle} value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Diagnosis / Chief Complaint</label>
                  <input style={inputStyle} placeholder="e.g. Fever, Cold, Infection..." value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
                </div>
              </div>

              {/* Medicines */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
                  Medicines ({form.medicines.length})
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {form.medicines.map((med, idx) => (
                    <div key={idx} style={{ background: "#f8fbff", borderRadius: "10px", padding: "14px 16px", border: "1.5px solid #e8f1fb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f4c81", background: "#dbeafe", padding: "2px 10px", borderRadius: "12px" }}>Medicine {idx + 1}</span>
                        {form.medicines.length > 1 && (
                          <button className="remove-row-btn" onClick={() => removeMedicineRow(idx)}>✕</button>
                        )}
                      </div>

                      {/* Medicine name */}
                      <input style={{ ...inputStyle, marginBottom: "10px", fontWeight: "600" }} placeholder="Medicine name & strength (e.g. Amoxicillin 500mg)" value={med.name} onChange={e => updateMedicine(idx, "name", e.target.value)} />

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                        {/* Dosage */}
                        <div>
                          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px", fontWeight: "600" }}>Dosage</div>
                          <input style={inputStyle} placeholder="e.g. 1-0-1" value={med.dosage} onChange={e => updateMedicine(idx, "dosage", e.target.value)} />
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                            {DOSAGE_PRESETS.slice(0, 4).map(d => (
                              <button key={d} className="preset-chip" onClick={() => updateMedicine(idx, "dosage", d)}>{d}</button>
                            ))}
                          </div>
                        </div>
                        {/* Duration */}
                        <div>
                          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px", fontWeight: "600" }}>Duration</div>
                          <input style={inputStyle} placeholder="e.g. 5 days" value={med.duration} onChange={e => updateMedicine(idx, "duration", e.target.value)} />
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                            {DURATION_PRESETS.slice(0, 3).map(d => (
                              <button key={d} className="preset-chip" onClick={() => updateMedicine(idx, "duration", d)}>{d}</button>
                            ))}
                          </div>
                        </div>
                        {/* Route */}
                        <div>
                          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px", fontWeight: "600" }}>Route</div>
                          <select style={inputStyle} value={med.route} onChange={e => updateMedicine(idx, "route", e.target.value)}>
                            {ROUTE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Instructions */}
                      <input style={inputStyle} placeholder="Instructions (e.g. Take after food, avoid milk)" value={med.instructions} onChange={e => updateMedicine(idx, "instructions", e.target.value)} />
                    </div>
                  ))}
                </div>

                <button className="add-medicine-btn" onClick={addMedicineRow} style={{ marginTop: "10px" }}>
                  + Add Another Medicine
                </button>
              </div>

              {/* General Notes */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>General Instructions</label>
                <textarea style={{ ...inputStyle, minHeight: "70px", resize: "none" }} placeholder="Rest, diet advice, follow-up instructions..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Discard</button>
                <button onClick={savePrescription} disabled={loading} style={{ flex: 2, padding: "12px", borderRadius: "8px", background: loading ? "#93c5fd" : "#0f4c81", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>
                  {loading ? "Saving..." : "Save & Issue Prescription"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
