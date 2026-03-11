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

const TYPE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "General Patient": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Emergency":       { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  "Follow-up":       { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
};

const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1e40af" },
  { bg: "#d1fae5", color: "#065f46" },
  { bg: "#ede9fe", color: "#6d28d9" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#e0f2fe", color: "#0369a1" },
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState<"name"|"age"|"recent">("recent");
  const [viewMode, setViewMode] = useState<"table"|"grid">("table");

  const [form, setForm] = useState({
    name: "", dob: "", blood_group: "", phone: "",
    type: "General Patient", address: "", allergies: "",
  });
  const previewAge = form.dob ? calcAge(form.dob) : null;

  useEffect(() => { loadPatients(); }, []);

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

  // Filter + sort
  let displayed = patients.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery);
    const matchType = filterType === "All" || p.type === filterType;
    return matchSearch && matchType;
  });
  if (sortBy === "name") displayed = [...displayed].sort((a, b) => a.name?.localeCompare(b.name));
  if (sortBy === "age") displayed = [...displayed].sort((a, b) => (b.age || 0) - (a.age || 0));

  const stats = {
    total: patients.length,
    general: patients.filter(p => p.type === "General Patient").length,
    emergency: patients.filter(p => p.type === "Emergency").length,
    followup: patients.filter(p => p.type === "Follow-up").length,
    withAllergy: patients.filter(p => p.allergies).length,
  };

  const inp: any = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1.5px solid #e2e8f0", fontSize: "14px",
    boxSizing: "border-box", fontFamily: "'Outfit', sans-serif",
    background: "#f8fafc", color: "#1a1a2e", transition: "all 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --navy: #0f4c81;
          --surface: #ffffff;
          --border: #e8edf2;
          --text-1: #0d1b2e;
          --text-2: #4a5568;
          --text-3: #94a3b8;
          --shadow-sm: 0 1px 3px rgba(15,76,129,0.06);
          --shadow-md: 0 4px 16px rgba(15,76,129,0.10);
          --radius: 16px;
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }

        .page-wrap { animation: fadeIn 0.35s ease; padding: 28px 32px; max-width: 1400px; margin: 0 auto; }

        .stat-pill {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 20px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s, box-shadow 0.2s;
          animation: fadeSlideUp 0.4s ease both;
        }
        .stat-pill:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .patient-row {
          border-bottom: 1px solid #f0f5fa;
          transition: background 0.15s;
          animation: fadeSlideUp 0.3s ease both;
        }
        .patient-row:hover td { background: #f5f9ff !important; }
        .patient-row:last-child { border-bottom: none; }

        .patient-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px;
          transition: all 0.2s;
          animation: fadeSlideUp 0.3s ease both;
          box-shadow: var(--shadow-sm);
        }
        .patient-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: #bfdbfe;
        }

        .filter-chip {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1.5px solid var(--border);
          background: white;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          color: var(--text-2);
        }
        .filter-chip:hover { border-color: var(--navy); color: var(--navy); }
        .filter-chip.active { background: var(--navy); color: white; border-color: var(--navy); }

        .action-btn {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12px; font-weight: 700;
          border: 1.5px solid #dbeafe;
          background: #eff6ff;
          color: #1d4ed8;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 4px;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .action-btn:hover { background: #dbeafe; border-color: #93c5fd; transform: translateY(-1px); }

        .skeleton {
          background: linear-gradient(90deg, #f0f4f8 25%, #e8edf2 50%, #f0f4f8 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }

        .view-toggle {
          display: flex;
          border: 1.5px solid var(--border);
          border-radius: 9px;
          overflow: hidden;
        }
        .view-btn {
          padding: 7px 12px;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 15px;
          transition: background 0.15s;
        }
        .view-btn.active { background: var(--navy); }
        .view-btn:hover:not(.active) { background: #f0f4f8; }

        input:focus, select:focus, textarea:focus {
          outline: none !important;
          border-color: var(--navy) !important;
          box-shadow: 0 0 0 3px rgba(15,76,129,0.1) !important;
          background: white !important;
        }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(10,20,40,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 20px;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .modal-box {
          background: white; border-radius: 20px;
          width: 500px; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.25);
          animation: fadeSlideUp 0.25s ease;
        }

        .blood-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 6px;
          font-size: 10px; font-weight: 800;
          background: #fff1f2; color: #be123c;
          border: 1px solid #fecdd3;
        }
      `}</style>

      <div className="page-wrap">

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", color: "#0d1b2e", margin: 0, letterSpacing: "-0.5px" }}>
              Patient Directory
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "4px" }}>
              {loading ? "Loading..." : `${patients.length} patients registered`}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} style={{
            background: "linear-gradient(135deg, #0f4c81, #1a6bbf)",
            color: "white", border: "none", padding: "11px 22px",
            borderRadius: "11px", cursor: "pointer", fontWeight: "700",
            fontSize: "14px", fontFamily: "'Outfit', sans-serif",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 14px rgba(15,76,129,0.35)",
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: "18px" }}>＋</span> Register Patient
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "Total Patients", value: stats.total, icon: "👥", color: "#0f4c81", bg: "#e8f0fe" },
            { label: "General", value: stats.general, icon: "🏥", color: "#1d4ed8", bg: "#eff6ff" },
            { label: "Emergency", value: stats.emergency, icon: "🚨", color: "#be123c", bg: "#fff1f2" },
            { label: "Follow-up", value: stats.followup, icon: "🔄", color: "#15803d", bg: "#f0fdf4" },
            { label: "With Allergies", value: stats.withAllergy, icon: "⚠️", color: "#b45309", bg: "#fffbeb" },
          ].map((s, i) => (
            <div key={s.label} className="stat-pill" style={{ animationDelay: `${i * 0.06}s` }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: s.color, lineHeight: 1 }}>
                  {loading ? <div className="skeleton" style={{ width: "30px", height: "24px" }} /> : s.value}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: "500" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ background: "white", border: "1px solid #e8edf2", borderRadius: "14px", padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", boxShadow: "var(--shadow-sm)" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "320px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#94a3b8", pointerEvents: "none" }}>🔍</span>
            <input
              type="text" placeholder="Search by name or phone..."
              style={{ ...inp, paddingLeft: "36px", margin: 0 }}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["All", "General Patient", "Emergency", "Follow-up"].map(t => (
              <button key={t} className={`filter-chip ${filterType === t ? "active" : ""}`} onClick={() => setFilterType(t)}>
                {t === "General Patient" ? "General" : t}
                {t !== "All" && <span style={{ marginLeft: "4px", opacity: 0.7 }}>
                  ({t === "General Patient" ? stats.general : t === "Emergency" ? stats.emergency : stats.followup})
                </span>}
              </button>
            ))}
          </div>

          {/* Sort + View */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              style={{ ...inp, width: "auto", padding: "7px 12px", margin: 0, fontSize: "12px", fontWeight: "600" }}>
              <option value="recent">Recent First</option>
              <option value="name">A → Z</option>
              <option value="age">Age ↓</option>
            </select>
            <div className="view-toggle">
              <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table view">
                <span style={{ filter: viewMode === "table" ? "brightness(10)" : "none" }}>☰</span>
              </button>
              <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Grid view">
                <span style={{ filter: viewMode === "grid" ? "brightness(10)" : "none" }}>⊞</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && searchQuery && (
          <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px", fontWeight: "500" }}>
            Showing <strong>{displayed.length}</strong> result{displayed.length !== 1 ? "s" : ""} for "{searchQuery}"
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {viewMode === "table" && (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e8edf2", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e8edf2" }}>
                  {["Patient", "Age & DOB", "Contact", "Blood", "Allergies", "Type", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", textAlign: "left", fontWeight: "700" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div className="skeleton" style={{ height: "16px", width: j === 0 ? "140px" : "80px" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "60px", textAlign: "center" }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#4a5568" }}>No patients found</div>
                      <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Try adjusting your search or filters</div>
                    </td>
                  </tr>
                ) : displayed.map((p, idx) => {
                  const av = AVATAR_COLORS[p.name?.charCodeAt(0) % AVATAR_COLORS.length];
                  const ts = TYPE_STYLES[p.type] || TYPE_STYLES["General Patient"];
                  return (
                    <tr key={p.id} className="patient-row" style={{ animationDelay: `${idx * 0.03}s` }}>
                      {/* Patient */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: av.bg, color: av.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "15px", flexShrink: 0 }}>
                            {p.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#0d1b2e", fontSize: "14px" }}>{p.name}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>#{p.id?.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      {/* Age */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "700", color: "#0d1b2e", fontSize: "14px" }}>{p.age || "—"} yrs</div>
                        {p.dob && <div style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(p.dob + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
                      </td>
                      {/* Phone */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "13px", color: "#4a5568", fontWeight: "500" }}>{p.phone || "—"}</div>
                      </td>
                      {/* Blood */}
                      <td style={{ padding: "14px 16px" }}>
                        {p.blood_group ? <span className="blood-badge">{p.blood_group}</span> : <span style={{ color: "#d1d5db", fontSize: "12px" }}>—</span>}
                      </td>
                      {/* Allergies */}
                      <td style={{ padding: "14px 16px" }}>
                        {p.allergies ? (
                          <span style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            ⚠ {p.allergies}
                          </span>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: "12px" }}>None</span>
                        )}
                      </td>
                      {/* Type */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
                          {p.type || "General"}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 2px #d1fae5" }} />
                          <span style={{ fontSize: "12px", color: "#065f46", fontWeight: "600" }}>Active</span>
                        </div>
                      </td>
                      {/* Action */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <Link href={`/patients/${p.id}`} className="action-btn">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table footer */}
            {!loading && displayed.length > 0 && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f5fa", background: "#fafcff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Showing <strong style={{ color: "#4a5568" }}>{displayed.length}</strong> of <strong style={{ color: "#4a5568" }}>{patients.length}</strong> patients
                </div>
                <div style={{ fontSize: "11px", color: "#b0bec5" }}>Click any row to view full details</div>
              </div>
            )}
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {viewMode === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: "white", borderRadius: "14px", padding: "18px", border: "1px solid #e8edf2" }}>
                <div className="skeleton" style={{ height: "40px", width: "40px", borderRadius: "10px", marginBottom: "12px" }} />
                <div className="skeleton" style={{ height: "16px", width: "60%", marginBottom: "8px" }} />
                <div className="skeleton" style={{ height: "12px", width: "40%" }} />
              </div>
            )) : displayed.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#4a5568" }}>No patients found</div>
              </div>
            ) : displayed.map((p, idx) => {
              const av = AVATAR_COLORS[p.name?.charCodeAt(0) % AVATAR_COLORS.length];
              const ts = TYPE_STYLES[p.type] || TYPE_STYLES["General Patient"];
              return (
                <div key={p.id} className="patient-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: av.bg, color: av.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "18px" }}>
                      {p.name?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, padding: "3px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: "700" }}>
                      {p.type === "General Patient" ? "General" : p.type || "General"}
                    </span>
                  </div>

                  <div style={{ fontWeight: "700", fontSize: "15px", color: "#0d1b2e", marginBottom: "2px" }}>{p.name}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px" }}>#{p.id?.slice(0, 8)}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                    <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "2px" }}>Age</div>
                      <div style={{ fontWeight: "700", color: "#0d1b2e", fontSize: "14px" }}>{p.age || "—"} yrs</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "2px" }}>Blood</div>
                      <div style={{ fontWeight: "700", color: "#be123c", fontSize: "14px" }}>{p.blood_group || "—"}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>📞 {p.phone || "—"}</div>

                  {p.allergies && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", color: "#be123c", fontWeight: "600", marginBottom: "4px" }}>
                      ⚠ {p.allergies}
                    </div>
                  )}

                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f0f5fa" }}>
                    <Link href={`/patients/${p.id}`} style={{
                      display: "block", textAlign: "center",
                      background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                      color: "#1d4ed8", padding: "8px", borderRadius: "9px",
                      textDecoration: "none", fontWeight: "700", fontSize: "13px",
                      border: "1px solid #bfdbfe", transition: "all 0.15s",
                    }}>
                      View Full Record →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Register Patient Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal-box">
            <div style={{ padding: "26px 28px 20px", borderBottom: "1px solid #f0f4f8", background: "linear-gradient(135deg, #f8fafc, white)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>👤</div>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#0f4c81", margin: 0 }}>Register New Patient</h2>
                  <p style={{ color: "#94a3b8", fontSize: "12px", margin: "2px 0 0" }}>Add to clinic records</p>
                </div>
              </div>
            </div>

            <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <input placeholder="Full Name *" style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Date of Birth *</label>
                <input type="date" style={inp} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                {previewAge !== null && (
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#0f4c81", background: "#e8f0fe", padding: "3px 10px", borderRadius: "20px", fontWeight: "700" }}>Age: {previewAge} years</span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="Phone Number *" style={inp} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <select style={inp} value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                  <option value="">Blood Group</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>

              <select style={inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option>General Patient</option>
                <option>Emergency</option>
                <option>Follow-up</option>
              </select>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Known Allergies</label>
                <input placeholder="e.g. Penicillin, Sulfa, Aspirin (leave blank if none)" style={inp} value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>⚠️ Will show as a warning on prescriptions</div>
              </div>

              <textarea placeholder="Address (optional)" style={{ ...inp, minHeight: "70px", resize: "none" }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>

            <div style={{ padding: "0 28px 26px", display: "flex", gap: "10px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "14px", color: "#64748b", fontFamily: "'Outfit', sans-serif", fontWeight: "500" }}>
                Cancel
              </button>
              <button onClick={savePatient} disabled={isSaving} style={{ flex: 2, padding: "12px", borderRadius: "10px", background: isSaving ? "#93c5fd" : "linear-gradient(135deg, #0f4c81, #1a6bbf)", color: "white", border: "none", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "'Outfit', sans-serif", boxShadow: isSaving ? "none" : "0 4px 12px rgba(15,76,129,0.3)" }}>
                {isSaving ? "⏳ Saving..." : "✓ Save Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}