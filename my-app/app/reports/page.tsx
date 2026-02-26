"use client";
import { useState } from "react";

export default function ReportsPage() {
  const reports = [
    { id: 1, title: "Monthly Patient Summary", date: "2024-02-01", type: "Statistical" },
    { id: 2, title: "Revenue Report - Q1", date: "2024-01-15", type: "Financial" },
    { id: 3, title: "Patient Demographic Analysis", date: "2024-02-10", type: "Statistical" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Clinic Reports</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
        {reports.map(report => (
          <div key={report.id} className="card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #edf2f7", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <h3 style={{ margin: "0 0 0.5rem 0" }}>{report.title}</h3>
            <p style={{ margin: "0", color: "#718096", fontSize: "0.875rem" }}>Type: {report.type}</p>
            <p style={{ margin: "0.5rem 0 1rem 0", color: "#a0aec0", fontSize: "0.75rem" }}>Generated: {report.date}</p>
            <button style={{ background: "#3182ce", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", width: '100%' }}>
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}