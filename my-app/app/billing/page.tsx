"use client";
import { useState, useEffect } from "react";

export default function BillingPage() {
  const [invoices, setInvoices] = useState([
    { id: "INV-001", patient: "John Doe", amount: 150, status: "Paid", date: "2024-02-20" },
    { id: "INV-002", patient: "Jane Smith", amount: 200, status: "Pending", date: "2024-02-22" },
  ]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Billing & Invoices</h1>
      <div className="card" style={{ marginTop: "1rem", background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #edf2f7", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Recent Invoices</h3>
          <button style={{ background: "#3182ce", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
            + Create Invoice
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #edf2f7", textAlign: "left" }}>
              <th style={{ padding: "1rem" }}>Invoice ID</th>
              <th style={{ padding: "1rem" }}>Patient</th>
              <th style={{ padding: "1rem" }}>Amount</th>
              <th style={{ padding: "1rem" }}>Status</th>
              <th style={{ padding: "1rem" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                <td style={{ padding: "1rem" }}>{inv.id}</td>
                <td style={{ padding: "1rem" }}>{inv.patient}</td>
                <td style={{ padding: "1rem" }}>${inv.amount}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: "9999px", 
                    fontSize: "0.75rem", 
                    background: inv.status === "Paid" ? "#c6f6d5" : "#feebc8",
                    color: inv.status === "Paid" ? "#22543d" : "#744210"
                  }}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}