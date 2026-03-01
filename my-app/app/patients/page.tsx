"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PatientsPage() {

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function loadPatients() {
    setLoading(true);
    try {
      const res = await fetch("/api/patients", {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR:", text);
        return;
      }

      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setPatients(result.data);
      } 
      else if (Array.isArray(result)) {
        setPatients(result);
      } 
      else if (result.error) {
        console.error("API error:", result.error);
      }

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="patients-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a202c" }}>Patients Directory</h1>
          <p style={{ color: "#718096", fontSize: "14px" }}>Manage and view all patient medical records</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a0aec0" }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search by name..." 
              style={{ padding: "12px 12px 12px 40px", border: "1.5px solid #e2e8f0", borderRadius: "10px", width: "320px", fontSize: "14px", outline: "none", transition: "all 0.2s" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = "#3182ce"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
        </div>
      </header>

      <div className="section-card" style={{ background: "white", borderRadius: "16px", padding: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #edf2f7" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Patient Details</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Age</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Classification</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
              <th style={{ padding: "1rem", color: "#a0aec0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "4rem", textAlign: "center" }}>
                  <div style={{ color: "#3182ce", fontWeight: "600" }}>Fetching records...</div>
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#a0aec0" }}>
                  <div style={{ fontSize: "40px", marginBottom: "1rem" }}>👥</div>
                  No patient records found.
                </td>
              </tr>
            ) : (
              filteredPatients.map((p) => (
                <tr key={p.id} style={{ background: "white", transition: "transform 0.2s" }} className="patient-row">
                  <td style={{ padding: "1.25rem 1rem", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc", borderLeft: "1px solid #f7fafc", borderRadius: "12px 0 0 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", background: "#ebf8ff", color: "#3182ce", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: "700", color: "#2d3748", fontSize: "15px" }}>{p.name}</div>
                        <div style={{ fontSize: "12px", color: "#a0aec0" }}>ID: #{p.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1.25rem 1rem", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc", color: "#4a5568", fontWeight: "500" }}>
                    {p.age} years
                  </td>
                  <td style={{ padding: "1.25rem 1rem", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc" }}>
                    <span style={{ padding: "0.4rem 1rem", borderRadius: "8px", fontSize: "0.75rem", background: p.type === 'Emergency' ? '#fff5f5' : '#ebf8ff', color: p.type === 'Emergency' ? '#c53030' : '#3182ce', fontWeight: "700" }}>
                      {p.type}
                    </span>
                  </td>
                  <td style={{ padding: "1.25rem 1rem", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#48bb78" }}></span>
                      <span style={{ fontSize: "13px", color: "#4a5568", fontWeight: "500" }}>Active</span>
                    </div>
                  </td>
                  <td style={{ padding: "1.25rem 1rem", borderTop: "1px solid #f7fafc", borderBottom: "1px solid #f7fafc", borderRight: "1px solid #f7fafc", borderRadius: "0 12px 12px 0", textAlign: "right" }}>
                    <Link
                      href={`/patients/${p.id}`}
                      style={{
                        background: "#f7fafc",
                        color: "#3182ce",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "700",
                        fontSize: "0.875rem",
                        transition: "all 0.2s"
                      }}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .patient-row:hover {
          background-color: #f8fbff !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}