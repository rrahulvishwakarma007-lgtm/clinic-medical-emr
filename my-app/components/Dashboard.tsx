"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    prescriptionsCount: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    type: ""
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    // Load Patients
    const { data: patientsData } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (patientsData) {
      setPatients(patientsData);
      
      // Load Prescriptions count
      const { count: pCount } = await supabase
        .from("prescriptions")
        .select("*", { count: 'exact', head: true });
      
      // Load Appointments count (Today)
      const today = new Date().toISOString().split('T')[0];
      const { count: aCount } = await supabase
        .from("appointments")
        .select("*", { count: 'exact', head: true });

      setStats({
        totalPatients: patientsData.length,
        todayAppointments: aCount || 0,
        prescriptionsCount: pCount || 0
      });

      setRecentActivity(patientsData.slice(0, 5));
    }
  }

  async function addPatient() {
    if (!newPatient.name) {
      alert("Name required");
      return;
    }

    const { error } = await supabase
      .from("patients")
      .insert({
        name: newPatient.name,
        age: Number(newPatient.age),
        type: newPatient.type,
        status: "confirmed"
      });

    if (error) {
      alert("Insert failed");
      return;
    }

    setShowForm(false);
    setNewPatient({ name: "", age: "", type: "" });
    loadDashboardData();
  }

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Clinic Dashboard</h1>
          <p className="text-muted">Welcome back, Dr. Smith</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ＋ Register New Patient
        </button>
      </header>

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Patients</div>
          <div className="stat-value">{stats.totalPatients}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Appointments</div>
          <div className="stat-value">{stats.todayAppointments}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prescriptions Issued</div>
          <div className="stat-value">{stats.prescriptionsCount}</div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* MAIN LIST */}
        <div className="main-section">
          <div className="section-card">
            <div className="section-header">
              <h3>Patients Directory</h3>
              <input 
                type="text" 
                placeholder="Search patients..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="patient-list">
              {filteredPatients.length === 0 ? (
                <p className="empty-state">No patients found.</p>
              ) : (
                filteredPatients.map((p) => (
                  <Link key={p.id} href={`/patients/${p.id}`} className="patient-item">
                    <div className="patient-info">
                      <div className="patient-name">{p.name}</div>
                      <div className="patient-meta">{p.type} • Age: {p.age}</div>
                    </div>
                    <div className="patient-status status-confirmed">Confirmed</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR ACTIVITY */}
        <aside className="activity-section">
          <div className="section-card">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map((a) => (
                <div key={a.id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-text">
                    <strong>{a.name}</strong> was registered as a new patient.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Patient</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  placeholder="e.g. John Doe"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Patient Type</label>
                <input
                  placeholder="e.g. Outpatient"
                  value={newPatient.type}
                  onChange={(e) => setNewPatient({ ...newPatient, type: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-success" onClick={addPatient}>Save Patient</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #edf2f7; }
        .stat-label { color: #718096; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; }
        .stat-value { font-size: 1.875rem; font-weight: 700; color: #2d3748; }
        
        .dashboard-content { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
        .section-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #edf2f7; height: 100%; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .search-input { padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; width: 250px; }
        
        .patient-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .patient-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-radius: 8px; text-decoration: none; color: inherit; transition: background 0.2s; }
        .patient-item:hover { background: #f7fafc; }
        .patient-name { font-weight: 600; color: #2d3748; }
        .patient-meta { font-size: 0.875rem; color: #718096; }
        
        .patient-status { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 9999px; }
        .status-confirmed { background: #c6f6d5; color: #22543d; }
        
        .activity-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
        .activity-item { display: flex; gap: 0.75rem; align-items: flex-start; }
        .activity-dot { width: 8px; height: 8px; background: #4299e1; border-radius: 50%; margin-top: 6px; }
        .activity-text { font-size: 0.875rem; color: #4a5568; line-height: 1.4; }

        .btn { padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.9; }
        .btn-primary { background: #3182ce; color: white; }
        .btn-secondary { background: #edf2f7; color: #4a5568; }
        .btn-success { background: #38a169; color: white; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { padding: 1.25rem; border-bottom: 1px solid #edf2f7; display: flex; justify-content: space-between; align-items: center; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #a0aec0; }
        .modal-body { padding: 1.5rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; }
        .form-group input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; }
        .modal-footer { padding: 1.25rem; border-top: 1px solid #edf2f7; display: flex; justify-content: flex-end; gap: 0.75rem; }
      `}</style>
    </div>
  );
}