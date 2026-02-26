"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function PatientProfile() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [presForm, setPresForm] = useState({
    medicine: "",
    dosage: "",
    duration: "",
    notes: ""
  });

  useEffect(() => {
    if (id) {
      loadPatientData();
    }
  }, [id]);

  async function loadPatientData() {
    setLoading(true);
    try {
      // Use internal API for patient data to avoid CORS
      const res = await fetch("/api/patients");
      const allPatients = await res.json();
      const pData = allPatients.find((p: any) => p.id === id);
      
      const { data: presData } = await supabase.from("prescriptions").select("*").eq("patient_id", id).order("created_at", { ascending: false });
      
      if (pData) setPatient(pData);
      if (presData) setPrescriptions(presData);
    } catch (err) {
      console.error("Error loading patient details:", err);
    }
    setLoading(false);
  }

  async function addPrescription() {
    if (!presForm.medicine) return;
    try {
      const { error } = await supabase.from("prescriptions").insert({
        patient_id: id,
        medicine: presForm.medicine,
        dosage: presForm.dosage,
        duration: presForm.duration,
        notes: presForm.notes
      });

      if (!error) {
        setPresForm({ medicine: "", dosage: "", duration: "", notes: "" });
        loadPatientData();
      } else {
        alert("Failed to save prescription: " + error.message);
      }
    } catch (err: any) {
      alert("Error saving prescription: " + err.message);
    }
  }

  if (loading) return <div className="loading">Loading patient records...</div>;
  if (!patient) return <div className="error">Patient record not found.</div>;

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="patient-avatar">{patient.name.charAt(0)}</div>
        <div className="patient-basic-info">
          <h1>{patient.name}</h1>
          <p>{patient.type} • ID: {id.slice(0, 8)}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">Print Profile</button>
          <button className="btn btn-primary">Edit Info</button>
        </div>
      </header>

      {/* TABS */}
      <nav className="profile-tabs">
        {["overview", "prescriptions", "notes", "labs", "billing"].map((t) => (
          <button 
            key={t} 
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {tab === "overview" && (
          <div className="overview-grid">
            <div className="card info-card">
              <h3>Patient Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Age</label>
                  <span>{patient.age} years</span>
                </div>
                <div className="info-item">
                  <label>Registration Date</label>
                  <span>{new Date(patient.created_at).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <span className="badge badge-success">{patient.status || 'Active'}</span>
                </div>
              </div>
            </div>
            <div className="card summary-card">
              <h3>Latest Prescription</h3>
              {prescriptions.length > 0 ? (
                <div className="latest-pres">
                  <strong>{prescriptions[0].medicine}</strong>
                  <p>{prescriptions[0].dosage} • {prescriptions[0].duration}</p>
                </div>
              ) : (
                <p className="text-muted">No prescriptions recorded.</p>
              )}
            </div>
          </div>
        )}

        {tab === "prescriptions" && (
          <div className="prescriptions-module">
            <div className="card pres-form-card">
              <h3>New Prescription</h3>
              <div className="pres-form-grid">
                <input placeholder="Medicine Name" value={presForm.medicine} onChange={e => setPresForm({...presForm, medicine: e.target.value})} />
                <input placeholder="Dosage (e.g. 500mg)" value={presForm.dosage} onChange={e => setPresForm({...presForm, dosage: e.target.value})} />
                <input placeholder="Duration (e.g. 7 days)" value={presForm.duration} onChange={e => setPresForm({...presForm, duration: e.target.value})} />
                <textarea placeholder="Special Instructions" value={presForm.notes} onChange={e => setPresForm({...presForm, notes: e.target.value})} />
              </div>
              <button className="btn btn-success" onClick={addPrescription}>Authorize & Save</button>
            </div>

            <h3 className="history-title">Prescription History</h3>
            <div className="pres-timeline">
              {prescriptions.map(p => (
                <div key={p.id} className="timeline-item">
                  <div className="timeline-date">{new Date(p.created_at).toLocaleDateString()}</div>
                  <div className="card timeline-card">
                    <strong>{p.medicine}</strong>
                    <div className="timeline-meta">{p.dosage} — {p.duration}</div>
                    {p.notes && <p className="timeline-notes">{p.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="card">
            <h3>Consultation Notes</h3>
            <div className="empty-state">No clinical notes available.</div>
          </div>
        )}

        {tab === "labs" && (
          <div className="labs-module">
            <div className="header-flex">
              <h3>Laboratory Results</h3>
              <button className="btn btn-secondary">Upload Report</button>
            </div>
            <div className="empty-state">No lab results found for this patient.</div>
          </div>
        )}

        {tab === "billing" && (
          <div className="billing-module">
            <div className="header-flex">
              <h3>Invoices & Billing</h3>
              <button className="btn btn-primary">+ New Invoice</button>
            </div>
            <div className="empty-state">No billing records found.</div>
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .profile-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
        .patient-avatar { width: 64px; height: 64px; background: #ebf8ff; color: #3182ce; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.5rem; font-weight: bold; border: 2px solid #bee3f8; }
        .patient-basic-info h1 { margin: 0; font-size: 1.75rem; color: #2d3748; }
        .patient-basic-info p { margin: 0.25rem 0 0; color: #718096; }
        .header-actions { margin-left: auto; display: flex; gap: 0.75rem; }

        .profile-tabs { display: flex; border-bottom: 2px solid #edf2f7; margin-bottom: 2rem; gap: 2rem; }
        .tab-btn { background: none; border: none; padding: 1rem 0; font-weight: 600; color: #718096; cursor: pointer; position: relative; }
        .tab-btn.active { color: #3182ce; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #3182ce; }

        .card { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #edf2f7; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .overview-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }
        .info-item label { display: block; font-size: 0.75rem; color: #a0aec0; text-transform: uppercase; font-weight: 700; }
        .info-item span { font-weight: 600; color: #4a5568; }

        .prescriptions-module { display: flex; flex-direction: column; gap: 1.5rem; }
        .pres-form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; margin-bottom: 1rem; }
        .pres-form-grid textarea { grid-column: span 3; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 80px; }
        .pres-form-grid input { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; }

        .pres-timeline { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .timeline-item { display: flex; gap: 1.5rem; }
        .timeline-date { width: 100px; font-size: 0.875rem; color: #a0aec0; padding-top: 1rem; }
        .timeline-card { flex: 1; }
        .timeline-meta { font-size: 0.875rem; color: #718096; margin: 0.25rem 0; }
        .timeline-notes { font-size: 0.875rem; color: #4a5568; margin-top: 0.5rem; border-top: 1px solid #f7fafc; padding-top: 0.5rem; }

        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .empty-state { text-align: center; padding: 3rem; color: #a0aec0; background: #f7fafc; border-radius: 8px; margin-top: 1rem; border: 2px dashed #edf2f7; }

        .btn { padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { background: #3182ce; color: white; }
        .btn-secondary { background: #edf2f7; color: #4a5568; }
        .btn-success { background: #38a169; color: white; }

        .badge { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; }
        .badge-success { background: #c6f6d5; color: #22543d; }
        .loading { padding: 3rem; text-align: center; color: #718096; }
      `}</style>
    </div>
  );
}