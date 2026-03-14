"use client";
import { useEffect, useState, useMemo } from "react";
import hospitalConfig from "@/config/hospital";

// ════════════════════════════════════════════════════════
//  SMART FOLLOW-UP SCHEDULER
//  - Auto-suggests follow-up date from diagnosis / medicine duration
//  - Tracks overdue, due-today, upcoming, completed
//  - One-click WhatsApp message generator
//  - Links follow-ups back to prescriptions / appointments
// ════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────
interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctor: string;
  dueDate: string;          // YYYY-MM-DD
  createdDate: string;
  diagnosis: string;
  reason: string;           // why follow-up was scheduled
  prescriptionId?: string;
  appointmentId?: string;
  status: "Pending" | "Confirmed" | "Completed" | "Missed" | "Cancelled";
  priority: "High" | "Medium" | "Low";
  notes: string;
  reminderSent: boolean;
  suggestedBy: "auto" | "manual";
}

type TabKey = "dashboard" | "schedule" | "add";
type FilterStatus = "All" | FollowUp["status"];

// ─── Diagnosis → follow-up day suggester ─────────────
const DIAGNOSIS_RULES: Array<{
  keywords: string[];
  days: number;
  reason: string;
  priority: FollowUp["priority"];
}> = [
  { keywords: ["hypertension", "bp", "blood pressure", "i10"], days: 30, reason: "BP monitoring & medication review", priority: "High" },
  { keywords: ["diabetes", "diabetic", "hba1c", "sugar", "e11", "e13"], days: 30, reason: "Blood sugar monitoring & medication adjustment", priority: "High" },
  { keywords: ["thyroid", "hypothyroid", "hyperthyroid", "tsh"], days: 45, reason: "TSH level recheck & dose titration", priority: "High" },
  { keywords: ["fever", "viral", "ari", "urti", "j06"], days: 5, reason: "Recovery assessment", priority: "Low" },
  { keywords: ["infection", "antibiotic", "j18", "pneumonia", "j22"], days: 7, reason: "Post-antibiotic review", priority: "Medium" },
  { keywords: ["asthma", "copd", "wheeze", "j45", "j44"], days: 14, reason: "Respiratory review & inhaler technique", priority: "High" },
  { keywords: ["anemia", "iron", "haemoglobin", "hb", "d50", "d64"], days: 30, reason: "Haemoglobin recheck", priority: "Medium" },
  { keywords: ["cardiac", "heart", "angina", "i20", "i25", "echo"], days: 14, reason: "Cardiac assessment & ECG review", priority: "High" },
  { keywords: ["kidney", "renal", "ckd", "n18", "creatinine"], days: 14, reason: "Renal function recheck", priority: "High" },
  { keywords: ["liver", "hepatitis", "jaundice", "k70", "k72", "sgpt"], days: 14, reason: "Liver function review", priority: "High" },
  { keywords: ["fracture", "injury", "s", "trauma", "orthopedic"], days: 21, reason: "Healing assessment & physiotherapy review", priority: "Medium" },
  { keywords: ["depression", "anxiety", "mental", "f32", "f41"], days: 14, reason: "Psychiatric follow-up & medication review", priority: "High" },
  { keywords: ["migraine", "headache", "g43"], days: 10, reason: "Headache diary review & medication efficacy", priority: "Medium" },
  { keywords: ["allergy", "urticaria", "l50", "l20"], days: 10, reason: "Allergy response review", priority: "Low" },
  { keywords: ["pregnancy", "antenatal", "z34"], days: 14, reason: "Antenatal checkup", priority: "High" },
  { keywords: ["cancer", "malignancy", "c", "neoplasm"], days: 7, reason: "Oncology follow-up", priority: "High" },
  { keywords: ["uti", "n30", "urinary", "cystitis"], days: 7, reason: "Post-treatment culture recheck", priority: "Medium" },
  { keywords: ["skin", "dermatitis", "eczema", "psoriasis", "l30"], days: 14, reason: "Skin response to treatment", priority: "Low" },
  { keywords: ["cholesterol", "lipid", "dyslipidemia", "e78"], days: 45, reason: "Lipid profile recheck", priority: "Medium" },
];

function suggestFollowUp(diagnosis: string, medicineDurations: string[]): { days: number; reason: string; priority: FollowUp["priority"] } | null {
  if (!diagnosis) return null;
  const lower = diagnosis.toLowerCase();

  // Match diagnosis rules
  for (const rule of DIAGNOSIS_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { days: rule.days, reason: rule.reason, priority: rule.priority };
    }
  }

  // Fallback: derive from longest medicine duration
  const durationDays = medicineDurations.map(dur => {
    const d = dur.toLowerCase();
    const m = d.match(/(\d+)\s*(day|week|month)/);
    if (!m) return 0;
    const n = parseInt(m[1]);
    if (m[2].startsWith("week")) return n * 7;
    if (m[2].startsWith("month")) return n * 30;
    return n;
  });
  const maxDur = Math.max(...durationDays, 0);
  if (maxDur > 0) {
    return { days: maxDur + 2, reason: "Post-medication review", priority: "Medium" };
  }

  return { days: 7, reason: "Routine follow-up", priority: "Low" };
}

// ─── Helpers ─────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function diffDays(a: string, b: string) {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}
function fDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const PRIORITY_CONFIG = {
  High:   { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", dot: "#ef4444" },
  Medium: { bg: "#fffbeb", color: "#b45309", border: "#fde68a", dot: "#f59e0b" },
  Low:    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", dot: "#22c55e" },
};
const STATUS_CONFIG = {
  Pending:   { bg: "#dbeafe", color: "#1e40af", icon: "🕐" },
  Confirmed: { bg: "#d1fae5", color: "#065f46", icon: "✅" },
  Completed: { bg: "#f0fdf4", color: "#15803d", icon: "✔" },
  Missed:    { bg: "#fee2e2", color: "#991b1b", icon: "⚠" },
  Cancelled: { bg: "#f1f5f9", color: "#64748b", icon: "✕" },
};

// ─── WhatsApp Message Generator ──────────────────────
function buildWhatsAppMsg(fu: FollowUp): string {
  const today = todayStr();
  const diff = diffDays(fu.dueDate, today);
  const when = diff === 0 ? "today" : diff === 1 ? "tomorrow" : `on ${fDate(fu.dueDate)}`;
  return encodeURIComponent(
    `Namaste ${fu.patientName} ji 🙏\n\n` +
    `This is a reminder from *${hospitalConfig.name}* (${hospitalConfig.doctorName}).\n\n` +
    `Your follow-up appointment is due *${when}*.\n` +
    `Reason: ${fu.reason}\n\n` +
    `Please call us to confirm: *${hospitalConfig.phone}*\n\n` +
    `Stay healthy! 💚`
  );
}

// ─── Seed demo follow-ups ─────────────────────────────
function generateSeedFollowUps(): FollowUp[] {
  const today = todayStr();
  return [
    { id: "FU-001", patientId: "P-001001", patientName: "Rajesh Kumar", patientPhone: "9876543210", doctor: hospitalConfig.doctorName, dueDate: today, createdDate: addDays(today, -30), diagnosis: "Essential Hypertension", reason: "BP monitoring & medication review", status: "Pending", priority: "High", notes: "Patient has been on Amlodipine 5mg. Check BP and lipid profile.", reminderSent: false, suggestedBy: "auto" },
    { id: "FU-002", patientId: "P-001002", patientName: "Priya Sharma", patientPhone: "9898765432", doctor: hospitalConfig.doctorName, dueDate: addDays(today, -2), createdDate: addDays(today, -7), diagnosis: "URTI — Acute Upper Respiratory Infection", reason: "Recovery assessment", status: "Missed", priority: "Low", notes: "5-day course of azithromycin completed.", reminderSent: true, suggestedBy: "auto" },
    { id: "FU-003", patientId: "P-001003", patientName: "Arun Patel", patientPhone: "9765432109", doctor: hospitalConfig.doctorName, dueDate: addDays(today, 2), createdDate: addDays(today, -28), diagnosis: "Type 2 Diabetes Mellitus", reason: "Blood sugar monitoring & HbA1c review", status: "Confirmed", priority: "High", notes: "HbA1c was 8.2% last visit. Target <7%.", reminderSent: true, suggestedBy: "auto" },
    { id: "FU-004", patientId: "P-001004", patientName: "Meena Rao", patientPhone: "9654321098", doctor: hospitalConfig.doctorName, dueDate: addDays(today, 5), createdDate: addDays(today, -40), diagnosis: "Hypothyroidism", reason: "TSH level recheck & dose titration", status: "Pending", priority: "High", notes: "On Thyroxine 50mcg. TSH was 7.2 mIU/L.", reminderSent: false, suggestedBy: "auto" },
    { id: "FU-005", patientId: "P-001005", patientName: "Suresh Yadav", patientPhone: "9543210987", doctor: hospitalConfig.doctorName, dueDate: addDays(today, 12), createdDate: addDays(today, -9), diagnosis: "Iron Deficiency Anaemia", reason: "Haemoglobin recheck", status: "Pending", priority: "Medium", notes: "Started on IV iron sucrose. Check Hb after 3 weeks.", reminderSent: false, suggestedBy: "auto" },
    { id: "FU-006", patientId: "P-001006", patientName: "Kavita Joshi", patientPhone: "9432109876", doctor: hospitalConfig.doctorName, dueDate: addDays(today, -5), createdDate: addDays(today, -12), diagnosis: "Skin Allergy — Urticaria", reason: "Allergy response review", status: "Completed", priority: "Low", notes: "Patient responded well to antihistamines.", reminderSent: true, suggestedBy: "manual" },
    { id: "FU-007", patientId: "P-001007", patientName: "Dinesh Gupta", patientPhone: "9321098765", doctor: hospitalConfig.doctorName, dueDate: addDays(today, 18), createdDate: addDays(today, -12), diagnosis: "Dyslipidemia", reason: "Lipid profile recheck", status: "Pending", priority: "Medium", notes: "On Atorvastatin 10mg. Fasting lipid profile due.", reminderSent: false, suggestedBy: "auto" },
    { id: "FU-008", patientId: "P-001008", patientName: "Rekha Tiwari", patientPhone: "9210987654", doctor: hospitalConfig.doctorName, dueDate: addDays(today, 1), createdDate: addDays(today, -13), diagnosis: "Migraine", reason: "Headache diary review & medication efficacy", status: "Pending", priority: "Medium", notes: "On Propranolol 20mg prophylaxis.", reminderSent: false, suggestedBy: "manual" },
  ];
}

// ─── Main Component ───────────────────────────────────
export default function FollowUpScheduler() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [filterPriority, setFilterPriority] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [searchQ, setSearchQ] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFU, setEditingFU] = useState<FollowUp | null>(null);
  const [whatsAppFU, setWhatsAppFU] = useState<FollowUp | null>(null);

  // Form state
  const [form, setForm] = useState({
    patientId: "", patientName: "", patientPhone: "",
    doctor: hospitalConfig.doctorName,
    dueDate: addDays(todayStr(), 7),
    diagnosis: "", reason: "", notes: "",
    priority: "Medium" as FollowUp["priority"],
    prescriptionId: "",
  });
  const [suggestion, setSuggestion] = useState<{ days: number; reason: string; priority: FollowUp["priority"] } | null>(null);

  // Load data
  useEffect(() => {
    // Load from localStorage
    try {
      const raw = localStorage.getItem("clinic_followups");
      if (raw) { setFollowUps(JSON.parse(raw)); }
      else { setFollowUps(generateSeedFollowUps()); }
    } catch { setFollowUps(generateSeedFollowUps()); }

    // Try loading patients from clinic app
    try {
      const raw = localStorage.getItem("cliniccare_data");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.patients?.length) setPatients(d.patients.map((p: any) => ({ id: p.id, name: `${p.fn} ${p.ln}`, phone: p.phone || "" })));
        if (d.prescriptions?.length) setPrescriptions(d.prescriptions);
      }
    } catch {}

    // Also try Next.js API
    fetch("/api/patients").then(r => r.json()).then(r => {
      if (r.success && r.data?.length) setPatients(r.data.map((p: any) => ({ id: p.id, name: p.name, phone: p.phone || "" })));
    }).catch(() => {});

    fetch("/api/prescriptions").then(r => r.json()).then(r => {
      if (Array.isArray(r)) setPrescriptions(r);
    }).catch(() => {});
  }, []);

  function persist(updated: FollowUp[]) {
    setFollowUps(updated);
    try { localStorage.setItem("clinic_followups", JSON.stringify(updated)); } catch {}
  }

  // Auto-suggest when diagnosis changes
  useEffect(() => {
    const meds = prescriptions.find(p => p.id === form.prescriptionId)?.medicines?.map((m: any) => m.dur || m.duration || "") || [];
    const s = suggestFollowUp(form.diagnosis, meds);
    setSuggestion(s);
  }, [form.diagnosis, form.prescriptionId, prescriptions]);

  function applySuggestion() {
    if (!suggestion) return;
    setForm(f => ({
      ...f,
      dueDate: addDays(todayStr(), suggestion!.days),
      reason: suggestion!.reason,
      priority: suggestion!.priority,
    }));
  }

  function saveFollowUp() {
    if (!form.patientName) return alert("Please enter patient name.");
    if (!form.dueDate) return alert("Please select a follow-up date.");

    const isEdit = !!editingFU;
    const fu: FollowUp = {
      id: editingFU?.id || `FU-${Date.now()}`,
      patientId: form.patientId,
      patientName: form.patientName,
      patientPhone: form.patientPhone,
      doctor: form.doctor,
      dueDate: form.dueDate,
      createdDate: editingFU?.createdDate || todayStr(),
      diagnosis: form.diagnosis,
      reason: form.reason,
      notes: form.notes,
      priority: form.priority,
      prescriptionId: form.prescriptionId || undefined,
      status: editingFU?.status || "Pending",
      reminderSent: editingFU?.reminderSent || false,
      suggestedBy: suggestion ? "auto" : "manual",
    };
    if (isEdit) persist(followUps.map(f => f.id === fu.id ? fu : f));
    else persist([fu, ...followUps]);

    setShowAddModal(false);
    setEditingFU(null);
    resetForm();
  }

  function resetForm() {
    setForm({ patientId: "", patientName: "", patientPhone: "", doctor: hospitalConfig.doctorName, dueDate: addDays(todayStr(), 7), diagnosis: "", reason: "", notes: "", priority: "Medium", prescriptionId: "" });
    setSuggestion(null);
  }

  function openEdit(fu: FollowUp) {
    setEditingFU(fu);
    setForm({ patientId: fu.patientId, patientName: fu.patientName, patientPhone: fu.patientPhone, doctor: fu.doctor, dueDate: fu.dueDate, diagnosis: fu.diagnosis, reason: fu.reason, notes: fu.notes, priority: fu.priority, prescriptionId: fu.prescriptionId || "" });
    setShowAddModal(true);
  }

  function updateStatus(id: string, status: FollowUp["status"]) {
    persist(followUps.map(f => f.id === id ? { ...f, status } : f));
  }
  function markReminderSent(id: string) {
    persist(followUps.map(f => f.id === id ? { ...f, reminderSent: true } : f));
  }
  function deleteFU(id: string) {
    if (!confirm("Delete this follow-up?")) return;
    persist(followUps.filter(f => f.id !== id));
  }

  const today = todayStr();

  // Derived stats
  const stats = useMemo(() => ({
    overdue: followUps.filter(f => f.dueDate < today && f.status === "Pending").length,
    dueToday: followUps.filter(f => f.dueDate === today && (f.status === "Pending" || f.status === "Confirmed")).length,
    upcoming: followUps.filter(f => f.dueDate > today && (f.status === "Pending" || f.status === "Confirmed")).length,
    completed: followUps.filter(f => f.status === "Completed").length,
    missed: followUps.filter(f => f.status === "Missed").length,
    highPriority: followUps.filter(f => f.priority === "High" && f.status === "Pending").length,
  }), [followUps, today]);

  // Auto-mark old pending as missed
  useEffect(() => {
    const updated = followUps.map(f => {
      if (f.status === "Pending" && f.dueDate < today) return { ...f, status: "Missed" as const };
      return f;
    });
    if (updated.some((f, i) => f.status !== followUps[i].status)) persist(updated);
  }, [followUps, today]);

  // Filtered list
  const filtered = useMemo(() => {
    return followUps.filter(f => {
      const matchStatus = filterStatus === "All" || f.status === filterStatus;
      const matchPriority = filterPriority === "All" || f.priority === filterPriority;
      const matchSearch = !searchQ || f.patientName.toLowerCase().includes(searchQ.toLowerCase()) || f.diagnosis.toLowerCase().includes(searchQ.toLowerCase());
      return matchStatus && matchPriority && matchSearch;
    }).sort((a, b) => {
      // Sort: overdue first, then by date, then priority
      const aOverdue = a.dueDate < today ? -1 : 0;
      const bOverdue = b.dueDate < today ? -1 : 0;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [followUps, filterStatus, filterPriority, searchQ, today]);

  // Calendar: next 14 days
  const calDays = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const calMap = useMemo(() => {
    const m: Record<string, FollowUp[]> = {};
    followUps.filter(f => f.status === "Pending" || f.status === "Confirmed").forEach(f => {
      if (!m[f.dueDate]) m[f.dueDate] = [];
      m[f.dueDate].push(f);
    });
    return m;
  }, [followUps]);

  const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", background: "white", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" />
      <style>{`
        .fu-card{background:white;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        .hover-lift{transition:transform 0.12s,box-shadow 0.12s}
        .hover-lift:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.1)}
        .tab-btn{border:none;cursor:pointer;padding:9px 18px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;transition:all 0.15s}
        .action-btn{border:none;cursor:pointer;padding:5px 11px;border-radius:7px;font-size:11px;font-weight:700;transition:all 0.15s;font-family:inherit}
        .whatsapp-btn{background:#dcfce7;color:#15803d}.whatsapp-btn:hover{background:#bbf7d0}
        .edit-btn{background:#ede9fe;color:#6d28d9}.edit-btn:hover{background:#ddd6fe}
        .del-btn{background:#fee2e2;color:#991b1b}.del-btn:hover{background:#fecaca}
        .confirm-btn{background:#dbeafe;color:#1e40af}.confirm-btn:hover{background:#bfdbfe}
        .done-btn{background:#d1fae5;color:#065f46}.done-btn:hover{background:#a7f3d0}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        .modal-anim{animation:slideUp 0.2s ease}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .fade-in{animation:fadeIn 0.2s ease}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "26px", color: "#0f4c81", margin: 0 }}>Follow-up Scheduler</h1>
          <p style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>
            {hospitalConfig.name} · {followUps.length} scheduled
            {stats.overdue > 0 && <span className="pulse" style={{ marginLeft: "10px", background: "#fee2e2", color: "#b91c1c", padding: "2px 10px", borderRadius: "10px", fontWeight: "700", fontSize: "12px" }}>⚠ {stats.overdue} overdue</span>}
            {stats.dueToday > 0 && <span style={{ marginLeft: "6px", background: "#dbeafe", color: "#1e40af", padding: "2px 10px", borderRadius: "10px", fontWeight: "700", fontSize: "12px" }}>📅 {stats.dueToday} today</span>}
          </p>
        </div>
        <button onClick={() => { resetForm(); setEditingFU(null); setShowAddModal(true); }} style={{ background: "#0f4c81", color: "white", border: "none", padding: "11px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px", boxShadow: "0 4px 14px rgba(15,76,129,0.25)" }}>
          + Schedule Follow-up
        </button>
      </div>

      {/* ── KPI Strip ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Overdue", value: stats.overdue, color: "#b91c1c", bg: "#fef2f2", icon: "🚨", clickFilter: "Missed" as FilterStatus },
          { label: "Due Today", value: stats.dueToday, color: "#1e40af", bg: "#dbeafe", icon: "📅", clickFilter: "Pending" as FilterStatus },
          { label: "Upcoming", value: stats.upcoming, color: "#b45309", bg: "#fffbeb", icon: "🗓", clickFilter: "Pending" as FilterStatus },
          { label: "High Priority", value: stats.highPriority, color: "#b91c1c", bg: "#fff1f2", icon: "🔴", clickFilter: "Pending" as FilterStatus },
          { label: "Completed", value: stats.completed, color: "#065f46", bg: "#f0fdf4", icon: "✅", clickFilter: "Completed" as FilterStatus },
          { label: "Missed", value: stats.missed, color: "#991b1b", bg: "#fee2e2", icon: "⚠", clickFilter: "Missed" as FilterStatus },
        ].map(card => (
          <div key={card.label} className="fu-card hover-lift" onClick={() => { setFilterStatus(card.clickFilter); setActiveTab("schedule"); }}
            style={{ padding: "16px 18px", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>{card.label}</div>
              <span style={{ fontSize: "16px" }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: card.color, marginTop: "6px" }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────── */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px", background: "white", padding: "4px", borderRadius: "11px", width: "fit-content", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {([
          { key: "dashboard", label: "📊 Dashboard" },
          { key: "schedule", label: "📋 All Follow-ups" },
        ] as const).map(tab => (
          <button key={tab.key} className="tab-btn" onClick={() => setActiveTab(tab.key)}
            style={{ background: activeTab === tab.key ? "#0f4c81" : "transparent", color: activeTab === tab.key ? "white" : "#888" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
           DASHBOARD TAB
         ══════════════════════════════════════════════ */}
      {activeTab === "dashboard" && (
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>

          {/* Due Today + Overdue */}
          <div className="fu-card" style={{ padding: "20px 22px" }}>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", color: "#0f4c81", marginBottom: "16px" }}>
              📅 Due Today & Overdue
            </div>
            {followUps.filter(f => f.dueDate <= today && (f.status === "Pending" || f.status === "Confirmed" || f.status === "Missed")).length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px", color: "#bbb" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
                <div style={{ fontWeight: "600" }}>All clear! No overdue follow-ups.</div>
              </div>
            ) : followUps
              .filter(f => f.dueDate <= today && (f.status === "Pending" || f.status === "Confirmed" || f.status === "Missed"))
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .slice(0, 6)
              .map(fu => {
                const isOverdue = fu.dueDate < today;
                const daysDiff = diffDays(today, fu.dueDate);
                const pc = PRIORITY_CONFIG[fu.priority];
                const sc = STATUS_CONFIG[fu.status];
                return (
                  <div key={fu.id} style={{ padding: "12px 14px", borderRadius: "10px", border: "1.5px solid", borderColor: isOverdue ? "#fecaca" : "#e8f1fb", background: isOverdue ? "#fff5f5" : "#f8fbff", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: "700", fontSize: "14px", color: "#1a1a2e" }}>{fu.patientName}</span>
                          <span style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, padding: "1px 7px", borderRadius: "8px", fontSize: "10px", fontWeight: "700" }}>{fu.priority}</span>
                          {isOverdue && <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "1px 7px", borderRadius: "8px", fontSize: "10px", fontWeight: "800" }}>⚠ {daysDiff}d overdue</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>{fu.reason}</div>
                        {fu.diagnosis && <div style={{ fontSize: "11px", color: "#0f4c81", background: "#ebf4ff", padding: "2px 8px", borderRadius: "6px", display: "inline-block" }}>{fu.diagnosis}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                        <button className="action-btn whatsapp-btn" onClick={() => setWhatsAppFU(fu)}>📱 WhatsApp</button>
                        {fu.status === "Pending" && <button className="action-btn done-btn" onClick={() => updateStatus(fu.id, "Completed")}>✔ Done</button>}
                        {fu.status === "Missed" && <button className="action-btn confirm-btn" onClick={() => openEdit(fu)}>↺ Reschedule</button>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", alignItems: "center" }}>
                      {fu.patientPhone && !fu.reminderSent && (
                        <button className="action-btn" onClick={() => { setWhatsAppFU(fu); markReminderSent(fu.id); }}
                          style={{ background: "#f0fdf4", color: "#15803d", fontSize: "10px" }}>📤 Send Reminder</button>
                      )}
                      {fu.reminderSent && <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "600" }}>✓ Reminder sent</span>}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* 14-Day Calendar + Upcoming */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Mini calendar */}
            <div className="fu-card" style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "15px", color: "#0f4c81", marginBottom: "14px" }}>🗓 Next 14 Days</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: "10px", fontWeight: "700", color: "#aaa", padding: "3px 0" }}>{d}</div>
                ))}
                {calDays.map(day => {
                  const count = calMap[day]?.length || 0;
                  const isToday = day === today;
                  const hasHigh = calMap[day]?.some(f => f.priority === "High");
                  return (
                    <div key={day} style={{
                      textAlign: "center", padding: "4px 2px", borderRadius: "6px",
                      background: isToday ? "#0f4c81" : count > 0 ? (hasHigh ? "#fef2f2" : "#ebf4ff") : "transparent",
                      cursor: count > 0 ? "pointer" : "default",
                      border: isToday ? "none" : count > 0 ? `1px solid ${hasHigh ? "#fecaca" : "#bfdbfe"}` : "1px solid transparent",
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: isToday ? "white" : count > 0 ? (hasHigh ? "#b91c1c" : "#1e40af") : "#555" }}>
                        {new Date(day).getDate()}
                      </div>
                      {count > 0 && (
                        <div style={{ fontSize: "9px", fontWeight: "800", color: isToday ? "rgba(255,255,255,0.8)" : hasHigh ? "#b91c1c" : "#1e40af" }}>{count}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", fontSize: "10px", color: "#aaa", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><span style={{ width: "8px", height: "8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "2px", display: "inline-block" }} />High</span>
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><span style={{ width: "8px", height: "8px", background: "#ebf4ff", border: "1px solid #bfdbfe", borderRadius: "2px", display: "inline-block" }} />Med/Low</span>
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><span style={{ width: "8px", height: "8px", background: "#0f4c81", borderRadius: "2px", display: "inline-block" }} />Today</span>
              </div>
            </div>

            {/* Upcoming next 5 */}
            <div className="fu-card" style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "15px", color: "#0f4c81", marginBottom: "14px" }}>🔔 Coming Up</div>
              {followUps.filter(f => f.dueDate > today && (f.status === "Pending" || f.status === "Confirmed")).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5).map(fu => {
                const daysLeft = diffDays(fu.dueDate, today);
                const pc = PRIORITY_CONFIG[fu.priority];
                return (
                  <div key={fu.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#ebf4ff", color: "#0f4c81", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>
                      {fu.patientName.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fu.patientName}</div>
                      <div style={{ fontSize: "11px", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fu.reason}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: daysLeft <= 3 ? "#b91c1c" : "#0f4c81" }}>
                        {daysLeft === 1 ? "Tomorrow" : `In ${daysLeft}d`}
                      </div>
                      <span style={{ background: pc.bg, color: pc.color, fontSize: "9px", fontWeight: "700", padding: "1px 5px", borderRadius: "5px" }}>{fu.priority}</span>
                    </div>
                  </div>
                );
              })}
              {followUps.filter(f => f.dueDate > today && (f.status === "Pending" || f.status === "Confirmed")).length === 0 && (
                <div style={{ color: "#bbb", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>No upcoming follow-ups</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
           SCHEDULE TAB
         ══════════════════════════════════════════════ */}
      {activeTab === "schedule" && (
        <div className="fade-in">
          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" placeholder="Search patient or diagnosis..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
              style={{ ...inputStyle, width: "240px" }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)} style={{ ...inputStyle, width: "auto" }}>
              <option value="All">All Status</option>
              {["Pending", "Confirmed", "Completed", "Missed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)} style={{ ...inputStyle, width: "auto" }}>
              <option value="All">All Priority</option>
              {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
            </select>
            <span style={{ fontSize: "12px", color: "#888" }}>{filtered.length} results</span>
          </div>

          <div className="fu-card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0f4c81" }}>
                  {["Patient", "Due Date", "Diagnosis / Reason", "Priority", "Status", "Reminder", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", color: "white", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px", textAlign: "left", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>🗓</div>
                    <div style={{ fontWeight: "600" }}>No follow-ups found</div>
                  </td></tr>
                ) : filtered.map((fu, i) => {
                  const isOverdue = fu.dueDate < today && fu.status !== "Completed" && fu.status !== "Cancelled";
                  const daysLeft = diffDays(fu.dueDate, today);
                  const pc = PRIORITY_CONFIG[fu.priority];
                  const sc = STATUS_CONFIG[fu.status];
                  return (
                    <tr key={fu.id} style={{ borderBottom: "1px solid #f5f5f5", background: isOverdue ? "#fff9f9" : i % 2 === 0 ? "white" : "#fafbfc" }}>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "13px" }}>{fu.patientName}</div>
                        {fu.patientPhone && <div style={{ fontSize: "11px", color: "#888" }}>{fu.patientPhone}</div>}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: isOverdue ? "#b91c1c" : daysLeft <= 2 ? "#b45309" : "#1a1a2e" }}>
                          {fShort(fu.dueDate)}
                        </div>
                        <div style={{ fontSize: "11px", color: isOverdue ? "#ef4444" : "#888" }}>
                          {isOverdue ? `⚠ ${Math.abs(daysLeft)}d overdue` : fu.dueDate === today ? "Today" : `In ${daysLeft}d`}
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", maxWidth: "200px" }}>
                        {fu.diagnosis && <div style={{ fontSize: "11px", color: "#0f4c81", background: "#ebf4ff", padding: "2px 7px", borderRadius: "5px", display: "inline-block", marginBottom: "3px" }}>{fu.diagnosis}</div>}
                        <div style={{ fontSize: "12px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fu.reason}</div>
                        {fu.notes && <div style={{ fontSize: "11px", color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fu.notes}</div>}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                          <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: pc.dot, marginRight: "5px", verticalAlign: "middle" }} />
                          {fu.priority}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>{sc.icon} {fu.status}</span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        {fu.reminderSent
                          ? <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>✓ Sent</span>
                          : <span style={{ fontSize: "11px", color: "#aaa" }}>Not sent</span>}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {fu.patientPhone && <button className="action-btn whatsapp-btn" onClick={() => { setWhatsAppFU(fu); markReminderSent(fu.id); }}>📱</button>}
                          {(fu.status === "Pending" || fu.status === "Confirmed") && <button className="action-btn done-btn" onClick={() => updateStatus(fu.id, "Completed")}>✔</button>}
                          {fu.status === "Pending" && <button className="action-btn confirm-btn" onClick={() => updateStatus(fu.id, "Confirmed")}>📅</button>}
                          <button className="action-btn edit-btn" onClick={() => openEdit(fu)}>✏</button>
                          <button className="action-btn del-btn" onClick={() => deleteFU(fu.id)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
           ADD / EDIT MODAL
         ══════════════════════════════════════════════ */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", borderRadius: "16px", width: "620px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "26px 28px", borderBottom: "1px solid #f0f0f0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "20px", color: "#0f4c81", margin: 0 }}>
                {editingFU ? "Edit Follow-up" : "Schedule Follow-up"}
              </h2>
              <p style={{ color: "#999", fontSize: "13px", marginTop: "4px" }}>Fill in details — AI will suggest the optimal date based on diagnosis</p>
            </div>
            <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Patient */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Patient Name *</label>
                  {patients.length > 0 ? (
                    <select style={inputStyle} value={form.patientId} onChange={e => {
                      const pat = patients.find(p => p.id === e.target.value);
                      setForm(f => ({ ...f, patientId: e.target.value, patientName: pat?.name || "", patientPhone: pat?.phone || "" }));
                    }}>
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  ) : (
                    <input style={inputStyle} placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Phone (for WhatsApp)</label>
                  <input style={inputStyle} placeholder="e.g. 9876543210" value={form.patientPhone} onChange={e => setForm(f => ({ ...f, patientPhone: e.target.value }))} />
                </div>
              </div>

              {/* Diagnosis — triggers auto-suggest */}
              <div>
                <label style={labelStyle}>Diagnosis / Condition</label>
                <input style={inputStyle} placeholder="e.g. Hypertension, Diabetes, URTI..." value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              </div>

              {/* 🤖 AI Suggestion box */}
              {suggestion && (
                <div style={{ background: "linear-gradient(135deg, #ebf4ff, #f0fdf4)", border: "1.5px solid #bfdbfe", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f4c81", marginBottom: "4px" }}>🤖 Smart Suggestion</div>
                      <div style={{ fontSize: "13px", color: "#333" }}>
                        <strong>Follow-up in {suggestion.days} days</strong> — {fDate(addDays(todayStr(), suggestion.days))}
                      </div>
                      <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>Reason: {suggestion.reason}</div>
                      <div style={{ marginTop: "6px" }}>
                        <span style={{ background: PRIORITY_CONFIG[suggestion.priority].bg, color: PRIORITY_CONFIG[suggestion.priority].color, border: `1px solid ${PRIORITY_CONFIG[suggestion.priority].border}`, padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "700" }}>
                          {suggestion.priority} Priority
                        </span>
                      </div>
                    </div>
                    <button onClick={applySuggestion} style={{ background: "#0f4c81", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "inherit", flexShrink: 0 }}>
                      Apply →
                    </button>
                  </div>
                </div>
              )}

              {/* Date + Priority */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Follow-up Date *</label>
                  <input type="date" style={inputStyle} value={form.dueDate} min={todayStr()} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["High", "Medium", "Low"] as const).map(p => {
                      const pc = PRIORITY_CONFIG[p];
                      return (
                        <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{
                          flex: 1, padding: "9px 0", borderRadius: "8px", border: "1.5px solid", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: "700",
                          background: form.priority === p ? pc.bg : "white",
                          color: form.priority === p ? pc.color : "#aaa",
                          borderColor: form.priority === p ? pc.border : "#e2e8f0",
                        }}>{p}</button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={labelStyle}>Reason for Follow-up</label>
                <input style={inputStyle} placeholder="e.g. BP monitoring, medication review, lab results..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>

              {/* Link to prescription */}
              {prescriptions.length > 0 && (
                <div>
                  <label style={labelStyle}>Link to Prescription (optional)</label>
                  <select style={inputStyle} value={form.prescriptionId} onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}>
                    <option value="">No prescription linked</option>
                    {prescriptions.slice(0, 20).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.patients?.name || p.patName || "Unknown"} — {(p.diagnosis || p.diagnosis || "").slice(0, 40)} ({(p.created_at || p.date || "").slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={labelStyle}>Doctor's Notes</label>
                <textarea style={{ ...inputStyle, minHeight: "60px", resize: "none" }} placeholder="Special instructions, tests to bring, things to monitor..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setShowAddModal(false); setEditingFU(null); resetForm(); }}
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Cancel</button>
                <button onClick={saveFollowUp}
                  style={{ flex: 2, padding: "12px", borderRadius: "8px", background: "#0f4c81", color: "white", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700" }}>
                  {editingFU ? "Save Changes" : "Schedule Follow-up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
           WHATSAPP MESSAGE MODAL
         ══════════════════════════════════════════════ */}
      {whatsAppFU && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", borderRadius: "16px", width: "480px", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "22px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>📱</span>
              <div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "18px", color: "#0f4c81" }}>Send WhatsApp Reminder</div>
                <div style={{ fontSize: "12px", color: "#888" }}>To: {whatsAppFU.patientName} · {whatsAppFU.patientPhone}</div>
              </div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* Message preview */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", fontFamily: "monospace", fontSize: "12px", color: "#333", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                {`Namaste ${whatsAppFU.patientName} ji 🙏\n\nThis is a reminder from *${hospitalConfig.name}* (${hospitalConfig.doctorName}).\n\nYour follow-up appointment is due *${whatsAppFU.dueDate === todayStr() ? "today" : whatsAppFU.dueDate === addDays(todayStr(), 1) ? "tomorrow" : `on ${fDate(whatsAppFU.dueDate)}`}*.\nReason: ${whatsAppFU.reason}\n\nPlease call us to confirm: *${hospitalConfig.phone}*\n\nStay healthy! 💚`}
              </div>
              {whatsAppFU.patientPhone ? (
                <a href={`https://wa.me/91${whatsAppFU.patientPhone}?text=${buildWhatsAppMsg(whatsAppFU)}`} target="_blank" rel="noreferrer"
                  style={{ display: "block", textAlign: "center", background: "#16a34a", color: "white", padding: "13px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", textDecoration: "none", marginBottom: "10px" }}>
                  Open WhatsApp ↗
                </a>
              ) : (
                <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", marginBottom: "10px" }}>
                  ⚠ No phone number saved for this patient.
                </div>
              )}
              <button onClick={() => setWhatsAppFU(null)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "13px", color: "#555" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}