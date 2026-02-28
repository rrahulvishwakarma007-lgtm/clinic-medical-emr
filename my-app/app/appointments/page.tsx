"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

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
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setAppointments(data);
      } 
      else if (data && typeof data === 'object' && 'error' in data) {
        console.error("API error details:", data.error);
        setAppointments([]);
      }
      else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setAppointments([]);
    }
  }

  async function loadPatients() {
    try {
      const res = await fetch("/api/patients");
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setPatients(result.data);
      } else if (result.error) {
        console.error("API error:", result.error);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function addAppointment() {
    if (!form.patient_id || !form.date) return;
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
          status: "confirmed"
        })
      });
      const data = await res.json();

      if (data.error) {
        alert("Error: " + data.error.message);
      } else {
        setShowAdd(false);
        setForm({ patient_id: "", patient_name: "", date: "", time: "" });
        loadAppointments();
      }
    } catch (err: any) {
      alert("Failed to fetch: " + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Appointments</h1>
        <button 
          style={{ background: "#3182ce", color: "white", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", border: "none" }}
          onClick={() => setShowAdd(true)}
        >
          ＋ New Appointment
        </button>
      </div>

      <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
        <table style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              <th style={{ padding: "10px" }}>Time</th>
              <th style={{ padding: "10px" }}>Patient</th>
              <th style={{ padding: "10px" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{a.time}</td>
                <td style={{ padding: "10px" }}>{a.patient_name}</td>
                <td style={{ padding: "10px" }}>{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px" }}>
            <h2>New Appointment</h2>
            <select 
              style={{ width: "100%", padding: "10px", margin: "10px 0" }}
              value={form.patient_id}
              onChange={(e) => {
                const selected = patients.find(p => p.id === e.target.value);
                setForm({ ...form, patient_id: e.target.value, patient_name: selected?.name || "" });
              }}
            >
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" style={{ width: "100%", padding: "10px", margin: "10px 0" }} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            <input type="time" style={{ width: "100%", padding: "10px", margin: "10px 0" }} value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "10px" }}>Cancel</button>
              <button onClick={addAppointment} disabled={loading} style={{ flex: 1, padding: "10px", background: "#38a169", color: "white", border: "none" }}>
                {loading ? "Saving..." : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}