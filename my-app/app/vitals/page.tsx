"use client";
import { useEffect, useState, useRef } from "react";
import hospitalConfig from "@/config/hospital";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

interface VitalRecord {
  id: string; patient_id: string;
  bp_systolic: number | null; bp_diastolic: number | null;
  sugar_fasting: number | null; sugar_random: number | null;
  weight: number | null; temperature: number | null;
  spo2: number | null; pulse: number | null;
  notes: string; recorded_at: string;
}
interface Patient { id: string; name: string; age?: number; gender?: string; phone?: string; }

const NORMAL_RANGES = {
  bp_systolic:   { min: 90,  max: 140, label: "Normal BP systolic" },
  bp_diastolic:  { min: 60,  max: 90,  label: "Normal BP diastolic" },
  sugar_fasting: { min: 70,  max: 100, label: "Normal fasting sugar" },
  sugar_random:  { min: 70,  max: 140, label: "Normal random sugar" },
  weight:        { min: null, max: null, label: "" },
  temperature:   { min: 97,  max: 99,  label: "Normal temp" },
  spo2:          { min: 95,  max: 100, label: "Normal SpO2" },
  pulse:         { min: 60,  max: 100, label: "Normal pulse" },
};

function vitalStatus(key: keyof typeof NORMAL_RANGES, val: number | null): "normal" | "high" | "low" | "unknown" {
  if (val === null || val === undefined) return "unknown";
  const r = NORMAL_RANGES[key];
  if (!r.min && !r.max) return "unknown";
  if (r.max && val > r.max) return "high";
  if (r.min && val < r.min) return "low";
  return "normal";
}

const STATUS_STYLE = {
  normal:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "Normal" },
  high:    { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "High" },
  low:     { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Low" },
  unknown: { bg: "#f8fbff", color: "#888",    border: "#e2e8f0", label: "—" },
};

const CHART_COLORS = {
  bp_systolic: "#0f4c81", bp_diastolic: "#1a6bb5",
  sugar_fasting: "#b45309", sugar_random: "#d97706",
  weight: "#065f46", temperature: "#7c3aed",
  spo2: "#0e7490", pulse: "#be185d",
};

const VITAL_LABELS: Record<string, string> = {
  bp_systolic: "BP Systolic", bp_diastolic: "BP Diastolic",
  sugar_fasting: "Sugar (Fasting)", sugar_random: "Sugar (Random)",
  weight: "Weight", temperature: "Temperature", spo2: "SpO2", pulse: "Pulse",
};
const VITAL_UNITS: Record<string, string> = {
  bp_systolic: "mmHg", bp_diastolic: "mmHg",
  sugar_fasting: "mg/dL", sugar_random: "mg/dL",
  weight: "kg", temperature: "°F", spo2: "%", pulse: "bpm",
};

function fDate(d: string) { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function fDateTime(d: string) { return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }

export default function VitalsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeChart, setActiveChart] = useState<"bp" | "sugar" | "weight" | "other">("bp");
  const [searchQuery, setSearchQuery] = useState("");

  const emptyForm = {
    bp_systolic: "", bp_diastolic: "",
    sugar_fasting: "", sugar_random: "",
    weight: "", temperature: "", spo2: "", pulse: "",
    notes: "", recorded_at: new Date().toISOString().slice(0, 16),
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/patients").then(r => r.json()).then(res => {
      if (res.success && Array.isArray(res.data)) setPatients(res.data);
    }).catch(console.error).finally(() => setPageLoading(false));
  }, []);

  async function loadVitals(patientId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/vitals?patient_id=${patientId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVitals(data.sort((a: VitalRecord, b: VitalRecord) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function selectPatient(p: Patient) { setSelectedPatient(p); setShowForm(false); loadVitals(p.id); }

  async function saveVitals() {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      const payload = {
        patient_id: selectedPatient.id,
        bp_systolic:   form.bp_systolic   ? parseInt(form.bp_systolic)   : null,
        bp_diastolic:  form.bp_diastolic  ? parseInt(form.bp_diastolic)  : null,
        sugar_fasting: form.sugar_fasting ? parseInt(form.sugar_fasting) : null,
        sugar_random:  form.sugar_random  ? parseInt(form.sugar_random)  : null,
        weight:        form.weight        ? parseFloat(form.weight)      : null,
        temperature:   form.temperature   ? parseFloat(form.temperature) : null,
        spo2:          form.spo2          ? parseInt(form.spo2)          : null,
        pulse:         form.pulse         ? parseInt(form.pulse)         : null,
        notes: form.notes,
        recorded_at: form.recorded_at ? new Date(form.recorded_at).toISOString() : new Date().toISOString(),
      };
      const res = await fetch("/api/vitals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setForm(emptyForm); setShowForm(false);
      loadVitals(selectedPatient.id);
    } catch (err: any) { alert("Failed to save: " + err.message); }
    finally { setSaving(false); }
  }

  async function deleteVital(id: string) {
    if (!confirm("Delete this record?")) return;
    await fetch("/api/vitals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (selectedPatient) loadVitals(selectedPatient.id);
  }

  const latest = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const chartData = vitals.map(v => ({
    date: new Date(v.recorded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    bp_systolic: v.bp_systolic, bp_diastolic: v.bp_diastolic,
    sugar_fasting: v.sugar_fasting, sugar_random: v.sugar_random,
    weight: v.weight, temperature: v.temperature, spo2: v.spo2, pulse: v.pulse,
  }));

  const filteredPatients = patients.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone?.includes(searchQuery));

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: "8px",
    border: "1.5px solid #e2e8f0", fontSize: "13px",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  function VitalCard({ label, value, unit, statusKey }: {
    label: string; value: number | null; unit: string;
    statusKey: keyof typeof NORMAL_RANGES;
  }) {
    const status = vitalStatus(statusKey, value);
    const s = STATUS_STYLE[status];
    return (
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "12px",
        border: `1.5px solid ${value !== null ? s.border : "#e2e8f0"}`,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        /* FIX: ensure card never overflows its grid cell */
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}>
        <div style={{ fontSize: "9px", color: "#999", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ fontSize: "20px", fontWeight: "700", color: value !== null ? s.color : "#ccc" }}>
          {value !== null ? value : "—"}
          {value !== null && <span style={{ fontSize: "11px", fontWeight: "500", marginLeft: "3px", color: "#aaa" }}>{unit}</span>}
        </div>
        {value !== null && status !== "unknown" && (
          <div style={{ fontSize: "10px", fontWeight: "700", color: s.color, background: s.bg, padding: "2px 7px", borderRadius: "20px", width: "fit-content" }}>{s.label}</div>
        )}
      </div>
    );
  }

  return (
    /* FIX: removed overflowX:"hidden" (was masking overflow instead of fixing it),
       replaced with maxWidth:"100%" and proper box-sizing */
    <div style={{
      padding: "1rem",
      minHeight: "100vh",
      background: "#f0f4f8",
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: "border-box",
      maxWidth: "100%",
      /* overflowX removed — clip/hidden cuts off Recharts SVG on all platforms */
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" />
      <style>{`
        /* FIX: global box-sizing so nothing escapes its container */
        *, *::before, *::after { box-sizing: border-box; }
        /* FIX: images always fit */
        img { max-width: 100%; height: auto; display: block; }

        input:focus, select:focus, textarea:focus { outline: none !important; border-color: #0f4c81 !important; box-shadow: 0 0 0 3px rgba(15,76,129,0.1) !important; }
        .patient-row:hover { background: #ebf8ff !important; cursor: pointer; }
        .patient-row.active { background: #dbeafe !important; }
        .tab-btn { border: none; cursor: pointer; padding: 8px 18px; border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 600; transition: all 0.15s; }
        .chart-tab { padding: 6px 14px; border-radius: 20px; border: 1.5px solid; cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
        .vital-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .vital-form-grid { grid-template-columns: 1fr; } }
        .modal-anim { animation: slideUp 0.2s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* FIX: stat-grid
           - Desktop (>900px): 4 columns
           - Tablet (601–900px): 2 columns
           - Mobile (≤600px): 2 columns, tighter gap
           - Very small (≤360px): 1 column
        */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 900px) {
          .stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 360px) {
          .stat-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }

        .delete-btn { background: none; border: none; cursor: pointer; color: #e2e8f0; font-size: 14px; padding: 4px 8px; border-radius: 6px; transition: all 0.15s; }
        .delete-btn:hover { background: #fee2e2; color: #e53e3e; }
        .chart-tabs-scroll { display: flex; gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 2px; flex-wrap: nowrap; }

        /* FIX: page header stacks on mobile */
        .vitals-page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        @media (max-width: 600px) {
          .vitals-page-header { flex-direction: column !important; align-items: stretch !important; }
          .vitals-record-btn { width: 100% !important; text-align: center !important; justify-content: center !important; }
        }

        /* FIX: patient banner wraps on small screens */
        .patient-banner {
          background: linear-gradient(135deg, #0f4c81, #1a6bb5);
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;       /* KEY FIX: wrap so right side doesn't get clipped */
          gap: 10px;             /* gap between left and right when wrapped */
          width: 100%;
          box-sizing: border-box;
        }
        .patient-banner-left { min-width: 0; flex: 1 1 auto; }
        .patient-banner-right { flex: 0 0 auto; text-align: right; }

        .chart-container { background: white; border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: visible; }
        @media (max-width: 480px) {
          .chart-container { padding: 12px !important; }
        }
        /* FIX: Recharts SVG must never be clipped */
        .recharts-wrapper { overflow: visible !important; }
        .recharts-surface { overflow: visible !important; }
        .recharts-wrapper svg { overflow: visible !important; }
      `}</style>

      {/* Page header */}
      <div className="vitals-page-header">
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#0f4c81", margin: 0 }}>Patient Vitals</h1>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>
            {hospitalConfig.name} · Track BP, sugar, weight and more over time
          </p>
        </div>
        {selectedPatient && (
          <button className="vitals-record-btn"
            onClick={() => { setShowForm(true); setForm({ ...emptyForm, recorded_at: new Date().toISOString().slice(0, 16) }); }}
            style={{ background: "#0f4c81", color: "white", border: "none", padding: "11px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(15,76,129,0.25)", display: "flex", alignItems: "center", gap: "6px" }}>
            + Record Vitals
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", alignItems: "start" }}>

        {/* Patient list */}
        <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ background: "linear-gradient(135deg, #0f4c81, #1a6bb5)", padding: "14px 16px" }}>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "10px" }}>Select Patient</div>
            <input placeholder="Search name or phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", fontSize: "12px", padding: "7px 10px" }} />
          </div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {pageLoading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>Loading patients...</div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>No patients found</div>
            ) : filteredPatients.map(p => (
              <div key={p.id} className={`patient-row${selectedPatient?.id === p.id ? " active" : ""}`}
                onClick={() => selectPatient(p)}
                style={{ padding: "12px 16px", borderBottom: "1px solid #f5f5f5", transition: "background 0.1s" }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#1a1a2e" }}>{p.name}</div>
                <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                  {p.age ? `${p.age} yrs` : ""}{p.age && p.phone ? " · " : ""}{p.phone || ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vitals panel */}
        <div style={{ minWidth: 0, width: "100%" }}>
          {!selectedPatient ? (
            <div style={{ background: "white", borderRadius: "14px", padding: "60px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🩺</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", marginBottom: "8px" }}>Select a patient</div>
              <div style={{ fontSize: "14px", color: "#999" }}>Choose a patient from above to view or record their vitals</div>
            </div>
          ) : loading ? (
            <div style={{ background: "white", borderRadius: "14px", padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "14px", color: "#999" }}>Loading vitals...</div>
            </div>
          ) : (
            <>
              {/* FIX: Patient banner — now uses .patient-banner class with flexWrap */}
              <div className="patient-banner">
                <div className="patient-banner-left">
                  <div style={{ color: "white", fontFamily: "'DM Serif Display', serif", fontSize: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedPatient.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginTop: "2px" }}>
                    {selectedPatient.age ? `${selectedPatient.age} yrs` : ""}
                    {` · ${vitals.length} vital record${vitals.length !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <div className="patient-banner-right">
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", marginBottom: "4px" }}>Last recorded</div>
                  <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>{latest ? fDateTime(latest.recorded_at) : "Never"}</div>
                </div>
              </div>

              {/* Vital cards — FIX: stat-grid now properly 2-col on mobile, 4-col on desktop */}
              {latest && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
                    Latest readings · {fDateTime(latest.recorded_at)}
                  </div>
                  <div className="stat-grid">
                    <VitalCard label="BP Systolic"     value={latest.bp_systolic}   unit="mmHg"  statusKey="bp_systolic" />
                    <VitalCard label="BP Diastolic"    value={latest.bp_diastolic}  unit="mmHg"  statusKey="bp_diastolic" />
                    <VitalCard label="Sugar (Fasting)" value={latest.sugar_fasting} unit="mg/dL" statusKey="sugar_fasting" />
                    <VitalCard label="Sugar (Random)"  value={latest.sugar_random}  unit="mg/dL" statusKey="sugar_random" />
                    <VitalCard label="Weight"          value={latest.weight}        unit="kg"    statusKey="weight" />
                    <VitalCard label="Temperature"     value={latest.temperature}   unit="°F"    statusKey="temperature" />
                    <VitalCard label="SpO2"            value={latest.spo2}          unit="%"     statusKey="spo2" />
                    <VitalCard label="Pulse"           value={latest.pulse}         unit="bpm"   statusKey="pulse" />
                  </div>
                </div>
              )}

              {/* Charts */}
              {vitals.length >= 2 && (
                <div className="chart-container">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ fontWeight: "700", color: "#0f4c81", fontSize: "15px" }}>Trend Charts</div>
                    <div className="chart-tabs-scroll">
                      {(["bp", "sugar", "weight", "other"] as const).map(tab => (
                        <button key={tab} className="chart-tab" onClick={() => setActiveChart(tab)}
                          style={{ background: activeChart === tab ? "#0f4c81" : "white", color: activeChart === tab ? "white" : "#555", borderColor: activeChart === tab ? "#0f4c81" : "#e2e8f0" }}>
                          {tab === "bp" ? "Blood Pressure" : tab === "sugar" ? "Blood Sugar" : tab === "weight" ? "Weight" : "SpO2 / Pulse"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ width: "100%", height: "240px" }}>
                    <ResponsiveContainer width="99%" height={240}>
                      {/* isAnimationActive={false} on ALL Lines — animation never completes in Capacitor WebView causing lines to stay invisible */}
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#999" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#999" }} width={40} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                          formatter={(val: any, name: any) => [`${val} ${VITAL_UNITS[name] || ""}`, VITAL_LABELS[name] || name]} />
                        <Legend formatter={(val) => VITAL_LABELS[val] || val} />
                        {activeChart === "bp" && <>
                          <ReferenceLine y={140} stroke="#fca5a5" strokeDasharray="4 4" />
                          <ReferenceLine y={90}  stroke="#fde68a" strokeDasharray="4 4" />
                          <Line isAnimationActive={false} type="monotone" dataKey="bp_systolic"  stroke={CHART_COLORS.bp_systolic}  strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                          <Line isAnimationActive={false} type="monotone" dataKey="bp_diastolic" stroke={CHART_COLORS.bp_diastolic} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        </>}
                        {activeChart === "sugar" && <>
                          <ReferenceLine y={100} stroke="#fca5a5" strokeDasharray="4 4" />
                          <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 4" />
                          <Line isAnimationActive={false} type="monotone" dataKey="sugar_fasting" stroke={CHART_COLORS.sugar_fasting} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                          <Line isAnimationActive={false} type="monotone" dataKey="sugar_random"  stroke={CHART_COLORS.sugar_random}  strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        </>}
                        {activeChart === "weight" && (
                          <Line isAnimationActive={false} type="monotone" dataKey="weight" stroke={CHART_COLORS.weight} strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} connectNulls />
                        )}
                        {activeChart === "other" && <>
                          <ReferenceLine y={95} stroke="#fde68a" strokeDasharray="4 4" />
                          <Line isAnimationActive={false} type="monotone" dataKey="spo2"        stroke={CHART_COLORS.spo2}        strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                          <Line isAnimationActive={false} type="monotone" dataKey="pulse"       stroke={CHART_COLORS.pulse}       strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                          <Line isAnimationActive={false} type="monotone" dataKey="temperature" stroke={CHART_COLORS.temperature} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        </>}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {vitals.length === 1 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#b45309" }}>
                  📊 Record at least 2 visits to see trend charts
                </div>
              )}

              {/* Records table */}
              <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f4f8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: "700", color: "#0f4c81", fontSize: "15px" }}>All Records</div>
                  <div style={{ fontSize: "12px", color: "#999" }}>{vitals.length} entries</div>
                </div>
                {vitals.length === 0 ? (
                  <div style={{ padding: "50px", textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
                    <div style={{ fontWeight: "700", color: "#999", marginBottom: "8px" }}>No vitals recorded yet</div>
                  </div>
                ) : (
                  /* FIX: table wrapper gets overflowX:auto so it scrolls internally, not the whole page */
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any, width: "100%" }}>
                    <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f8fbff" }}>
                          {["Date & Time", "BP (mmHg)", "Sugar (mg/dL)", "Weight", "Temp °F", "SpO2 %", "Pulse", "Notes", ""].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#999", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...vitals].reverse().map((v, i) => {
                          const bpStatus = vitalStatus("bp_systolic", v.bp_systolic);
                          const sugarStatus = vitalStatus("sugar_fasting", v.sugar_fasting);
                          return (
                            <tr key={v.id} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                              <td style={{ padding: "11px 14px", fontWeight: "600", color: "#1a1a2e", whiteSpace: "nowrap" }}>{fDateTime(v.recorded_at)}</td>
                              <td style={{ padding: "11px 14px" }}>
                                {v.bp_systolic && v.bp_diastolic ? (
                                  <span style={{ background: STATUS_STYLE[bpStatus].bg, color: STATUS_STYLE[bpStatus].color, padding: "3px 10px", borderRadius: "12px", fontWeight: "700" }}>
                                    {v.bp_systolic}/{v.bp_diastolic}
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ padding: "11px 14px" }}>
                                {v.sugar_fasting || v.sugar_random ? (
                                  <span style={{ background: STATUS_STYLE[sugarStatus].bg, color: STATUS_STYLE[sugarStatus].color, padding: "3px 10px", borderRadius: "12px", fontWeight: "700" }}>
                                    {v.sugar_fasting ? `F: ${v.sugar_fasting}` : ""}{v.sugar_fasting && v.sugar_random ? " · " : ""}{v.sugar_random ? `R: ${v.sugar_random}` : ""}
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ padding: "11px 14px", color: "#555" }}>{v.weight ? `${v.weight} kg` : "—"}</td>
                              <td style={{ padding: "11px 14px", color: "#555" }}>{v.temperature ? `${v.temperature}°` : "—"}</td>
                              <td style={{ padding: "11px 14px" }}>
                                {v.spo2 ? (
                                  <span style={{ background: v.spo2 < 95 ? "#fef2f2" : "#f0fdf4", color: v.spo2 < 95 ? "#b91c1c" : "#15803d", padding: "3px 10px", borderRadius: "12px", fontWeight: "700" }}>
                                    {v.spo2}%
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ padding: "11px 14px", color: "#555" }}>{v.pulse ? `${v.pulse} bpm` : "—"}</td>
                              <td style={{ padding: "11px 14px", color: "#888", fontSize: "12px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.notes || "—"}</td>
                              <td style={{ padding: "11px 14px" }}>
                                <button className="delete-btn" onClick={() => deleteVital(v.id)}>✕</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Record Vitals Modal */}
      {showForm && selectedPatient && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="modal-anim" style={{ background: "white", borderRadius: "16px", width: "520px", maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ background: "linear-gradient(135deg, #0f4c81, #1a6bb5)", padding: "20px 24px", borderRadius: "16px 16px 0 0" }}>
              <div style={{ color: "white", fontFamily: "'DM Serif Display', serif", fontSize: "18px" }}>Record Vitals</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", marginTop: "2px" }}>{selectedPatient.name}</div>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Date & Time</label>
                <input type="datetime-local" style={inputStyle} value={form.recorded_at} onChange={e => setForm(f => ({ ...f, recorded_at: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#0f4c81", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>🫀 Blood Pressure</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Systolic (mmHg)</div>
                    <input type="number" placeholder="e.g. 120" style={inputStyle} value={form.bp_systolic} onChange={e => setForm(f => ({ ...f, bp_systolic: e.target.value }))} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Diastolic (mmHg)</div>
                    <input type="number" placeholder="e.g. 80" style={inputStyle} value={form.bp_diastolic} onChange={e => setForm(f => ({ ...f, bp_diastolic: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>🩸 Blood Sugar</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Fasting (mg/dL)</div>
                    <input type="number" placeholder="e.g. 95" style={inputStyle} value={form.sugar_fasting} onChange={e => setForm(f => ({ ...f, sugar_fasting: e.target.value }))} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Random / PP (mg/dL)</div>
                    <input type="number" placeholder="e.g. 130" style={inputStyle} value={form.sugar_random} onChange={e => setForm(f => ({ ...f, sugar_random: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#065f46", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>📊 Other Vitals</label>
                <div className="vital-form-grid">
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Weight (kg)</div>
                    <input type="number" step="0.1" placeholder="e.g. 68.5" style={inputStyle} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Temperature (°F)</div>
                    <input type="number" step="0.1" placeholder="e.g. 98.6" style={inputStyle} value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>SpO2 (%)</div>
                    <input type="number" placeholder="e.g. 98" style={inputStyle} value={form.spo2} onChange={e => setForm(f => ({ ...f, spo2: e.target.value }))} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Pulse (bpm)</div>
                    <input type="number" placeholder="e.g. 72" style={inputStyle} value={form.pulse} onChange={e => setForm(f => ({ ...f, pulse: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Notes</label>
                <textarea placeholder="Any observations, symptoms, or context..."
                  style={{ ...inputStyle, minHeight: "60px", resize: "none" }}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", fontFamily: "inherit", color: "#555" }}>Cancel</button>
                <button onClick={saveVitals} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: "8px", border: "none", background: saving ? "#93c5fd" : "#0f4c81", color: "white", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", fontFamily: "inherit" }}>
                  {saving ? "Saving..." : "Save Vitals"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
