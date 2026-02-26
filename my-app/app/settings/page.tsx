"use client";
import { useState } from "react";

export default function SettingsPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Clinic Settings</h1>
      <div className="card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #edf2f7", marginTop: "1rem" }}>
        <h3>General Configuration</h3>
        <div style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>Clinic Name</label>
            <input type="text" defaultValue="MediCore Clinic" style={{ width: "100%", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem" }}>Doctor Name</label>
            <input type="text" defaultValue="Dr. Smith" style={{ width: "100%", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
          </div>
          <button style={{ background: "#3182ce", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer" }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}