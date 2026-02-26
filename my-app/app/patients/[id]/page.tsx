"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function PatientProfile() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState("overview");

  // prescriptions
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [form, setForm] = useState({
    medicine: "",
    dosage: "",
    duration: "",
    notes: ""
  });

  // ---------------- LOAD PATIENT ----------------
  useEffect(() => {
    if (!id) return;

    async function loadPatient() {
      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (data) setPatient(data);
    }

    loadPatient();
    loadPrescriptions();
  }, [id]);

  // ---------------- LOAD PRESCRIPTIONS ----------------
  async function loadPrescriptions() {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });

    if (data) setPrescriptions(data);
  }

  // ---------------- ADD PRESCRIPTION ----------------
  async function addPrescription() {
    if (!form.medicine) return;

    const { error } = await supabase
      .from("prescriptions")
      .insert({
        patient_id: id,
        medicine: form.medicine,
        dosage: form.dosage,
        duration: form.duration,
        notes: form.notes
      });

    if (error) {
      console.log("Insert error:", error);
      alert("Failed to save prescription");
      return;
    }

    setForm({
      medicine: "",
      dosage: "",
      duration: "",
      notes: ""
    });

    loadPrescriptions();
  }

  if (!patient) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>

      <h1>Patient Profile</h1>

      <p><b>Name:</b> {patient.name}</p>
      <p><b>Age:</b> {patient.age}</p>
      <p><b>Type:</b> {patient.type}</p>

      {/* ---------- TABS ---------- */}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => setTab("overview")}>Overview</button>
        <button onClick={() => setTab("prescriptions")}>Prescriptions</button>
        <button onClick={() => setTab("notes")}>Notes</button>
      </div>

      {/* ---------- OVERVIEW ---------- */}
      {tab === "overview" && (
        <div style={{ marginTop: 20 }}>
          <h3>Overview</h3>
          <p>Patient basic information appears here.</p>
        </div>
      )}

      {/* ---------- PRESCRIPTIONS ---------- */}
      {tab === "prescriptions" && (
        <div style={{ marginTop: 20 }}>

          <h3>Add Prescription</h3>

          <input
            placeholder="Medicine"
            value={form.medicine}
            onChange={e => setForm({ ...form, medicine: e.target.value })}
          />

          <input
            placeholder="Dosage"
            value={form.dosage}
            onChange={e => setForm({ ...form, dosage: e.target.value })}
          />

          <input
            placeholder="Duration"
            value={form.duration}
            onChange={e => setForm({ ...form, duration: e.target.value })}
          />

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />

          <br />

          <button onClick={addPrescription}>
            Save Prescription
          </button>

          <h3 style={{ marginTop: 30 }}>History</h3>

          {prescriptions.map(p => (
            <div key={p.id} style={{
              border: "1px solid #ddd",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8
            }}>
              <b>{p.medicine}</b>
              <div>{p.dosage}</div>
              <div>{p.duration}</div>
              <div>{p.notes}</div>
            </div>
          ))}

        </div>
      )}

      {/* ---------- NOTES ---------- */}
      {tab === "notes" && (
        <div style={{ marginTop: 20 }}>
          <h3>Doctor Notes</h3>
          <p>Your notes module stays here.</p>
        </div>
      )}

    </div>
  );
}