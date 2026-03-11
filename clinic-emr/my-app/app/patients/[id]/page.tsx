"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

const DOSAGE_PRESETS = ["1-0-1", "1-1-1", "0-0-1", "1-0-0", "0-1-0", "SOS", "Once daily", "Twice daily"];
const DURATION_PRESETS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month"];
const ROUTE_OPTIONS = ["Oral", "Topical", "Inhalation", "Injection", "Sublingual", "Nasal Drops", "Eye Drops"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

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
  const [activeRxId, setActiveRxId] = useState<string | null>(null);
  const [form, setForm] = useState({ medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }] as Medicine[], notes: "", diagnosis: "", followup_date: "" });

  useEffect(() => { if (id) loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, prRes] = await Promise.all([fetch("/api/patients"), fetch("/api/prescriptions")]);
      const pResult = await pRes.json();
      const prData = await prRes.json();
      if (pResult.success) {
        const found = pResult.data.find((p: any) => String(p.id) === String(id));
        if (found) { setPatient(found); setEditForm({ name: found.name, age: found.age, phone: found.phone, address: found.address, blood_group: found.blood_group, type: found.type }); }
      }
      if (Array.isArray(prData)) setPrescriptions(prData.filter((pr: any) => String(pr.patient_id) === String(id)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveEdit() {
    if (!editForm.name || !editForm.phone) return alert("Name and phone are required.");
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/patients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...editForm, age: parseInt(editForm.age) }) });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setShowEdit(false); loadData();
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
      const promises = form.medicines.map(m => fetch("/api/prescriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: id, medicine: m.name, dosage: m.dosage, duration: m.duration, route: m.route, notes: [m.instructions, form.notes].filter(Boolean).join(" | "), diagnosis: form.diagnosis, followup_date: form.followup_date || null }) }));
      await Promise.all(promises);
      setForm({ medicines: [{ name: "", dosage: "", duration: "", route: "Oral", instructions: "" }], notes: "", diagnosis: "", followup_date: "" });
      loadData(); setTab("prescriptions");
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setIsSaving(false); }
  }

  function handlePrint(p: any) {
    const patientName = patient?.name || "Patient";
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const meds = (p.medicine || "").split("\n");
    const dosages = (p.dosage || "").split("\n");
    const durations = (p.duration || "").split("\n");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Prescription - ${patientName}</title><style>@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;padding:50px;color:#1a1a2e;font-size:13px;line-height:1.6}.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #0f4c81;margin-bottom:28px}.clinic-name{font-family:'DM Serif Display',serif;font-size:26px;color:#0f4c81}.clinic-sub{font-size:11px;color:#888;margin-top:4px;line-height:1.8}.doctor-info{text-align:right;font-size:12px;color:#666;line-height:1.8}.doctor-name{font-weight:700;color:#1a1a2e;font-size:14px}.patient-box{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;background:#f8fbff;padding:18px 22px;border-radius:10px;margin-bottom:24px;border:1px solid #e8f1fb}.label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:4px;font-weight:600}.value{font-size:14px;font-weight:500;color:#1a1a2e}.rx-title{font-family:'DM Serif Display',serif;font-size:18px;color:#0f4c81;margin-bottom:16px}.medicine-row{display:grid;grid-template-columns:30px 1fr 120px 100px 120px;gap:12px;padding:12px 0;border-bottom:1px dashed #eee;align-items:start}.med-num{width:26px;height:26px;background:#0f4c81;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}.med-name{font-weight:700;font-size:15px;color:#1a1a2e}.med-label{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}.med-val{font-size:13px;color:#444;font-weight:500}.notes-box{margin-top:20px;padding:14px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;font-size:13px;color:#555}.followup-box{margin-top:14px;padding:12px 18px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;font-size:13px;color:#166534;font-weight:600}.footer{margin-top:50px;padding-top:20px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end}.sign-line{width:160px;border-top:1px solid #333;margin-bottom:6px;margin-left:auto}.sign-label{font-size:11px;color:#666;text-align:right}.footer-note{font-size:10px;color:#aaa;line-height:1.8}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="header"><div><div class="clinic-name">${hospitalConfig.name}</div><div class="clinic-sub">${hospitalConfig.address}, ${hospitalConfig.city}, ${hospitalConfig.state}<br/>Phone: ${hospitalConfig.phone} | ${hospitalConfig.email}</div></div><div class="doctor-info"><div class="doctor-name">${hospitalConfig.doctorName}</div><div>${hospitalConfig.doctorDegree}</div><div>${hospitalConfig.department}</div></div></div><div class="patient-box"><div><div class="label">Patient Name</div><div class="value">${patientName}</div></div><div><div class="label">Age / Blood Group</div><div class="value">${patient?.age || "—"} yrs &bull; ${patient?.blood_group || "—"}</div></div><div><div class="label">Date</div><div class="value">${new Date(p.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div></div><div><div class="label">Rx ID</div><div class="value" style="font-family:monospace;font-size:12px">RX-${(p.id || "").slice(0,8).toUpperCase()}</div></div>${p.diagnosis ? `<div style="grid-column:1/-1"><div class="label">Diagnosis</div><div class="value">${p.diagnosis}</div></div>` : ""}</div><div class="rx-title">℞ &nbsp; Prescribed Medications</div><div class="medicine-row" style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;padding-bottom:8px"><div></div><div>Medicine</div><div>Dosage</div><div>Duration</div><div>Route</div></div>${meds.map((m: string, i: number) => `<div class="medicine-row"><div class="med-num">${i + 1}</div><div><div class="med-name">${m}</div></div><div><div class="med-label">Dosage</div><div class="med-val">${dosages[i] || "—"}</div></div><div><div class="med-label">Duration</div><div class="med-val">${durations[i] || "—"}</div></div><div><div class="med-label">Route</div><div class="med-val">${p.route || "Oral"}</div></div></div>`).join("")}${p.notes ? `<div class="notes-box"><strong>Instructions:</strong> ${p.notes}</div>` : ""}${p.followup_date ? `<div class="followup-box">📅 Follow-up Date: ${new Date(p.followup_date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>` : ""}<div class="footer"><div class="footer-note">Computer-generated prescription. Valid 30 days.<br/>${hospitalConfig.name} &bull; ${hospitalConfig.appName}</div><div><div class="sign-line"></div><div class="sign-label">${hospitalConfig.doctorName}</div><div class="sign-label" style="color:#aaa">${hospitalConfig.doctorDegree}</div></div></div><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  if (loading) return (<div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{ textAlign: "center" }}><div style={{ width: 48, height: 48, border: "3px solid #1a3a5c", borderTopColor: "#3b82f6", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} /><p style={{ color: "#4a6fa5", fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>Loading Medical Profile...</p></div></div>);
  if (!patient) return (<div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", color: "#4a6fa5" }}>Patient record not found.</div>);

  const initials = patient.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const lastRx = prescriptions[0];

  return (
    <div style={{ minHeight: "100vh", background: "#060d1a", fontFamily: "'Outfit', sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0a1525}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:10px}
        .hero-banner{background:linear-gradient(135deg,#060d1a 0%,#0a1830 40%,#0d2040 100%);border-bottom:1px solid #0e2040;padding:32px 40px 0;position:relative;overflow:hidden}
        .hero-banner::before{content:'';position:absolute;top:-80px;right:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%);pointer-events:none}
        .hero-banner::after{content:'';position:absolute;bottom:0;left:200px;width:200px;height:200px;background:radial-gradient(circle,rgba(16,185,129,0.04) 0%,transparent 70%);pointer-events:none}
        .pat-avatar{width:80px;height:80px;background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:white;letter-spacing:-1px;box-shadow:0 0 0 1px rgba(59,130,246,0.3),0 8px 32px rgba(29,78,216,0.3);flex-shrink:0;font-family:'Instrument Serif',serif}
        .status-dot{width:9px;height:9px;background:#10b981;border-radius:50%;box-shadow:0 0 0 3px rgba(16,185,129,0.2);animation:pg 2s ease-in-out infinite;flex-shrink:0}
        @keyframes pg{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,0.2)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0.1)}}
        .hero-stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 20px;min-width:110px;transition:all 0.2s}
        .hero-stat:hover{background:rgba(59,130,246,0.06);border-color:rgba(59,130,246,0.2)}
        .blood-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);color:#f87171;padding:4px 12px;border-radius:8px;font-size:13px;font-weight:700}
        .type-badge{display:inline-flex;align-items:center;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);color:#93c5fd;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:600}
        .btn-edit{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif}
        .btn-edit:hover{background:rgba(255,255,255,0.1);color:#f1f5f9;border-color:rgba(255,255,255,0.2)}
        .btn-back{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,0.08);color:#64748b;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif}
        .btn-back:hover{color:#94a3b8;border-color:rgba(255,255,255,0.15)}
        .btn-rx{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;border-radius:10px;background:linear-gradient(135deg,#1d4ed8,#1e40af);border:1px solid rgba(59,130,246,0.3);color:white;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;box-shadow:0 4px 16px rgba(29,78,216,0.3)}
        .btn-rx:hover{background:linear-gradient(135deg,#2563eb,#1d4ed8);transform:translateY(-1px);box-shadow:0 6px 20px rgba(29,78,216,0.4)}
        .tabs-wrap{display:flex;gap:2px;padding:0 40px;border-top:1px solid rgba(255,255,255,0.04);background:rgba(0,0,0,0.2);margin:0 -40px}
        .tab-btn{padding:16px 22px;background:none;border:none;color:#4a6fa5;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;border-bottom:2px solid transparent;display:flex;align-items:center;gap:7px;font-family:'Outfit',sans-serif;white-space:nowrap}
        .tab-btn:hover{color:#94a3b8}
        .tab-btn.active{color:#e2e8f0;border-bottom-color:#3b82f6}
        .tab-badge{background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.2);color:#93c5fd;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px}
        .tab-badge.active{background:rgba(59,130,246,0.25)}
        .content-area{padding:28px 40px;max-width:1200px}
        .sect-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden}
        .sect-card-head{padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between}
        .sect-card-title{font-family:'Instrument Serif',serif;font-size:17px;color:#f0f6ff;display:flex;align-items:center;gap:10px}
        .sect-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px}
        .sect-card-body{padding:22px}
        .info-item{padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .info-item:last-child{border-bottom:none;padding-bottom:0}
        .info-lbl{font-size:11px;color:#4a6fa5;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-top:2px;flex-shrink:0}
        .info-val{font-size:14px;color:#cbd5e1;font-weight:500;text-align:right}
        .rx-timeline-item{position:relative;padding:0 0 24px 24px;border-left:1px solid rgba(255,255,255,0.06);transition:all 0.2s;cursor:pointer}
        .rx-timeline-item:last-child{padding-bottom:0;border-left-color:transparent}
        .rx-timeline-dot{position:absolute;left:-5px;top:6px;width:10px;height:10px;border-radius:50%;background:#1e3a5f;border:2px solid #3b82f6;transition:all 0.2s}
        .rx-timeline-item:hover .rx-timeline-dot{background:#3b82f6;box-shadow:0 0 0 4px rgba(59,130,246,0.15)}
        .rx-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 20px;transition:all 0.2s}
        .rx-card:hover{background:rgba(59,130,246,0.04);border-color:rgba(59,130,246,0.15)}
        .rx-card.expanded{border-color:rgba(59,130,246,0.25);background:rgba(59,130,246,0.05)}
        .rx-date-badge{font-size:11px;color:#4a6fa5;font-weight:600;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);padding:3px 10px;border-radius:6px}
        .med-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(29,78,216,0.1);border:1px solid rgba(29,78,216,0.2);color:#93c5fd;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:600}
        .rx-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.05)}
        .rx-detail-box{background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px}
        .rx-detail-lbl{font-size:10px;color:#4a6fa5;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:5px}
        .rx-detail-val{font-size:13px;color:#cbd5e1;font-weight:600}
        .btn-print-rx{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;white-space:nowrap}
        .btn-print-rx:hover{background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.3);color:#93c5fd}
        .form-label{font-size:11px;font-weight:700;color:#4a6fa5;text-transform:uppercase;letter-spacing:1.2px;display:block;margin-bottom:7px}
        .form-input{width:100%;padding:11px 14px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);border-radius:10px;color:#e2e8f0;font-size:14px;font-family:'Outfit',sans-serif;transition:all 0.2s;outline:none}
        .form-input:focus{border-color:#3b82f6;background:rgba(59,130,246,0.06);box-shadow:0 0 0 3px rgba(59,130,246,0.12)}
        .form-input::placeholder{color:#2d4a6e}
        .form-input option{background:#0d1f38;color:#e2e8f0}
        .form-textarea{width:100%;padding:11px 14px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);border-radius:10px;color:#e2e8f0;font-size:14px;font-family:'Outfit',sans-serif;transition:all 0.2s;outline:none;resize:vertical;min-height:80px}
        .form-textarea:focus{border-color:#3b82f6;background:rgba(59,130,246,0.06);box-shadow:0 0 0 3px rgba(59,130,246,0.12)}
        .form-textarea::placeholder{color:#2d4a6e}
        .preset-wrap{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
        .preset-chip{padding:3px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#64748b;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'Outfit',sans-serif}
        .preset-chip:hover{border-color:rgba(59,130,246,0.3);color:#93c5fd;background:rgba(59,130,246,0.08)}
        .med-row-card{background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px;position:relative;transition:border-color 0.2s}
        .med-row-card:hover{border-color:rgba(255,255,255,0.1)}
        .med-num-badge{display:inline-flex;align-items:center;background:rgba(29,78,216,0.15);border:1px solid rgba(29,78,216,0.25);color:#93c5fd;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;gap:5px}
        .btn-remove-med{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);color:#f87171;font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;cursor:pointer;transition:all 0.15s;font-family:'Outfit',sans-serif}
        .btn-remove-med:hover{background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.3)}
        .btn-add-med{width:100%;padding:12px;background:none;border:1.5px dashed rgba(255,255,255,0.08);border-radius:12px;color:#4a6fa5;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;display:flex;align-items:center;justify-content:center;gap:7px}
        .btn-add-med:hover{border-color:rgba(59,130,246,0.3);color:#93c5fd;background:rgba(59,130,246,0.04)}
        .btn-save-rx{width:100%;padding:14px;background:linear-gradient(135deg,#1d4ed8,#1e40af);border:1px solid rgba(59,130,246,0.3);border-radius:12px;color:white;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;box-shadow:0 4px 20px rgba(29,78,216,0.3);letter-spacing:0.3px}
        .btn-save-rx:hover:not(:disabled){background:linear-gradient(135deg,#2563eb,#1d4ed8);box-shadow:0 6px 24px rgba(29,78,216,0.45);transform:translateY(-1px)}
        .btn-save-rx:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:20px;animation:fadeIn 0.15s ease}
        @keyframes fadeIn{from{opacity:0}}
        .modal-card{background:#0a1525;border:1px solid rgba(255,255,255,0.08);border-radius:20px;width:480px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(59,130,246,0.1);animation:modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(10px)}}
        .modal-head{padding:22px 24px 18px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between}
        .modal-title{font-family:'Instrument Serif',serif;font-size:20px;color:#f0f6ff}
        .modal-sub{font-size:12px;color:#4a6fa5;margin-top:2px}
        .modal-close{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#64748b;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;line-height:1;font-family:inherit}
        .modal-close:hover{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2);color:#f87171}
        .modal-body{padding:22px 24px}
        .modal-foot{padding:16px 24px;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:10px}
        .btn-modal-cancel{flex:1;padding:11px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'Outfit',sans-serif}
        .btn-modal-cancel:hover{background:rgba(255,255,255,0.07);color:#94a3b8}
        .btn-modal-save{flex:1;padding:11px;background:linear-gradient(135deg,#1d4ed8,#1e40af);border:1px solid rgba(59,130,246,0.3);border-radius:10px;color:white;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:'Outfit',sans-serif;box-shadow:0 4px 12px rgba(29,78,216,0.3)}
        .btn-modal-save:hover:not(:disabled){background:linear-gradient(135deg,#2563eb,#1d4ed8)}
        .btn-modal-save:disabled{opacity:0.5;cursor:not-allowed}
        .empty-state{padding:60px 40px;text-align:center}
        .empty-icon{width:64px;height:64px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 18px}
        .followup-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);color:#34d399;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:600}
        .fade-in{animation:fadeInUp 0.28s ease both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}}
        .fade-in-d1{animation-delay:0.05s}.fade-in-d2{animation-delay:0.1s}.fade-in-d3{animation-delay:0.15s}
      `}</style>

      {/* HERO */}
      <div className="hero-banner">
        <div style={{ maxWidth: 1200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
            <button onClick={() => router.back()} className="btn-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Patients
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowEdit(true)} className="btn-edit">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Patient
              </button>
              <button onClick={() => setTab("prescribe")} className="btn-rx">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Prescription
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 22, marginBottom: 28, flexWrap: "wrap" }}>
            <div className="pat-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#4a6fa5", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.5px" }}>Patient Profile</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div className="status-dot" />
                  <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Active</span>
                </div>
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: "#f0f6ff", fontFamily: "'Instrument Serif', serif", margin: "0 0 10px", lineHeight: 1.1 }}>{patient.name}</h1>
              <div style={{ display: "flex", flexWrap: "wrap" as const, alignItems: "center", gap: 8 }}>
                <span className="blood-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                  {patient.blood_group || "Unknown"}
                </span>
                <span className="type-badge">{patient.type || "General Patient"}</span>
                <span style={{ fontSize: 12, color: "#4a6fa5", fontWeight: 600 }}>{patient.age} yrs old</span>
                {patient.phone && <><span style={{ color: "#1e3a5f" }}>·</span><span style={{ fontSize: 12, color: "#4a6fa5" }}>{patient.phone}</span></>}
                <span style={{ color: "#1e3a5f" }}>·</span>
                <span style={{ fontSize: 11, color: "#1e3a5f", fontFamily: "monospace" }}>#{(patient.id || "").slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" as const }}>
              <div className="hero-stat"><div style={{ fontSize: 22, fontWeight: 700, color: "#f0f6ff", lineHeight: 1, marginBottom: 4 }}>{prescriptions.length}</div><div style={{ fontSize: 10, color: "#4a6fa5", textTransform: "uppercase" as const, letterSpacing: "1.5px", fontWeight: 600 }}>Prescriptions</div></div>
              <div className="hero-stat"><div style={{ fontSize: 22, fontWeight: 700, color: "#f0f6ff", lineHeight: 1, marginBottom: 4 }}>{patient.age}</div><div style={{ fontSize: 10, color: "#4a6fa5", textTransform: "uppercase" as const, letterSpacing: "1.5px", fontWeight: 600 }}>Age (Years)</div></div>
              {lastRx && <div className="hero-stat"><div style={{ fontSize: 14, fontWeight: 600, color: "#f0f6ff", lineHeight: 1, marginBottom: 4 }}>{new Date(lastRx.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div><div style={{ fontSize: 10, color: "#4a6fa5", textTransform: "uppercase" as const, letterSpacing: "1.5px", fontWeight: 600 }}>Last Visit</div></div>}
            </div>
          </div>

          <div className="tabs-wrap">
            {[{ key: "overview", label: "Overview", icon: "○" }, { key: "prescribe", label: "New Prescription", icon: "℞" }, { key: "prescriptions", label: "Medical History", count: prescriptions.length }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`tab-btn ${tab === t.key ? "active" : ""}`}>
                {t.icon && <span>{t.icon}</span>}
                {t.label}
                {t.count !== undefined && <span className={`tab-badge ${tab === t.key ? "active" : ""}`}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content-area">

        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div className="sect-card fade-in">
              <div className="sect-card-head"><div className="sect-card-title"><div className="sect-icon" style={{ background: "rgba(59,130,246,0.1)" }}>📞</div>Contact Details</div></div>
              <div className="sect-card-body">
                {[["Phone Number", patient.phone || "Not provided"], ["Address", patient.address || "No address on record"]].map(([l, v]) => (
                  <div className="info-item" key={l}><div className="info-lbl">{l}</div><div className="info-val">{v}</div></div>
                ))}
              </div>
            </div>

            <div className="sect-card fade-in fade-in-d1">
              <div className="sect-card-head"><div className="sect-card-title"><div className="sect-icon" style={{ background: "rgba(16,185,129,0.1)" }}>🩺</div>Clinical Record</div></div>
              <div className="sect-card-body">
                {[["Blood Group", patient.blood_group || "Unknown"], ["Patient Type", patient.type || "General"], ["Total Prescriptions", String(prescriptions.length)], ["Record Status", "Active"]].map(([l, v]) => (
                  <div className="info-item" key={l}>
                    <div className="info-lbl">{l}</div>
                    <div className="info-val" style={{ color: l === "Record Status" ? "#10b981" : l === "Blood Group" ? "#f87171" : undefined, fontWeight: l === "Blood Group" ? 700 : undefined }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {lastRx && (
              <div className="sect-card fade-in fade-in-d2" style={{ gridColumn: "1 / -1" }}>
                <div className="sect-card-head">
                  <div className="sect-card-title"><div className="sect-icon" style={{ background: "rgba(139,92,246,0.1)" }}>💊</div>Latest Prescription</div>
                  <button onClick={() => handlePrint(lastRx)} className="btn-print-rx">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print Rx
                  </button>
                </div>
                <div className="sect-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" as const }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f6ff", marginBottom: 6, fontFamily: "'Instrument Serif', serif" }}>{lastRx.diagnosis || "Medical Consultation"}</div>
                      <div style={{ fontSize: 12, color: "#4a6fa5", marginBottom: 12 }}>{new Date(lastRx.created_at).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>
                      <span className="med-chip">💊 {lastRx.medicine}</span>
                    </div>
                    {lastRx.followup_date && <div className="followup-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Follow-up: {new Date(lastRx.followup_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>}
                  </div>
                </div>
              </div>
            )}

            <div className="sect-card fade-in fade-in-d3" style={{ gridColumn: "1 / -1" }}>
              <div className="sect-card-head"><div className="sect-card-title"><div className="sect-icon" style={{ background: "rgba(245,158,11,0.1)" }}>⚡</div>Quick Actions</div></div>
              <div className="sect-card-body" style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                {[{ label: "Write Prescription", icon: "℞", action: () => setTab("prescribe"), clr: "29,78,216", txt: "#93c5fd" }, { label: "View History", icon: "📋", action: () => setTab("prescriptions"), clr: "8,145,178", txt: "#67e8f9" }, { label: "Edit Info", icon: "✏️", action: () => setShowEdit(true), clr: "5,150,105", txt: "#6ee7b7" }].map(a => (
                  <button key={a.label} onClick={a.action} style={{ padding: "12px 20px", borderRadius: 12, background: `rgba(${a.clr},0.1)`, border: `1px solid rgba(${a.clr},0.2)`, color: a.txt, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15 }}>{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "prescribe" && (
          <div style={{ maxWidth: 780 }}>
            <div className="sect-card fade-in">
              <div className="sect-card-head">
                <div className="sect-card-title"><div className="sect-icon" style={{ background: "rgba(139,92,246,0.1)", fontSize: 16 }}>℞</div>Create Prescription</div>
                <span style={{ fontSize: 12, color: "#4a6fa5", fontWeight: 600 }}>for {patient.name}</span>
              </div>
              <div className="sect-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label className="form-label">Diagnosis / Chief Complaint</label>
                      <input className="form-input" placeholder="e.g. Viral fever, Hypertension" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Follow-up Date</label>
                      <input type="date" className="form-input" value={form.followup_date} onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: 12 }}>Medications — {form.medicines.length} added</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {form.medicines.map((med, idx) => (
                        <div key={idx} className="med-row-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span className="med-num-badge">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                              Medicine {idx + 1}
                            </span>
                            {form.medicines.length > 1 && <button onClick={() => removeMedicineRow(idx)} className="btn-remove-med">✕ Remove</button>}
                          </div>
                          <input className="form-input" style={{ marginBottom: 12, fontWeight: 600 }} placeholder="Medicine name (e.g. Tab. Paracetamol 500mg)" value={med.name} onChange={e => updateMedicine(idx, "name", e.target.value)} />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <div>
                              <label className="form-label" style={{ marginBottom: 5 }}>Dosage</label>
                              <input className="form-input" placeholder="1-0-1" value={med.dosage} onChange={e => updateMedicine(idx, "dosage", e.target.value)} />
                              <div className="preset-wrap">{DOSAGE_PRESETS.slice(0, 4).map(p => <button key={p} className="preset-chip" onClick={() => updateMedicine(idx, "dosage", p)}>{p}</button>)}</div>
                            </div>
                            <div>
                              <label className="form-label" style={{ marginBottom: 5 }}>Duration</label>
                              <input className="form-input" placeholder="5 days" value={med.duration} onChange={e => updateMedicine(idx, "duration", e.target.value)} />
                              <div className="preset-wrap">{DURATION_PRESETS.slice(0, 4).map(p => <button key={p} className="preset-chip" onClick={() => updateMedicine(idx, "duration", p)}>{p}</button>)}</div>
                            </div>
                            <div>
                              <label className="form-label" style={{ marginBottom: 5 }}>Route</label>
                              <select className="form-input" value={med.route} onChange={e => updateMedicine(idx, "route", e.target.value)}>{ROUTE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={addMedicineRow} className="btn-add-med" style={{ marginTop: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Another Medicine
                    </button>
                  </div>

                  <div>
                    <label className="form-label">General Instructions / Notes</label>
                    <textarea className="form-textarea" placeholder="e.g. Take after food. Avoid cold drinks. Rest for 2 days." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>

                  <button onClick={savePrescription} disabled={isSaving} className="btn-save-rx">
                    {isSaving ? "Saving Prescription..." : "Save & View Prescription"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "prescriptions" && (
          <div style={{ maxWidth: 820 }}>
            {prescriptions.length === 0 ? (
              <div className="sect-card fade-in">
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f6ff", fontFamily: "'Instrument Serif', serif", marginBottom: 8 }}>No Medical History</div>
                  <p style={{ color: "#4a6fa5", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>No prescriptions have been recorded for {patient.name} yet.</p>
                  <button onClick={() => setTab("prescribe")} className="btn-rx" style={{ display: "inline-flex" }}>Write First Prescription</button>
                </div>
              </div>
            ) : (
              <div className="sect-card fade-in">
                <div className="sect-card-head">
                  <div className="sect-card-title"><div className="sect-icon" style={{ background: "rgba(59,130,246,0.1)" }}>📋</div>Medical History</div>
                  <span style={{ fontSize: 12, color: "#4a6fa5", fontWeight: 600 }}>{prescriptions.length} record{prescriptions.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ padding: "22px 22px 22px 34px" }}>
                  {prescriptions.map((p, i) => (
                    <div key={p.id} className="rx-timeline-item fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="rx-timeline-dot" />
                      <div className={`rx-card ${activeRxId === p.id ? "expanded" : ""}`} onClick={() => setActiveRxId(activeRxId === p.id ? null : p.id)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" as const }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" as const }}>
                              <span className="rx-date-badge">{new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              <span style={{ fontSize: 11, color: "#1e3a5f", fontFamily: "monospace" }}>RX-{(p.id || "").slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f6ff", marginBottom: 8, fontFamily: "'Instrument Serif', serif" }}>{p.diagnosis || "Medical Consultation"}</div>
                            <span className="med-chip">💊 {p.medicine}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                            {p.followup_date && <span className="followup-badge" style={{ fontSize: 11 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>📅 {new Date(p.followup_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
                            <button onClick={e => { e.stopPropagation(); handlePrint(p); }} className="btn-print-rx">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                              Print Rx
                            </button>
                            <div style={{ color: "#2d4a6e", transition: "transform 0.2s", transform: activeRxId === p.id ? "rotate(180deg)" : "rotate(0deg)" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                          </div>
                        </div>
                        {activeRxId === p.id && (
                          <div className="rx-detail-grid">
                            {[{ l: "Dosage", v: p.dosage || "—" }, { l: "Duration", v: p.duration || "—" }, { l: "Route", v: p.route || "—" }].map(d => (
                              <div className="rx-detail-box" key={d.l}><div className="rx-detail-lbl">{d.l}</div><div className="rx-detail-val">{d.v}</div></div>
                            ))}
                            {p.notes && <div className="rx-detail-box" style={{ gridColumn: "1 / -1" }}><div className="rx-detail-lbl">Instructions</div><div className="rx-detail-val" style={{ fontWeight: 400, color: "#94a3b8", lineHeight: 1.6 }}>{p.notes}</div></div>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="modal-card">
            <div className="modal-head">
              <div><div className="modal-title">Edit Patient</div><div className="modal-sub">Update details for {patient.name}</div></div>
              <button className="modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><label className="form-label">Full Name *</label><input className="form-input" value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Patient full name" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label className="form-label">Age *</label><input type="number" className="form-input" value={editForm.age || ""} onChange={e => setEditForm({ ...editForm, age: e.target.value })} placeholder="Years" /></div>
                  <div><label className="form-label">Blood Group</label><select className="form-input" value={editForm.blood_group || ""} onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })}><option value="">Select</option>{BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
                </div>
                <div><label className="form-label">Phone Number *</label><input className="form-input" value={editForm.phone || ""} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" /></div>
                <div><label className="form-label">Classification</label><select className="form-input" value={editForm.type || "General Patient"} onChange={e => setEditForm({ ...editForm, type: e.target.value })}><option>General Patient</option><option>Emergency</option><option>Follow-up</option></select></div>
                <div><label className="form-label">Address</label><textarea className="form-textarea" style={{ minHeight: 70 }} value={editForm.address || ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })} placeholder="Patient's home address" /></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-modal-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn-modal-save" onClick={saveEdit} disabled={isSavingEdit}>{isSavingEdit ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
