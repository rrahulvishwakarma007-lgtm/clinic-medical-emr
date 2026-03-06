"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

type ViewMode = "today" | "upcoming" | "all";
type Status = "Confirmed" | "Waiting" | "In Progress" | "Completed" | "Cancelled";

const STATUS_STYLES: Record<Status, { bg: string; color: string }> = {
  "Confirmed":   { bg: "#dbeafe", color: "#1e40af" },
  "Waiting":     { bg: "#fef3c7", color: "#92400e" },
  "In Progress": { bg: "#ede9fe", color: "#6d28d9" },
  "Completed":   { bg: "#d1fae5", color: "#065f46" },
  "Cancelled":   { bg: "#fee2e2", color: "#991b1b" },
};

const VISIT_TYPES = ["General Checkup", "Follow-up", "Consultation", "Emergency", "Vaccination", "Dental", "Eye Checkup", "Other"];
const TIME_SLOTS = [
  "09:00","09:15","09:30","09:45",
  "10:00","10:15","10:30","10:45",
  "11:00","11:15","11:30","11:45",
  "12:00","12:15","12:30","12:45",
  "14:00","14:15","14:30","14:45",
  "15:00","15:15","15:30","15:45",
  "16:00","16:15","16:30","16:45",
  "17:00","17:15","17:30","17:45",
];

export default function AppointmentsPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewAppointment, setViewAppointment] = useState<any | null>(null);

  // ── Edit state ──
  const [editAppointment, setEditAppointment] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
    visit_type: "General Checkup",
    notes: "",
    status: "Confirmed" as Status,
  });
  const [editLoading, setEditLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    patient_id: "",
    patient_name: "",
    date: today,
    time: "",
    visit_type: "General Checkup",
    notes: "",
    status: "Confirmed" as Status,
  });

  useEffect(() => { loadAppointments(); loadPatients(); }, []);

  async function loadAppointments() {
    setPageLoading(true);
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (err) { console.error(err); }
    finally { setPageLoading(false); }
  }

  async function loadPatients() {
    try {
      const res = await fetch("/api/patients", { cache: "no-store" });
      if (!res.ok) return;
      const result = await res.json();
      if (result?.success && Array.isArray(result.data)) setPatients(result.data);
    } catch (err) { console.error(err); }
  }

  async function addAppointment() {
    if (!form.patient_id || !form.date || !form.time) return alert("Please select patient, date and time.");
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: form.patient_id,
          patient_name: form.patient_name,
          date: form.date,
          time: form.time,
          visit_type: form.visit_type,
          notes: form.notes,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (data?.error) { alert("Error: " + data.error); return; }
      setShowAdd(false);
      setForm({ patient_id: "", patient_name: "", date: today, time: "", visit_type: "General Checkup", notes: "", status: "Confirmed" });
      loadAppointments();
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setLoading(false); }
  }

  // ── Open edit modal pre-filled ──
  function openEdit(a: any) {
    setEditAppointment(a);
    setEditForm({
      date: a.date,
      time: a.time,
      visit_type: a.visit_type || "General Checkup",
      notes: a.notes || "",
      status: a.status || "Confirmed",
    });
  }

  // ── Save edited appointment ──
  async function saveEdit() {
    if (!editForm.date || !editForm.time) return alert("Please select date and time.");
    setEditLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editAppointment.id,
          date: editForm.date,
          time: editForm.time,
          visit_type: editForm.visit_type,
          notes: editForm.notes,
          status: editForm.status,
        }),
      });
      const data = await res.json();
      if (data?.error) { alert("Error: " + data.error); return; }
      setAppointments(prev => prev.map(a =>
        a.id === editAppointment.id ? { ...a, ...editForm } : a
      ));
      setEditAppointment(null);
    } catch (err: any) { alert("Failed: " + err.message); }
    finally { setEditLoading(false); }
  }

  async function updateStatus(id: string, status: Status) {
    setUpdatingId(id);
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  }

  async function deleteAppointment(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    await fetch("/api/appointments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAppointments();
  }

  const filtered = appointments.filter(a => {
    const matchSearch = !searchQuery || a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchView =
      viewMode === "all" ? true :
      viewMode === "today" ? a.date === today :
      viewMode === "upcoming" ? a.date > today : true;
    return matchSearch && matchView;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || "").localeCompare(b.time || "");
  });

  const todayAppts = appointments.filter(a => a.date === today);
  const waitingCount = todayAppts.filter(a => a.status === "Waiting").length;
  const completedToday = todayAppts.filter(a => a.status === "Completed").length;
  const upcomingCount = appointments.filter(a => a.date > today).length;

  function formatTime(t: string) {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  }

  const inputStyle: any = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .view-btn{border:none;cursor:pointer;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:500;transition:all 0.15s;font-family:inherit}
        .view-btn.active{background:#0f4c81;color:white}
        .view-btn:not(.active){background:white;color:#555}
        .view-btn:not(.active):hover{background:#e8f1fb;color:#0f4c81}
        .appt-row{transition:background 0.15s}
        .appt-row:hover td{background:#f0f7ff!important}
        .status-select{border:none;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
        .del-btn{background:none;border:none;cursor:pointer;color:#cbd5e0;padding:6px;border-radius:6px;transition:all 0.15s;font-size:16px}
        .del-btn:hover{color:#e53e3e;background:#fee2e2}
        .edit-btn{background:#f0fdf4;color:#166534;border:none;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;font-family:inherit}
        .edit-btn:hover{background:#dcfce7}
        .slot-btn{padding:8px 10px;border-radius:7px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.15s;text-align:center;font-family:inherit}
        .slot-btn:hover:not(:disabled){border-color:#0f4c81;color:#0f4c81;background:#ebf8ff}
        .slot-btn.selected{background:#0f4c81;color:white;border-color:#0f4c81}
        .slot-btn:disabled{background:#f8f8f8;color:#ccc;cursor:not-allowed;text-decoration:line-through}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        .modal-anim{animation:slideUp 0.22s ease}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .stat-card{background:white;border-radius:14px;padding:18px 22px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#0f4c81", margin: 0 }}>Appointments</h1>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>{hospitalConfig.name} &bull; {formatDate(today)}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ background: "#0f4c81", color: "white", border: "none", padding: "11px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 14px rgba(15,76,129,0.25)" }}>
          + New Appointment
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "22px" }}>
        {[
          { label: "Today's Total", value: todayAppts.length, color: "#0f4c81", icon: "📅" },
          { label: "Waiting", value: waitingCount, color: "#92400e", icon: "⏳" },
          { label: "Completed Today", value: completedToday, color: "#065f46", icon: "✅" },
          { label: "Upcoming", value: upcomingCount, color: "#6d28d9", icon: "🗓" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>{s.icon}</div>
            <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["today", "upcoming", "all"] as ViewMode[]).map(v => (
            <button key={v} className={`view-btn ${viewMode === v ? "active" : ""}`} onClick={() => setViewMode(v)}>
              {v === "today" ? "Today" : v === "upcoming" ? "Upcoming" : "All"}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search patient..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", width: "220px", background: "white" }} />
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0f4c81" }}>
              {["Time", "Patient", "Visit Type", "Date", "Notes", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "13px 16px", color: "white", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageLoading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>📅</div>
                <div style={{ fontWeight: "600", color: "#999" }}>No appointments {viewMode === "today" ? "today" : "found"}</div>
              </td></tr>
            ) : filtered.map((a, i) => {
              const st = STATUS_STYLES[a.status as Status] || STATUS_STYLES["Confirmed"];
              return (
                <tr key={a.id} className="appt-row" style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "13px 16px", fontWeight: "700", color: "#0f4c81", fontSize: "14px" }}>{formatTime(a.time)}</td>
                  <td style={{ padding: "13px 16px", fontWeight: "600", color: "#1a1a2e", fontSize: "14px" }}>{a.patient_name}</td>
                  <td style={{ padding: "13px 16px", fontSize: "13px", color: "#555" }}>{a.visit_type || "General Checkup"}</td>
                  <td style={{ padding: "13px 16px", fontSize: "13px", color: "#666" }}>{formatDate(a.date)}</td>
                  <td style={{ padding: "13px 16px", fontSize: "12px", color: "#999", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.notes || "—"}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <select className="status-select" value={a.status || "Confirmed"} disabled={updatingId === a.id}
                      style={{ background: st.bg, color: st.color }}
                      onChange={e => updateStatus(a.id, e.target.value as Status)}>
                      {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <button onClick={() => setViewAppointment(a)}
                        style={{ background: "#ebf8ff", color: "#3182ce", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                        👁 View
                      </button>
                      <button className="edit-btn" onClick={() => openEdit(a)}>✏️ Edit</button>
                      <button className="del-btn" onClick={() => deleteAppointment(a.id)} title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add Appointment Modal ── */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", borderRadius: "16px", width: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "28px 32px 0" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#0f4c81", marginBottom: "4px" }}>New Appointment</h2>
              <p style={{ color: "#999", fontSize: "13px", marginBottom: "24px" }}>Schedule a patient visit</p>
            </div>
            <div style={{ padding: "0 32px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Patient *</label>
                <select style={inputStyle} value={form.patient_id}
                  onChange={e => {
                    const selected = patients.find(p => p.id === e.target.value);
                    setForm({ ...form, patient_id: e.target.value, patient_name: selected?.name || "" });
                  }}>
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Date *</label>
                  <input type="date" style={inputStyle} value={form.date} min={today}
                    onChange={e => setForm({ ...form, date: e.target.value, time: "" })} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Visit Type</label>
                  <select style={inputStyle} value={form.visit_type} onChange={e => setForm({ ...form, visit_type: e.target.value })}>
                    {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
                  Time Slot * {form.time && <span style={{ color: "#0f4c81", textTransform: "none", letterSpacing: 0 }}>— {formatTime(form.time)} selected</span>}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
                  {TIME_SLOTS.map(t => {
                    const taken = appointments.some(a => a.date === form.date && a.time === t && a.status !== "Cancelled");
                    return (
                      <button key={t} disabled={taken} className={`slot-btn${form.time === t ? " selected" : ""}`}
                        onClick={() => setForm({ ...form, time: t })}>
                        {formatTime(t)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Status</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
                  {Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Notes (optional)</label>
                <textarea placeholder="Reason for visit, symptoms, special instructions..." style={{ ...inputStyle, minHeight: "80px", resize: "none" }}
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Cancel</button>
                <button onClick={addAppointment} disabled={loading}
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", background: loading ? "#93c5fd" : "#0f4c81", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>
                  {loading ? "Scheduling..." : "Schedule Appointment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Appointment Modal ── */}
      {editAppointment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", borderRadius: "16px", width: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "28px 32px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#0f4c81", margin: 0 }}>Edit Appointment</h2>
                <button onClick={() => setEditAppointment(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#999" }}>✕</button>
              </div>
              <p style={{ color: "#999", fontSize: "13px", marginBottom: "24px" }}>
                Rescheduling for <strong style={{ color: "#1a1a2e" }}>{editAppointment.patient_name}</strong>
              </p>
            </div>
            <div style={{ padding: "0 32px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Date *</label>
                  <input type="date" style={inputStyle} value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value, time: "" })} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Visit Type</label>
                  <select style={inputStyle} value={editForm.visit_type} onChange={e => setEditForm({ ...editForm, visit_type: e.target.value })}>
                    {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
                  Time Slot * {editForm.time && <span style={{ color: "#0f4c81", textTransform: "none", letterSpacing: 0 }}>— {formatTime(editForm.time)} selected</span>}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
                  {TIME_SLOTS.map(t => {
                    const taken = appointments.some(a =>
                      a.date === editForm.date &&
                      a.time === t &&
                      a.status !== "Cancelled" &&
                      a.id !== editAppointment.id  // don't block its own current slot
                    );
                    return (
                      <button key={t} disabled={taken} className={`slot-btn${editForm.time === t ? " selected" : ""}`}
                        onClick={() => setEditForm({ ...editForm, time: t })}>
                        {formatTime(t)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Status</label>
                <select style={inputStyle} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as Status })}>
                  {Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Notes</label>
                <textarea placeholder="Reason for visit, symptoms..." style={{ ...inputStyle, minHeight: "80px", resize: "none" }}
                  value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
                <button onClick={() => setEditAppointment(null)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Cancel</button>
                <button onClick={saveEdit} disabled={editLoading}
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", background: editLoading ? "#93c5fd" : "#0f4c81", color: "white", border: "none", cursor: editLoading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Appointment Modal ── */}
      {viewAppointment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div className="modal-anim" style={{ background: "white", borderRadius: "16px", width: "500px", padding: "32px", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#0f4c81", margin: 0 }}>Appointment Details</h2>
              <button onClick={() => setViewAppointment(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#999" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "#f8fbff", padding: "20px", borderRadius: "12px", border: "1px solid #e8f1fb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>Patient</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a2e" }}>{viewAppointment.patient_name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>Status</div>
                    <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", background: STATUS_STYLES[viewAppointment.status as Status]?.bg, color: STATUS_STYLES[viewAppointment.status as Status]?.color }}>
                      {viewAppointment.status}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>Date</div>
                  <div style={{ fontSize: "14px", color: "#444", fontWeight: "600" }}>{formatDate(viewAppointment.date)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>Time</div>
                  <div style={{ fontSize: "14px", color: "#444", fontWeight: "600" }}>{formatTime(viewAppointment.time)}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>Visit Type</div>
                <div style={{ fontSize: "14px", color: "#444", fontWeight: "600" }}>{viewAppointment.visit_type || "General Checkup"}</div>
              </div>
              {viewAppointment.notes && (
                <div>
                  <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>Notes</div>
                  <div style={{ fontSize: "14px", color: "#555", padding: "12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #f0f0f0", lineHeight: "1.6" }}>
                    {viewAppointment.notes}
                  </div>
                </div>
              )}
              <div style={{ marginTop: "4px", display: "flex", gap: "10px" }}>
                <button onClick={() => setViewAppointment(null)}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: "700", fontSize: "14px", color: "#4a5568" }}>
                  Close
                </button>
                <button
                  onClick={() => { setViewAppointment(null); openEdit(viewAppointment); }}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#f0fdf4", color: "#166534", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                  ✏️ Edit
                </button>
                <button
                  onClick={() => { const pid = viewAppointment.patient_id; setViewAppointment(null); router.push(`/patients/${pid}`); }}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#0f4c81", color: "white", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
