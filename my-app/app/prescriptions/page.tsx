"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    medicine: "",
    dosage: "",
    duration: "",
    notes: ""
  });

  useEffect(() => {
    loadPrescriptions();
    loadPatients();
  }, []);

  async function loadPrescriptions() {
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPrescriptions(data);
      } else if (data.error) {
        console.error("API error:", data.error);
      }
    } catch (err) {
      console.error("Error loading prescriptions:", err);
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
      console.error("Error loading patients:", err);
    }
  }

  async function addPrescription() {
    if (!form.patient_id || !form.medicine) {
      alert("Please select a patient and enter a medicine name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.error) {
        alert("Error: " + (data.error.message || data.error));
      } else {
        setShowAdd(false);
        setForm({ patient_id: "", medicine: "", dosage: "", duration: "", notes: "" });
        loadPrescriptions();
      }
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = (p: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Safely get patient name from joined data or the patient list
    const patientName = p.patients?.name || patients.find(pat => pat.id === p.patient_id)?.name || 'Patient';

    const html = `
      <html>
        <head>
          <title>Prescription - ${patientName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 3px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .clinic-name { font-size: 28px; font-weight: bold; color: #3182ce; }
            .label { font-weight: bold; color: #718096; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
            .value { font-size: 18px; margin-bottom: 20px; color: #2d3748; }
            .medicine-box { background: #f7fafc; padding: 25px; border-radius: 12px; border: 1px solid #edf2f7; margin: 20px 0; }
            .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #a0aec0; text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-name">MediCore Clinic Suite</div>
              <div style="color: #4a5568;">Official Medical Prescription</div>
            </div>
            <div style="text-align: right; color: #718096;">Date: ${new Date(p.created_at || Date.now()).toLocaleDateString()}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <span class="label">Patient Name</span><br/>
              <div class="value">${patientName}</div>
            </div>
          </div>

          <div class="medicine-box">
            <span class="label">Prescribed Medication</span><br/>
            <div class="value" style="font-size: 22px; font-weight: bold; color: #2d3748; border-bottom: 1px solid #cbd5e0; padding-bottom: 10px;">Rx: ${p.medicine}</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
               <div>
                  <span class="label">Dosage</span><br/>
                  <div class="value">${p.dosage}</div>
               </div>
               <div>
                  <span class="label">Duration</span><br/>
                  <div class="value">${p.duration}</div>
               </div>
            </div>
          </div>

          <span class="label">Instructions / Notes</span><br/>
          <div class="value">${p.notes || 'No special instructions provided.'}</div>

          <div class="footer">
            Generated by MediCore Clinic Suite • Digital ID: ${p.id || 'TEMP-ID'}
            <br/>This is a computer-generated prescription.
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a202c" }}>Prescriptions</h1>
          <p style={{ color: "#718096" }}>Record and print medical instructions</p>
        </div>
        <button 
          style={{ background: "#3182ce", color: "white", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", border: "none", fontWeight: "600", boxShadow: "0 4px 6px rgba(49, 130, 206, 0.2)" }}
          onClick={() => setShowAdd(true)}
        >
          ＋ New Prescription
        </button>
      </header>

      <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f7fafc", textAlign: "left" }}>
              <th style={{ padding: "1.25rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Patient</th>
              <th style={{ padding: "1.25rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Medicine</th>
              <th style={{ padding: "1.25rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dosage</th>
              <th style={{ padding: "1.25rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Duration</th>
              <th style={{ padding: "1.25rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#cbd5e0" }}>No medical records found.</td></tr>
            ) : (
              prescriptions.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f7fafc" }} className="table-row">
                  <td style={{ padding: "1.25rem", fontWeight: "600", color: "#2d3748" }}>
                    {p.patients?.name || patients.find(pat => pat.id === p.patient_id)?.name || 'N/A'}
                  </td>
                  <td style={{ padding: "1.25rem" }}>
                    <span style={{ color: "#3182ce", fontWeight: "700", background: "#ebf8ff", padding: "4px 8px", borderRadius: "4px" }}>{p.medicine}</span>
                  </td>
                  <td style={{ padding: "1.25rem", color: "#4a5568" }}>{p.dosage}</td>
                  <td style={{ padding: "1.25rem", color: "#4a5568" }}>{p.duration}</td>
                  <td style={{ padding: "1.25rem", textAlign: "right" }}>
                    <button 
                      onClick={() => handlePrint(p)}
                      style={{ background: "#3182ce", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", color: "white", fontSize: "0.875rem", fontWeight: "600" }}
                    >
                      Print 🖨️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26, 32, 44, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "550px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <h2 style={{ marginBottom: "2rem", fontSize: "24px", fontWeight: "bold", color: "#1a202c" }}>New Prescription</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#4a5568" }}>Select Patient</label>
                <select 
                  style={{ width: "100%", padding: "12px", border: "2px solid #e2e8f0", borderRadius: "10px", outline: "none" }}
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                >
                  <option value="">Choose from records...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#4a5568" }}>Medicine & Strength</label>
                <input 
                  style={{ width: "100%", padding: "12px", border: "2px solid #e2e8f0", borderRadius: "10px" }} 
                  placeholder="e.g. Amoxicillin 500mg"
                  value={form.medicine} 
                  onChange={e => setForm({...form, medicine: e.target.value})} 
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#4a5568" }}>Dosage Frequency</label>
                  <input 
                    style={{ width: "100%", padding: "12px", border: "2px solid #e2e8f0", borderRadius: "10px" }} 
                    placeholder="e.g. 1-0-1"
                    value={form.dosage} 
                    onChange={e => setForm({...form, dosage: e.target.value})} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#4a5568" }}>Duration</label>
                  <input 
                    style={{ width: "100%", padding: "12px", border: "2px solid #e2e8f0", borderRadius: "10px" }} 
                    placeholder="e.g. 7 days"
                    value={form.duration} 
                    onChange={e => setForm({...form, duration: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#4a5568" }}>Additional Instructions</label>
                <textarea 
                  style={{ width: "100%", padding: "12px", border: "2px solid #e2e8f0", borderRadius: "10px", minHeight: "100px", resize: "none" }} 
                  placeholder="Take after food, avoid cold water..."
                  value={form.notes} 
                  onChange={e => setForm({...form, notes: e.target.value})} 
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "none", background: "#f7fafc", color: "#718096", cursor: "pointer", fontWeight: "600" }}>Discard</button>
              <button 
                onClick={addPrescription} 
                disabled={loading} 
                style={{ flex: 1, padding: "14px", borderRadius: "10px", background: "#38a169", color: "white", border: "none", cursor: "pointer", fontWeight: "700", boxShadow: "0 4px 6px rgba(56, 161, 105, 0.2)" }}
              >
                {loading ? "Processing..." : "Confirm Rx"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}