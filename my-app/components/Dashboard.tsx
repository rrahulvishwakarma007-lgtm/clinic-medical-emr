"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todaysAppointments: 0,
    prescriptionsIssued: 0,
  });
  const [todaysList, setTodaysList] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // State for the Registration Window
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadDashboardData() {
    try {
      // 1. Fetch live counts from internal API
      const pRes = await fetch("/api/patients");
      const pData = await pRes.json();
      
      const aRes = await fetch("/api/appointments");
      const aData = await aRes.json();
      
      const prRes = await fetch("/api/prescriptions");
      const prData = await prRes.json();

      const today = new Date().toISOString().split("T")[0];
      const todaysAppointments = Array.isArray(aData) ? aData.filter((a: any) => a.date === today) : [];

      setStats({
        totalPatients: pData.success ? pData.data.length : 0,
        todaysAppointments: todaysAppointments.length,
        prescriptionsIssued: Array.isArray(prData) ? prData.length : 0,
      });
      setTodaysList(todaysAppointments);
      setRecentPatients(pData.success ? pData.data.slice(0, 5) : []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }

  async function handleRegisterPatient() {
    // Basic Validation
    if (!newPatient.name || !newPatient.age || !newPatient.phone) {
      return alert("Please enter Name, Age, and Phone Number.");
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatient.name,
          age: parseInt(newPatient.age),
          type: newPatient.type,
          date: newPatient.date,
          status: newPatient.status,
          phone: newPatient.phone,
          address: newPatient.address,
          blood_group: newPatient.blood_group,
        })
      });

      const result = await res.json();

      if (!result.success) {
        alert("Database Error: " + (result.error.message || result.error));
      } else {
        setShowAddPatient(false);
        setNewPatient({
          name: "",
          age: "",
          type: "General Patient",
          date: new Date().toISOString().split("T")[0],
          status: "Confirmed",
          phone: "",
          address: "",
          blood_group: "",
        });
        loadDashboardData();
      }
    } catch (err: any) {
      alert("System Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const filteredPatients = recentPatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{ fontSize: "28px", fontWeight: "bold", color: "#1a202c" }}
          >
            Clinic Dashboard
          </h1>
          <p style={{ color: "#718096" }}>
            Welcome back, Dr. Smith | {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input 
            type="text" 
            placeholder="Search patients..." 
            style={{ ...inputStyle, width: "250px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={() => setShowAddPatient(true)} style={btnPrimary}>
            + Register New Patient
          </button>
        </div>
      </header>

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card">
          <p>Total Patients</p>
          <h2>{stats.totalPatients}</h2>
        </div>
        <div className="card" style={{ borderLeft: "4px solid #3182ce" }}>
          <p>Today's Appointments</p>
          <h2>{stats.todaysAppointments}</h2>
        </div>
        <div className="card">
          <p>Prescriptions Issued</p>
          <h2>{stats.prescriptionsIssued}</h2>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* Today's Schedule Table */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem", fontWeight: "bold" }}>
            Today's Schedule
          </h3>
          {todaysList.length === 0 ? (
            <p style={{ color: "#a0aec0" }}>No appointments for today.</p>
          ) : (
            <table style={{ width: "100%", textAlign: "left" }}>
              <tbody>
                {todaysList.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f7fafc" }}>
                    <td style={{ padding: "12px", fontWeight: "600" }}>
                      {a.time}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {a.patients?.name || "Patient"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          background: "#c6f6d5",
                          color: "#22543d",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem", fontWeight: "bold" }}>
            Recent Activity
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {filteredPatients.map((p) => (
              <div
                key={p.id}
                style={{
                  fontSize: "14px",
                  borderBottom: "1px solid #f7fafc",
                  paddingBottom: "8px",
                }}
              >
                <strong>{p.name}</strong> registered ({p.blood_group || "N/A"})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REGISTRATION MODAL WINDOW */}
      {showAddPatient && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginBottom: "1.5rem" }}>Register New Patient</h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <input
                placeholder="Patient Name"
                style={inputStyle}
                value={newPatient.name}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, name: e.target.value })
                }
              />

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  placeholder="Age"
                  type="number"
                  style={{ ...inputStyle, flex: 1 }}
                  value={newPatient.age}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, age: e.target.value })
                  }
                />
                <select
                  style={{ ...inputStyle, flex: 1 }}
                  value={newPatient.blood_group}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      blood_group: e.target.value,
                    })
                  }
                >
                  <option value="">Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <input
                placeholder="Phone Number"
                style={inputStyle}
                value={newPatient.phone}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, phone: e.target.value })
                }
              />

              <select
                style={inputStyle}
                value={newPatient.type}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, type: e.target.value })
                }
              >
                <option value="General Patient">General Patient</option>
                <option value="Emergency">Emergency</option>
                <option value="Follow-up">Follow-up</option>
              </select>

              <textarea
                placeholder="Full Address"
                style={{ ...inputStyle, minHeight: "60px", resize: "none" }}
                value={newPatient.address}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, address: e.target.value })
                }
              />
              <input
                type="date"
                style={inputStyle}
                value={newPatient.date}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, date: e.target.value })
                }
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => setShowAddPatient(false)}
                style={btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterPatient}
                disabled={isSaving}
                style={btnSave}
              >
                {isSaving ? "Saving..." : "Save Patient"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }
        h2 {
          font-size: 32px;
          font-weight: bold;
          color: #2d3748;
        }
      `}</style>
    </div>
  );
}

// Styling Constants
const modalOverlay: any = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};
const modalContent: any = {
  background: "white",
  padding: "2rem",
  borderRadius: "16px",
  width: "450px",
  maxHeight: "90vh",
  overflowY: "auto",
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
};
const btnPrimary = {
  background: "#3182ce",
  color: "white",
  padding: "10px 24px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
};
const btnSecondary = {
  flex: 1,
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
};
const btnSave = {
  flex: 1,
  padding: "12px",
  borderRadius: "8px",
  background: "#38a169",
  color: "white",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};
