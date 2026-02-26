"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    patient_name: "",
    date: "",
    time: ""
  });

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, []);

  async function loadAppointments() {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("time", { ascending: true });

    if (data) setAppointments(data);
  }

  async function loadPatients() {
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (data && !data.error) {
        setPatients(data);
      }
    } catch (err) {
      console.error("Error loading patients for appointments:", err);
    }
  }

  async function addAppointment() {
    if (!form.patient_id) return;

    const { error } = await supabase.from("appointments").insert({
      patient_id: form.patient_id,
      patient_name: form.patient_name,
      date: form.date,
      time: form.time,
      status: "confirmed"
    });

    if (error) {
      alert("Failed to save appointment");
      return;
    }

    setShowAdd(false);
    setForm({ patient_id: "", patient_name: "", date: "", time: "" });
    loadAppointments();
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1>Appointments</h1>
          <p style={{ color: "#718096" }}>Manage your clinic schedule</p>
        </div>
        <button 
          style={{ background: "#3182ce", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer", marginLeft: "auto" }}
          onClick={() => setShowAdd(true)}
        >
          ＋ New Appointment
        </button>
      </div>

      <div className="card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #edf2f7", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #edf2f7", textAlign: "left" }}>
              <th style={{ padding: "1rem" }}>Time</th>
              <th style={{ padding: "1rem" }}>Patient</th>
              <th style={{ padding: "1rem" }}>Status</th>
              <th style={{ padding: "1rem" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#a0aec0" }}>No appointments scheduled.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>{a.time}</td>
                  <td style={{ padding: "1rem" }}>
                    <Link href={`/patients/${a.patient_id}`} style={{ textDecoration: "none", color: "#3182ce", fontWeight: "600" }}>
                      {a.patient_name}
                    </Link>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ 
                      padding: "0.25rem 0.75rem", 
                      borderRadius: "9999px", 
                      fontSize: "0.75rem", 
                      background: a.status === "confirmed" ? "#c6f6d5" : "#feebc8",
                      color: a.status === "confirmed" ? "#22543d" : "#744210"
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#718096" }}>{a.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyCenter: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
            <h3>New Appointment</h3>
            <div style={{ marginTop: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Select Patient</label>
              <select 
                style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                value={form.patient_id}
                onChange={(e) => {
                  const selected = patients.find(p => p.id === e.target.value);
                  setForm({ ...form, patient_id: e.target.value, patient_name: selected?.name || "" });
                }}
              >
                <option value="">Choose...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Date</label>
              <input type="date" style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", border: "1px solid #e2e8f0", borderRadius: "8px" }} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Time</label>
              <input type="time" style={{ width: "100%", padding: "0.75rem", marginBottom: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "8px" }} value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              <div style={{ display: "flex", gap: "1rem", justifyCenter: "flex-end" }}>
                <button onClick={() => setShowAdd(false)} style={{ background: "#edf2f7", color: "#4a5568", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                <button onClick={addAppointment} style={{ background: "#38a169", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer" }}>Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}