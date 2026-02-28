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
      // Load patient
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientData) setPatient(patientData);

      // Load prescriptions
      const { data: prescriptionData } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false });

      if (prescriptionData) setPrescriptions(prescriptionData);
    }

    loadData();
  }, [id]);

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
      alert("Insert failed");
      return;
    }

    // reload prescriptions
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });

    if (data) setPrescriptions(data);

    // reset form
    setForm({
      medicine: "",
      dosage: "",
      duration: "",
      notes: ""
    });
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