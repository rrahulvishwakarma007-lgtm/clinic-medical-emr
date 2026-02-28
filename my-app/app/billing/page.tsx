"use client";

import { useEffect, useState } from "react";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    amount: "",
    service: "",
    status: "Paid",
    date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    loadInvoices();
    loadPatients();
  }, []);

  async function loadInvoices() {
    try {
      const res = await fetch("/api/billing");
      const data = await res.json();
      if (Array.isArray(data)) setInvoices(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPatients() {
    try {
      const res = await fetch("/api/patients");
      const result = await res.json();
      if (result.success) setPatients(result.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function createInvoice() {
    if (!form.patient_id || !form.amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount)
        })
      });
      const result = await res.json();
      if (result.success) {
        setShowAdd(false);
        setForm({ patient_id: "", amount: "", service: "", status: "Paid", date: new Date().toISOString().split("T")[0] });
        loadInvoices();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err: any) {
      alert("System Error: " + err.message);
    }
    setLoading(false);
  }

  const handlePrint = (inv: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `
      <html>
        <head>
          <title>Invoice - ${inv.patients?.name || 'Patient'}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #3182ce; }
            .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; background: #f7fafc; padding: 12px; border-bottom: 2px solid #edf2f7; }
            td { padding: 12px; border-bottom: 1px solid #edf2f7; }
            .total { text-align: right; font-size: 20px; font-weight: bold; color: #2d3748; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">MediCore Clinic Suite</div>
            <div style="font-size: 18px; color: #4a5568;">Invoice Record</div>
          </div>
          <div class="invoice-details">
            <div>
              <strong>Bill To:</strong><br/>
              ${inv.patients?.name || 'N/A'}<br/>
              Date: ${new Date(inv.date).toLocaleDateString()}
            </div>
            <div style="text-align: right;">
              <strong>Invoice ID:</strong> #${inv.id}<br/>
              <strong>Status:</strong> ${inv.status}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Service Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${inv.service || 'Medical Consultation'}</td>
                <td style="text-align: right;">$${inv.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">Total Amount: $${inv.amount.toFixed(2)}</div>
          <div style="margin-top: 100px; text-align: center; font-size: 12px; color: #a0aec0;">
            Thank you for choosing MediCore Clinic Suite
          </div>
          <script>window.print();</script>
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
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a202c" }}>Billing & Invoices</h1>
          <p style={{ color: "#718096" }}>Generate and track patient payments</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          style={{ background: "#3182ce", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}
        >
          ＋ New Invoice
        </button>
      </header>

      <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f7fafc", textAlign: "left" }}>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase" }}>Patient</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase" }}>Service</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase" }}>Amount</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", textTransform: "uppercase", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#cbd5e0" }}>No billing records found.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #f7fafc" }}>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>{inv.patients?.name || 'N/A'}</td>
                  <td style={{ padding: "1rem" }}>{inv.service}</td>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>${inv.amount.toFixed(2)}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", background: inv.status === 'Paid' ? '#c6f6d5' : '#feebc8', color: inv.status === 'Paid' ? '#22543d' : '#744210' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button 
                      onClick={() => handlePrint(inv)}
                      style={{ background: "#edf2f7", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#3182ce" }}
                    >
                      Print Invoice 🖨️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "500px" }}>
            <h2 style={{ marginBottom: "2rem" }}>New Billing Entry</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Patient</label>
                <select 
                  style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "10px" }}
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Service Name</label>
                <input 
                  style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "10px" }}
                  placeholder="e.g. General Consultation"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Amount ($)</label>
                  <input 
                    type="number"
                    style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "10px" }}
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Status</label>
                  <select 
                    style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "10px" }}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={createInvoice} disabled={loading} style={{ flex: 1, padding: "14px", borderRadius: "10px", background: "#38a169", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                {loading ? "Processing..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}