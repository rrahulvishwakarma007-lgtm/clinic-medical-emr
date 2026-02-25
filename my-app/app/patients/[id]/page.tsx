"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PatientProfile() {

  const params = useParams();
  const id = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState("overview");

  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [newRx, setNewRx] = useState("");

  // ================= LOAD DATA =================

  useEffect(() => {
    if (id) {
      loadPatient();
      loadNotes();
      loadPrescriptions();
    }
  }, [id]);

  async function loadPatient() {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (data) setPatient(data);
  }

  async function loadNotes() {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });

    if (data) setNotes(data);
  }

  async function loadPrescriptions() {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false });

    if (data) setPrescriptions(data);
  }

  // ================= ADD NOTE =================

  async function addNote() {
    if (!newNote) return;

    await supabase.from("notes").insert({
      patient_id: id,
      content: newNote,
    });

    setNewNote("");
    loadNotes();
  }

  // ================= ADD PRESCRIPTION =================

  async function addPrescription() {
    if (!newRx) return;

    await supabase.from("prescriptions").insert({
      patient_id: id,
      medicine: newRx,
    });

    setNewRx("");
    loadPrescriptions();
  }

  if (!patient) return <div style={{ padding: 30 }}>Loading patient...</div>;

  return (
    <div style={{ padding: 30 }}>

      <h1>Patient Profile</h1>

      <p><b>Name:</b> {patient.name}</p>
      <p><b>Age:</b> {patient.age}</p>
      <p><b>Type:</b> {patient.type}</p>

      {/* ================= TABS ================= */}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setTab("overview")}>Overview</button>
        <button onClick={() => setTab("prescriptions")}>Prescriptions</button>
        <button onClick={() => setTab("notes")}>Notes</button>
      </div>

      {/* ================= OVERVIEW ================= */}

      {tab === "overview" && (
        <div style={{ marginTop: 20 }}>
          <h3>Patient Overview</h3>
          <p>Basic patient information and clinical data will appear here.</p>
        </div>
      )}

      {/* ================= PRESCRIPTIONS ================= */}

      {tab === "prescriptions" && (
        <div style={{ marginTop: 20 }}>
          <h3>Prescriptions</h3>

          <input
            placeholder="Add medicine..."
            value={newRx}
            onChange={(e) => setNewRx(e.target.value)}
          />
          <button onClick={addPrescription}>Add</button>

          <ul>
            {prescriptions.map((rx) => (
              <li key={rx.id}>
                {rx.medicine}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ================= NOTES ================= */}

      {tab === "notes" && (
        <div style={{ marginTop: 20 }}>
          <h3>Doctor Notes</h3>

          <textarea
            placeholder="Write clinical notes..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />

          <br />

          <button onClick={addNote}>Save Note</button>

          <div style={{ marginTop: 20 }}>
            {notes.map((n) => (
              <div key={n.id} style={{ marginBottom: 10 }}>
                <b>{new Date(n.created_at).toLocaleString()}</b>
                <p>{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}