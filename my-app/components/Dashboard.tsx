"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Dashboard() {

  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    type: ""
  });

  // 🔵 LOAD PATIENTS
  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("LOAD RESULT:", data, error);

    if (data) setPatients(data);
  }

  // 🟢 ADD PATIENT
  async function addPatient() {

    if (!newPatient.name) {
      alert("Name required");
      return;
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name: newPatient.name,
        age: Number(newPatient.age),
        type: newPatient.type,
        date: "Today",
        status: "confirmed"
      })
      .select();

    console.log("INSERT RESULT:", data);
    console.log("INSERT ERROR:", error);

    if (error) {
      alert("Insert failed — check console");
      return;
    }

    setShowForm(false);
    setNewPatient({ name: "", age: "", type: "" });

    loadPatients();
  }

  return (
    <div style={{ padding: 30 }}>

      <h2>Clinic Dashboard</h2>

      {/* REGISTER BUTTON */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          padding: "10px 20px",
          background: "#4f9cf9",
          color: "white",
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        ＋ Register New Patient
      </button>

      {/* 🟡 FORM */}
      {showForm && (
        <div style={{
          border: "1px solid #ddd",
          padding: 20,
          borderRadius: 10,
          marginBottom: 20
        }}>
          <h3>Add Patient</h3>

          <input
            placeholder="Name"
            value={newPatient.name}
            onChange={(e) =>
              setNewPatient({ ...newPatient, name: e.target.value })
            }
            style={{ display: "block", marginBottom: 10 }}
          />

          <input
            placeholder="Age"
            value={newPatient.age}
            onChange={(e) =>
              setNewPatient({ ...newPatient, age: e.target.value })
            }
            style={{ display: "block", marginBottom: 10 }}
          />

          <input
            placeholder="Type"
            value={newPatient.type}
            onChange={(e) =>
              setNewPatient({ ...newPatient, type: e.target.value })
            }
            style={{ display: "block", marginBottom: 10 }}
          />

          <button
            onClick={addPatient}
            style={{
              padding: "8px 14px",
              background: "#16a34a",
              color: "white",
              borderRadius: 6
            }}
          >
            Save Patient
          </button>
        </div>
      )}

      {/* 🟣 PATIENT LIST */}
      <div>
        <h3>Patients</h3>

        {patients.length === 0 && (
          <p>No patients yet...</p>
        )}

        {patients.map((p) => (
          <Link
            key={p.id}
            href={`/patients/${p.id}`}
            style={{
              display: "block",
              padding: 12,
              borderBottom: "1px solid #eee",
              textDecoration: "none",
              color: "black"
            }}
          >
            <strong>{p.name}</strong> — {p.type}
          </Link>
        ))}
      </div>

    </div>
  );
}