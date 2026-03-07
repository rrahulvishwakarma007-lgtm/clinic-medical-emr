"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

const DOSAGE_PRESETS = ["1-0-1", "1-1-1", "0-0-1", "1-0-0", "0-1-0", "SOS", "Once daily", "Twice daily"];
const DURATION_PRESETS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month"];
const ROUTE_OPTIONS = ["Oral", "Topical", "Inhalation", "Injection", "Sublingual", "Nasal Drops", "Eye Drops"];

interface Medicine { name: string; dosage: string; duration: string; route: string; instructions: string; }

export default function PatientProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [form, setForm] = useState({
    medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] as Medicine[],
    notes: "",
    diagnosis: "",
    followup_date: "",
  });

  useEffect(() => { if (id) loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, prRes] = await Promise.all([fetch("/api/patients"), fetch("/api/prescriptions")]);
      const pResult = await pRes.json();
      const prData = await prRes.json();
      if (pResult.success) {
        const found = pResult.data.find((p: any) => String(p.id) === String(id));
        if (found) { 
          setPatient(found); 
          setEditForm({ 
            name: found.name, 
            age: found.age, 
            phone: found.phone, 
            address: found.address, 
            blood_group: found.blood_group, 
            type: found.type 
          }); 
        }
      }
      if (Array.isArray(prData)) setPrescriptions(prData.filter((pr: any) => String(pr.patient_id) === String(id)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveEdit() {
    if (!editForm.name || !editForm.phone) return alert("Name and phone are required.");
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/patients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm, age: parseInt(editForm.age) }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setShowEdit(false);
      loadData();
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setIsSavingEdit(false); }
  }

  function addMedicineRow() { setForm(f => ({ ...f, medicines: [...f.medicines, { name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] })); }
  function removeMedicineRow(idx: number) { setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) })); }
  function updateMedicine(idx: number, field: keyof Medicine, value: string) { setForm(f => ({ ...f, medicines: f.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m) })); }

  async function savePrescription() {
    if (form.medicines.some(m => !m.name)) return alert("Please fill in medicine names.");
    setIsSaving(true);
    try {
      const promises = form.medicines.map(m =>
        fetch("/api/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: id,
            medicine: m.name,
            dosage: m.dosage,
            duration: m.duration,
            route: m.route,
            notes: [m.instructions, form.notes].filter(Boolean).join(" | "),
            diagnosis: form.diagnosis,
            followup_date: form.followup_date || null,
          }),
        })
      );
      await Promise.all(promises);
      setForm({ medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }], notes: "", diagnosis: "", followup_date: "" });
      loadData();
      setTab("prescriptions");
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setIsSaving(false); }
  }

  function handlePrint(p: any) {
    const patientName = patient?.name || "Patient";
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;

    // Split newline separated values if they exist (for multi-med support)
    const meds = (p.medicine || "").split("\n");
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
      .rx-title{font-family:'DM Serif Display',serif;font-size:18px;color:#0f4c81;margin-bottom:16px}
      .medicine-row{display:grid;grid-template-columns:30px 1fr 120px 100px 120px;gap:12px;padding:12px 0;border-bottom:1px dashed #eee;align-items:start}
      .med-num{width:26px;height:26px;background:#0f4c81;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}
      .med-name{font-weight:700;font-size:15px;color:#1a1a2e}
      .med-label{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
      .med-val{font-size:13px;color:#444;font-weight:500}
      .notes-box{margin-top:20px;padding:14px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;font-size:13px;color:#555}
      .followup-box{margin-top:14px;padding:12px 18px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;font-size:13px;color:#166534;font-weight:600}
      .footer{margin-top:50px;padding-top:20px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end}
      .sign-line{width:160px;border-top:1px solid #333;margin-bottom:6px;margin-left:auto}
      .sign-label{font-size:11px;color:#666;text-align:right}
      .footer-note{font-size:10px;color:#aaa;line-height:1.8}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="header">
      <div>
        <div class="clinic-name">${hospitalConfig.name}</div>
        <div class="clinic-sub">${hospitalConfig.address}, ${hospitalConfig.city}, ${hospitalConfig.state}<br/>Phone: ${hospitalConfig.phone} | ${hospitalConfig.email}</div>
      </div>
      <div class="doctor-info">
        <div class="doctor-name">${hospitalConfig.doctorName}</div>
        <div>${hospitalConfig.doctorDegree}</div>
        <div>${hospitalConfig.department}</div>
      </div>
    </div>
    <div class="patient-box">
      <div><div class="label">Patient Name</div><div class="value">${patientName}</div></div>
      <div><div class="label">Age / Blood Group</div><div class="value">${patient?.age || "—"} yrs &bull; ${patient?.blood_group || "—"}</div></div>
      <div><div class="label">Date</div><div class="value">${new Date(p.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
      <div><div class="label">Rx ID</div><div class="value" style="font-family:monospace;font-size:12px">RX-${(p.id || "").slice(0,8).toUpperCase()}</div></div>
      ${p.diagnosis ? `<div style="grid-column:1/-1"><div class="label">Diagnosis</div><div class="value">${p.diagnosis}</div></div>` : ""}
    </div>
    <div class="rx-title">℞ &nbsp; Prescribed Medications</div>
    <div class="medicine-row" style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;padding-bottom:8px">
      <div></div><div>Medicine</div><div>Dosage</div><div>Duration</div><div>Route</div>
    </div>
    ${meds.map((m, i) => `
    <div class="medicine-row">
      <div class="med-num">${i + 1}</div>
      <div><div class="med-name">${m}</div></div>
      <div><div class="med-label">Dosage</div><div class="med-val">${dosages[i] || "—"}</div></div>
      <div><div class="med-label">Duration</div><div class="med-val">${durations[i] || "—"}</div></div>
      <div><div class="med-label">Route</div><div class="med-val">${p.route || "Oral"}</div></div>
    </div>`).join("")}
    ${p.notes ? `<div class="notes-box"><strong>Instructions:</strong> ${p.notes}</div>` : ""}
    ${p.followup_date ? `<div class="followup-box">📅 Follow-up Date: ${new Date(p.followup_date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>` : ""}
    <div class="footer">
      <div class="footer-note">Computer-generated prescription. Valid 30 days.<br/>${hospitalConfig.name} &bull; ${hospitalConfig.appName}</div>
      <div><div class="sign-line"></div><div class="sign-label">${hospitalConfig.doctorName}</div><div class="sign-label" style="color:#aaa">${hospitalConfig.doctorDegree}</div></div>
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
        .tab-btn{padding:10px 20px;border:none;background:none;cursor:pointer;font-weight:600;color:#a0aec0;border-bottom:3px solid transparent;transition:all 0.2s;font-size:14px;font-family:inherit}
        .tab-btn.active{color:#0f4c81;border-bottom-color:#0f4c81}
        .card{background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.04);padding:24px;border:1px solid #edf2f7}
        .preset-chip{padding:4px 10px;border-radius:20px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:11px;font-weight:500;transition:all 0.15s;font-family:inherit}
        .preset-chip:hover{border-color:#0f4c81;color:#0f4c81;background:#ebf8ff}
        .action-btn{padding:8px 16px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;border:none;transition:all 0.2s;font-family:inherit}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .modal-anim{animation:slideUp 0.22s ease}
      `}</style>

      {/* Header */}
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "72px", height: "72px", background: "linear-gradient(135deg,#0f4c81,#1a6eb5)", color: "white", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "bold", boxShadow: "0 6px 16px rgba(15,76,129,0.25)", flexShrink: 0 }}>
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "4px" }}>Medical Profile</div>
            <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#1a1a2e", margin: 0, fontFamily: "'DM Serif Display', serif" }}>{patient.name}</h1>
            <div style={{ display: "flex", gap: "10px", marginTop: "6px", color: "#718096", fontSize: "13px", flexWrap: "wrap" }}>
              <span><strong>Age:</strong> {patient.age} yrs</span>
              <span>&bull;</span>
              <span><strong>Blood:</strong> {patient.blood_group || "—"}</span>
              <span>&bull;</span>
              <span><strong>Type:</strong> {patient.type}</span>
              <span>&bull;</span>
              <span><strong>Phone:</strong> {patient.phone || "—"}</span>
              <span>&bull;</span>
              <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#aaa" }}>#{patient.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowEdit(true)} className="action-btn" style={{ background: "#dbeafe", color: "#1e40af" }}>✏️ Edit Patient</button>
          <button onClick={() => router.back()} className="action-btn" style={{ background: "#edf2f7", color: "#4a5568" }}>← Back</button>
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", padding: "32px", borderRadius: "16px", width: "460px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#0f4c81", marginBottom: "4px" }}>Edit Patient Details</h2>
            <p style={{ color: "#999", fontSize: "13px", marginBottom: "20px" }}>Update patient information in the records</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "4px" }}>Full Name *</label>
                <input style={inputStyle} value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "4px" }}>Age *</label>
                  <input type="number" style={inputStyle} value={editForm.age || ""} onChange={e => setEditForm({ ...editForm, age: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "4px" }}>Blood Group</label>
                  <select style={inputStyle} value={editForm.blood_group || ""} onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })}>
                    <option value="">Select</option>
                    {["A+","A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "4px" }}>Phone Number *</label>
                <input style={inputStyle} value={editForm.phone || ""} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "4px" }}>Classification</label>
                <select style={inputStyle} value={editForm.type || "General Patient"} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  <option>General Patient</option>
                  <option>Emergency</option>
                  <option>Follow-up</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "4px" }}>Address</label>
                <textarea style={{ ...inputStyle, minHeight: "60px", resize: "none" }} value={editForm.address || ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setShowEdit(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555", fontWeight: "600" }}>Cancel</button>
              <button onClick={saveEdit} disabled={isSavingEdit} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: isSavingEdit ? "#93c5fd" : "#0f4c81", color: "white", border: "none", cursor: isSavingEdit ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #edf2f7", marginBottom: "1.5rem" }}>
        <button onClick={() => setTab("overview")} className={`tab-btn ${tab === "overview" ? "active" : ""}`}>Overview</button>
        <button onClick={() => setTab("prescribe")} className={`tab-btn ${tab === "prescribe" ? "active" : ""}`}>New Prescription</button>
        <button onClick={() => setTab("prescriptions")} className={`tab-btn ${tab === "prescriptions" ? "active" : ""}`}>Medical History ({prescriptions.length})</button>
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="card">
          <h3 style={{ fontSize: "18px", color: "#0f4c81", marginBottom: "20px", fontFamily: "'DM Serif Display', serif" }}>Patient Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ padding: "16px", background: "#f8fbff", borderRadius: "12px", border: "1px solid #e8f1fb" }}>
              <div style={{ color: "#718096", fontSize: "11px", textTransform: "uppercase", fontWeight: "700", marginBottom: "10px", letterSpacing: "1.5px" }}>Contact Information</div>
              <div style={{ color: "#2d3748", fontSize: "14px", lineHeight: "2" }}>
                <div><strong>Phone:</strong> {patient.phone || "Not provided"}</div>
                <div><strong>Address:</strong> {patient.address || "No address on record"}</div>
              </div>
            </div>
            <div style={{ padding: "16px", background: "#f8fbff", borderRadius: "12px", border: "1px solid #e8f1fb" }}>
              <div style={{ color: "#718096", fontSize: "11px", textTransform: "uppercase", fontWeight: "700", marginBottom: "10px", letterSpacing: "1.5px" }}>Vital Records</div>
              <div style={{ color: "#2d3748", fontSize: "14px", lineHeight: "2" }}>
                <div><strong>Blood Group:</strong> {patient.blood_group || "Unknown"}</div>
                <div><strong>Patient Type:</strong> {patient.type || "General"}</div>
                <div><strong>Total Prescriptions:</strong> {prescriptions.length}</div>
                <div><strong>Status:</strong> <span style={{ color: "#38a169", fontWeight: "700" }}>Active Record</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW PRESCRIPTION */}
      {tab === "prescribe" && (
        <div className="card">
          <h3 style={{ fontSize: "18px", color: "#0f4c81", marginBottom: "20px", fontFamily: "'DM Serif Display', serif" }}>Create Prescription</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Diagnosis / Chief Complaint</label>
                <input style={inputStyle} placeholder="e.g. Fever, Cold, Infection" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Follow-up Date</label>
                <input type="date" style={inputStyle} value={form.followup_date} onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#718096", display: "block", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Medications ({form.medicines.length})</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {form.medicines.map((med, idx) => (
                  <div key={idx} style={{ padding: "16px", background: "#f8fbff", borderRadius: "12px", border: "1.5px solid #e8f1fb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#0f4c81", background: "#dbeafe", padding: "2px 10px", borderRadius: "10px" }}>Medicine #{idx + 1}</span>
                      {form.medicines.length > 1 && <button onClick={() => removeMedicineRow(idx)} style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit" }}>Remove</button>}
                    </div>
                    <input style={{ ...inputStyle, marginBottom: "10px", fontWeight: "600" }} placeholder="Medicine name" value={med.name} onChange={e => updateMedicine(idx, "name", e.target.value)} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Dosage</div>
                        <input style={inputStyle} placeholder="1-0-1" value={med.dosage} onChange={e => updateMedicine(idx, "dosage", e.target.value)} />
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Duration</div>
                        <input style={inputStyle} placeholder="5 days" value={med.duration} onChange={e => updateMedicine(idx, "duration", e.target.value)} />
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Route</div>
                        <select style={inputStyle} value={med.route} onChange={e => updateMedicine(idx, "route", e.target.value)}>
                          {ROUTE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addMedicineRow} style={{ marginTop: "10px", width: "100%", padding: "10px", background: "none", border: "1.5px dashed #cbd5e0", borderRadius: "10px", color: "#718096", fontWeight: "600", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>+ Add Another Medicine</button>
            </div>

            <button onClick={savePrescription} disabled={isSaving} style={{ background: isSaving ? "#93c5fd" : "#0f4c81", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "700", fontSize: "15px", cursor: isSaving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{isSaving ? "Saving..." : "Save Prescription"}</button>
          </div>
        </div>
      )}

      {/* MEDICAL HISTORY */}
      {tab === "prescriptions" && (
        <div className="card">
          <h3 style={{ fontSize: "18px", color: "#0f4c81", marginBottom: "20px", fontFamily: "'DM Serif Display', serif" }}>Medical History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {prescriptions.map(p => (
              <div key={p.id} style={{ padding: "16px 20px", border: "1px solid #edf2f7", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a1a2e", marginBottom: "4px" }}>{p.diagnosis || "Medical Consultation"}</div>
                  <div style={{ fontSize: "12px", color: "#a0aec0", marginBottom: "8px" }}>{new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ background: "#ebf8ff", color: "#3182ce", padding: "2px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{p.medicine}</span>
                  </div>
                </div>
                <button onClick={() => handlePrint(p)} className="action-btn" style={{ background: "#0f4c81", color: "white", flexShrink: 0 }}>🖨 Print Rx</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
