"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PatientsPage() {

  const [patients,setPatients] = useState<any[]>([]);

  useEffect(()=>{
    loadPatients();
  },[]);

  async function loadPatients(){
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (data && !data.error) {
        setPatients(data);
      } else if (data.error) {
        console.error("API error:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  return (
    <div className="patients-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Patients Directory</h1>
      </header>

      <div className="section-card" style={{ background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid #edf2f7" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #edf2f7", textAlign: "left" }}>
              <th style={{ padding: "1rem", color: "#718096", fontSize: "0.875rem", fontWeight: "600" }}>NAME</th>
              <th style={{ padding: "1rem", color: "#718096", fontSize: "0.875rem", fontWeight: "600" }}>AGE</th>
              <th style={{ padding: "1rem", color: "#718096", fontSize: "0.875rem", fontWeight: "600" }}>TYPE</th>
              <th style={{ padding: "1rem", color: "#718096", fontSize: "0.875rem", fontWeight: "600" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#a0aec0" }}>No patients found.</td>
              </tr>
            ) : (
              patients.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: "600", color: "#2d3748" }}>{p.name}</div>
                  </td>
                  <td style={{ padding: "1rem", color: "#4a5568" }}>{p.age} years</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", background: "#ebf8ff", color: "#3182ce", fontWeight: "600" }}>
                      {p.type}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <Link href={`/patients/${p.id}`} style={{ color: "#3182ce", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem" }}>
                      View Profile →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}