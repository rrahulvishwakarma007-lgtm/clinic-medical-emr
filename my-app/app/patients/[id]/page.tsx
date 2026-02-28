"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PatientProfile() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const [form, setForm] = useState({
    medicine: "",
    dosage: "",
    duration: "",
    notes: ""
  });

  // ---------------- LOAD PATIENT + PRESCRIPTIONS ----------------
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        // Load patient from our secure API
        const pRes = await fetch("/api/patients");
        const pResult = await pRes.json();
        if (pResult.success) {
          const found = pResult.data.find((p: any) => String(p.id) === String(id));
          if (found) setPatient(found);
        }

        // Load prescriptions from our secure API
        const prRes = await fetch("/api/prescriptions");
        const prData = await prRes.json();
        if (Array.isArray(prData)) {
          const filtered = prData.filter((pr: any) => String(pr.patient_id) === String(id));
          setPrescriptions(filtered);
        }
      } catch (err) {
        console.error("Error loading patient data:", err);
      }
    }

    loadData();
  }, [id]);

  // ---------------- ADD PRESCRIPTION ----------------
  async function addPrescription() {
    if (!form.medicine) return;

    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: id,
          medicine: form.medicine,
          dosage: form.dosage,
          duration: form.duration,
          notes: form.notes
        })
      });

      const result = await res.json();

      if (result.error) {
        alert("Insert failed: " + result.error);
        return;
      }

      // reload prescriptions
      const prRes = await fetch("/api/prescriptions");
      const prData = await prRes.json();
      if (Array.isArray(prData)) {
        const filtered = prData.filter((pr: any) => String(pr.patient_id) === String(id));
        setPrescriptions(filtered);
      }

      // reset form
      setForm({
        medicine: "",
        dosage: "",
        duration: "",
        notes: ""
      });
    } catch (err: any) {
      alert("System Error: " + err.message);
    }
  }

  if (!patient) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 30 }}>

      <h1>Patient Profile</h1>

      <div style={{ marginBottom: 20 }}>
        <p><strong>Name:</strong> {patient.name}</p>
        <p><strong>Age:</strong> {patient.age}</p>
        <p><strong>Type:</strong> {patient.type}</p>
      </div>

      {/* -------- TABS -------- */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("overview")}>Overview</button>
        <button onClick={() => setTab("prescriptions")}>Prescriptions</button>
      </div>

      {/* -------- OVERVIEW -------- */}
      {tab === "overview" && (
        <div>
          <h3>Overview</h3>
          <p>Basic patient information.</p>
        </div>
      )}

      {/* -------- PRESCRIPTIONS -------- */}
      {tab === "prescriptions" && (
        <div>

          <h3>Add Prescription</h3>

          <input
            placeholder="Medicine"
            value={form.medicine}
            onChange={(e) =>
              setForm({ ...form, medicine: e.target.value })
            }
            style={{ display: "block", marginBottom: 10 }}
          />

          <input
            placeholder="Dosage"
            value={form.dosage}
            onChange={(e) =>
              setForm({ ...form, dosage: e.target.value })
            }
            style={{ display: "block", marginBottom: 10 }}
          />

          <input
            placeholder="Duration"
            value={form.duration}
            onChange={(e) =>
              setForm({ ...form, duration: e.target.value })
            }
            style={{ display: "block", marginBottom: 10 }}
          />

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
            style={{ display: "block", marginBottom: 10 }}
          />

          <button onClick={addPrescription}>
            Save Prescription
          </button>

          <h3 style={{ marginTop: 30 }}>Prescription History</h3>

          {prescriptions.length === 0 && (
            <p>No prescriptions yet.</p>
          )}

          {prescriptions.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                padding: 10,
                marginBottom: 10,
                borderRadius: 8
              }}
            >
              <strong>{p.medicine}</strong>
              <div>Dosage: {p.dosage}</div>
              <div>Duration: {p.duration}</div>
              <div>{p.notes}</div>
              <small>{new Date(p.created_at).toLocaleString()}</small>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}