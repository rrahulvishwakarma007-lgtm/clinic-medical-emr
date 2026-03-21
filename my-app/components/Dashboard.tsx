"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import hospitalConfig from "@/config/hospital";

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  "Confirmed":   { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  "Waiting":     { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  "In Progress": { bg: "#ede9fe", color: "#6d28d9", dot: "#8b5cf6" },
  "Completed":   { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  "Cancelled":   { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

function calcAge(dob: string): number {
  if (!dob) return 0;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function formatTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={color} opacity="0.08" />
    </svg>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    start.current = display;
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start.current + (value - start.current) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{display}</>;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalPatients: 0, todaysAppointments: 0, prescriptionsIssued: 0, pendingBilling: 0 });
  const [todaysList, setTodaysList] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissOverdue, setDismissOverdue] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule"|"patients">("schedule");
  const [sparkData] = useState([4,7,5,9,6,11,8,13,10,15,12,14]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [newPatient, setNewPatient] = useState({
    name: "", dob: "", type: "General Patient",
    status: "Confirmed", phone: "", address: "", blood_group: "", allergies: "",
  });
  const previewAge = newPatient.dob ? calcAge(newPatient.dob) : null;

  useEffect(() => {
    const user = localStorage.getItem("clinic_user");
    if (!user) { window.location.href = "/login"; return; }
    setMounted(true);
    loadDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [pRes, aRes, prRes, bRes] = await Promise.all([
        fetch("/api/patients"), fetch("/api/appointments"),
        fetch("/api/prescriptions"), fetch("/api/billing"),
      ]);
      const [pData, aData, prData, bData] = await Promise.all([pRes.json(), aRes.json(), prRes.json(), bRes.json()]);

      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const todaysAppointments = Array.isArray(aData) ? aData.filter((a: any) => a.date === today) : [];
      const overdue = todaysAppointments.filter((a: any) => {
        if (a.status !== "Confirmed" || !a.time) return false;
        const [h, m] = a.time.split(":").map(Number);
        return (h * 60 + m) < nowMinutes;
      });
      const pendingBilling = Array.isArray(bData) ? bData.filter((b: any) => b.status === "Pending").length : 0;

      setStats({
        totalPatients: pData.success ? pData.data.length : 0,
        todaysAppointments: todaysAppointments.length,
        prescriptionsIssued: Array.isArray(prData) ? prData.length : 0,
        pendingBilling,
      });
      setTodaysList(todaysAppointments.sort((a: any, b: any) => (a.time || "").localeCompare(b.time || "")));
      setOverdueList(overdue);
      setAllPatients(pData.success ? pData.data : []);
      setRecentPatients(pData.success ? pData.data.slice(0, 8) : []);
      setRecentPrescriptions(Array.isArray(prData) ? prData.slice(0, 6) : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleRegisterPatient() {
    if (!newPatient.name || !newPatient.dob || !newPatient.phone) return alert("Please enter Name, Date of Birth, and Phone.");
    setIsSaving(true);
    try {
      const age = calcAge(newPatient.dob);
      const res = await fetch("/api/patients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPatient, age }),
      });
      const result = await res.json();
      if (!result.success) alert("Error: " + (result.error?.message || result.error));
      else {
        setShowAddPatient(false);
        setNewPatient({ name: "", dob: "", type: "General Patient", status: "Confirmed", phone: "", address: "", blood_group: "", allergies: "" });
        loadDashboardData();
      }
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setIsSaving(false); }
  }

  const filteredPatients = recentPatients.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const inp: any = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: "10px", fontSize: "14px", boxSizing: "border-box",
    fontFamily: "'Outfit', sans-serif", background: "#f8fafc", color: "#1a1a2e",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const STAT_CARDS = [
    {
      label: "Total Patients", value: stats.totalPatients, icon: "👥",
      color: "#0f4c81", light: "#e8f0fe", trend: "+12%", trendUp: true,
      sub: "Registered"
    },
    {
      label: "Today's Visits", value: stats.todaysAppointments, icon: "🗓",
      color: "#7c3aed", light: "#ede9fe", trend: "Scheduled", trendUp: true,
      sub: "Appointments"
    },
    {
      label: "Prescriptions", value: stats.prescriptionsIssued, icon: "💊",
      color: "#059669", light: "#d1fae5", trend: "Issued", trendUp: true,
      sub: "Total"
    },
    {
      label: "Pending Bills", value: stats.pendingBilling, icon: "⚠️",
      color: "#d97706", light: "#fef3c7", trend: "Action", trendUp: false,
      sub: "Unpaid"
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Outfit', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --navy: #0f4c81;
          --navy-dark: #0a3460;
          --navy-light: #e8f0fe;
          --surface: #ffffff;
          --surface-2: #f8fafc;
          --border: #e8edf2;
          --text-1: #0d1b2e;
          --text-2: #4a5568;
          --text-3: #94a3b8;
          --shadow-sm: 0 1px 3px rgba(15,76,129,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(15,76,129,0.10), 0 2px 8px rgba(0,0,0,0.06);
          --shadow-lg: 0 12px 40px rgba(15,76,129,0.15), 0 4px 16px rgba(0,0,0,0.08);
          --radius: 16px;
          --radius-sm: 10px;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        /* Animations */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse2 { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.6; transform: scale(0.95); } }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        .dash-root { animation: fadeIn 0.4s ease; }

        .stat-card {
          background: white;
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          transition: transform 0.2s, box-shadow 0.2s;
          animation: fadeSlideUp 0.5s ease both;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--card-accent);
          border-radius: 3px 3px 0 0;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        .glass-header {
          background: linear-gradient(135deg, #0d1b2e 0%, #0f4c81 60%, #1a6bbf 100%);
          position: relative;
          overflow: visible;
        }
        .glass-header::after {
          content: '';
          position: absolute;
          top: -50%; right: -10%;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .glass-header::before {
          content: '';
          position: absolute;
          bottom: -60%; left: 20%;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(26,107,191,0.3) 0%, transparent 70%);
          pointer-events: none;
        }

        .nav-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.65);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          display: flex; align-items: center; gap: 6px;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .nav-btn.active { background: rgba(255,255,255,0.15); color: white; font-weight: 600; }

        .quick-action {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px;
          border-radius: var(--radius-sm);
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'Outfit', sans-serif;
          font-size: 13px; font-weight: 600;
          text-align: left;
        }
        .quick-action:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .quick-action .qa-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }

        .section-card {
          background: white;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          animation: fadeSlideUp 0.5s ease both;
        }
        .section-header {
          padding: 18px 22px;
          border-bottom: 1px solid #f0f4f8;
          display: flex; align-items: center; justify-content: space-between;
        }
        .section-title {
          font-size: 14px; font-weight: 700; color: var(--text-1);
          display: flex; align-items: center; gap: 8px;
        }
        .section-title .dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--navy);
        }

        .appt-row { border-bottom: 1px solid #f7fafc; transition: background 0.15s; }
        .appt-row:hover td { background: #f8fbff !important; }
        .appt-row:last-child { border-bottom: none; }

        .patient-chip {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid transparent;
          transition: all 0.15s;
          cursor: pointer;
        }
        .patient-chip:hover { background: #f8fbff; border-color: #dbeafe; }

        .avatar {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; flex-shrink: 0;
        }

        .badge {
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .badge .badge-dot {
          width: 5px; height: 5px; border-radius: 50%;
        }

        .tab-btn {
          padding: 6px 14px; border-radius: 7px;
          font-size: 12px; font-weight: 600;
          border: none; cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .tab-btn.active { background: var(--navy); color: white; }
        .tab-btn.inactive { background: transparent; color: #94a3b8; }
        .tab-btn.inactive:hover { background: #f0f4f8; color: #4a5568; }

        .register-btn {
          background: white;
          color: var(--navy);
          border: 1.5px solid rgba(255,255,255,0.3);
          padding: 9px 18px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 6px;
          backdrop-filter: blur(8px);
        }
        .register-btn:hover { background: #f0f4f8; transform: translateY(-1px); }

        .search-wrap {
          position: relative; display: flex; align-items: center;
        }
        .search-icon { position: absolute; left: 11px; color: #64748b; font-size: 14px; z-index: 1; pointer-events: none; }
        .search-input-hdr {
          padding: 9px 14px 9px 34px;
          border-radius: 9px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #1a1a2e;
          font-size: 13px;
          width: 220px;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s;
        }
        .search-input-hdr::placeholder { color: #94a3b8; }
        .search-input-hdr:focus { outline: none !important; border-color: #0f4c81 !important; box-shadow: 0 0 0 3px rgba(15,76,129,0.12) !important; width: 260px; background: white !important; }
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(15,76,129,0.2), 0 4px 16px rgba(0,0,0,0.08);
          z-index: 99999;
          overflow: hidden;
          animation: fadeSlideUp 0.15s ease;
          min-width: 320px;
        }
        .search-result-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid #f0f4f8;
        }
        .search-result-item:last-child { border-bottom: none; }
        .search-result-item:hover { background: #f0f7ff; }

        .overdue-banner {
          background: linear-gradient(135deg, #fffbeb, #fef3c7);
          border: 1px solid #fcd34d;
          border-left: 4px solid #d97706;
          border-radius: 14px;
          padding: 16px 20px;
          animation: fadeSlideUp 0.4s ease;
        }

        .skeleton {
          background: linear-gradient(90deg, #f0f4f8 25%, #e8edf2 50%, #f0f4f8 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px;
        }

        .live-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981;
          position: relative;
        }
        .live-dot::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: #10b981;
          opacity: 0.3;
          animation: ripple 1.5s infinite;
        }

        .rx-card {
          background: #f8fbff;
          border: 1px solid #dbeafe;
          border-left: 3px solid var(--navy);
          border-radius: 10px;
          padding: 14px 16px;
          transition: all 0.15s;
        }
        .rx-card:hover { background: #eef4ff; transform: translateX(2px); }

        input:focus, select:focus, textarea:focus {
          outline: none !important;
          border-color: var(--navy) !important;
          box-shadow: 0 0 0 3px rgba(15,76,129,0.12) !important;
          background: white !important;
        }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(10, 20, 40, 0.65);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 20px;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .modal-box {
          background: white;
          border-radius: 20px;
          width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
          animation: fadeSlideUp 0.25s ease;
        }
        .modal-header {
          padding: 28px 28px 0;
          background: linear-gradient(135deg, #f8fafc, white);
          border-bottom: 1px solid #f0f4f8;
          padding-bottom: 20px;
          margin-bottom: 0;
        }

        .time-display {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.5px;
        }

        /* ── Appointment table scroll ── */
        .appt-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }
        .appt-table-wrap table { min-width: 520px; width: 100%; border-collapse: collapse; }
        .appt-table-wrap table th,
        .appt-table-wrap table td { display: table-cell !important; white-space: nowrap !important; max-width: unset !important; overflow: visible !important; }
        .appt-table-wrap table th:last-child,
        .appt-table-wrap table td:last-child { display: table-cell !important; }
        .appt-table-wrap table th:nth-child(4),
        .appt-table-wrap table td:nth-child(4) { display: table-cell !important; }

        /* ── Tablet ── */
        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .qa-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {

          /* Nav header — compact */
          .glass-header { padding: 0 1rem !important; }
          .dash-nav-row { height: auto !important; flex-wrap: wrap !important; gap: 8px !important; padding: 10px 0 !important; }

          /* Hide text labels on nav, keep icons */
          .nav-btn { padding: 7px 10px !important; font-size: 12px !important; }

          /* Search + register btn — stack below nav */
          .dash-right-row { width: 100% !important; justify-content: space-between !important; }
          .search-input-hdr { width: 160px !important; font-size: 12px !important; }
          .search-input-hdr:focus { width: 180px !important; }
          .register-btn { padding: 7px 12px !important; font-size: 12px !important; }

          /* Sub-header — stack */
          .dash-subheader { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; padding: 10px 1rem !important; }
          .dash-subheader-left { flex-wrap: wrap !important; gap: 8px !important; }

          /* Main content padding */
          .dash-root { padding: 14px 1rem !important; }

          /* Stat cards — 2 col */
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .stat-card { padding: 16px !important; }
          .stat-card svg { display: none !important; } /* hide sparkline on mobile */

          /* Quick actions — 2 col */
          .qa-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .quick-action { padding: 10px 12px !important; font-size: 12px !important; }
          .quick-action .qa-icon { width: 30px !important; height: 30px !important; font-size: 15px !important; }

          /* Main grid — single col */
          .main-grid { grid-template-columns: 1fr !important; }

          /* Patients grid — single col */
          .patients-grid { grid-template-columns: 1fr !important; }

          /* Section header — wrap */
          .section-header { flex-wrap: wrap !important; gap: 8px !important; }

          /* Footer — stack */
          .dash-footer { flex-direction: column !important; gap: 10px !important; }
          .dash-footer-metrics { flex-wrap: wrap !important; gap: 12px !important; }

          /* Modal — bottom sheet */
          .modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .modal-box { width: 100% !important; max-width: 100% !important; border-radius: 20px 20px 0 0 !important; max-height: 95vh !important; }

          /* Modal form grid — single col */
          .modal-form-grid { grid-template-columns: 1fr !important; }

          /* Overdue banner */
          .overdue-banner { flex-direction: column !important; }
        }

        /* ── DESKTOP ENHANCEMENTS ── */
        @media (min-width: 1400px) {
          .dash-root { padding: 28px 3rem !important; }
          .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .qa-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .main-grid { grid-template-columns: 1.6fr 1fr !important; }
        }
      `}</style>

      {/* ── Top Navigation Header ─────────────────────────────────────────── */}
      <div className="glass-header" style={{ padding: "0 2rem" }}>
        <div className="dash-nav-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          {/* Logo + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px"
            }}>🏥</div>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "15px", fontFamily: "'Playfair Display', serif", letterSpacing: "0.3px" }}>
                {hospitalConfig.dashboardTitle || "Clinic EMR"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "1px" }}>
                Medical Records System
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: "2px" }}>
            {[
              { label: "Dashboard", icon: "⊞", path: "/" },
              { label: "Patients", icon: "👥", path: "/patients" },
              { label: "Appointments", icon: "📅", path: "/appointments" },
              { label: "Prescriptions", icon: "💊", path: "/prescriptions" },
              { label: "Billing", icon: "🧾", path: "/billing" },
            ].map(n => (
              <button key={n.label} className="nav-btn" onClick={() => router.push(n.path)}>
                <span>{n.icon}</span> {n.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="dash-right-row" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="search-wrap" ref={searchRef}>
              <span className="search-icon">🔍</span>
              <input
                type="text" placeholder="Search patients..."
                className="search-input-hdr"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearchDrop(true); }}
                onFocus={() => setShowSearchDrop(true)}
                onBlur={() => setTimeout(() => setShowSearchDrop(false), 250)}
              />
              {showSearchDrop && searchQuery.trim().length > 0 && (
                <div className="search-dropdown">
                  {allPatients.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      No patients found for "{searchQuery}"
                    </div>
                  ) : allPatients.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6).map(p => {
                    const colors = ["#e8f0fe:#1e40af", "#d1fae5:#065f46", "#ede9fe:#6d28d9", "#fef3c7:#92400e"];
                    const [bg, fg] = colors[p.name?.charCodeAt(0) % 4].split(":");
                    return (
                      <div key={p.id} className="search-result-item" onClick={() => { router.push("/patients"); setShowSearchDrop(false); setSearchQuery(""); }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", flexShrink: 0 }}>
                          {p.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "600", fontSize: "13px", color: "#1a1a2e" }}>{p.name}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {p.type || "General"} · Age {p.age || "—"} · {p.phone || "—"}
                            {p.allergies && <span style={{ color: "#e53e3e", marginLeft: "4px" }}>⚠ Allergy</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: "11px", color: "#0f4c81", fontWeight: "600" }}>View →</span>
                      </div>
                    );
                  })}
                  <div style={{ padding: "8px 14px", borderTop: "1px solid #f0f4f8", background: "#f8fafc" }}>
                    <button onClick={() => { router.push("/patients"); setShowSearchDrop(false); }} style={{ background: "none", border: "none", color: "#0f4c81", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                      View all patients →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button className="register-btn" onClick={() => setShowAddPatient(true)}>
              <span style={{ fontSize: "16px" }}>＋</span> Register Patient
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-header: Doctor info + time ───────────────────────────────── */}
      <div className="dash-subheader" style={{
        background: "white", borderBottom: "1px solid #e8edf2",
        padding: "12px 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div className="dash-subheader-left" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="live-dot" />
            <span style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>System Online</span>
          </div>
          <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }} />
          <span style={{ fontSize: "13px", color: "#4a5568", fontWeight: "500" }}>
            👨‍⚕️ Dr. {hospitalConfig.doctorName}
          </span>
          <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }} />
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            {mounted ? currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : ""}
          </span>
        </div>
        <div className="time-display" style={{ fontSize: "14px", fontWeight: "700", color: "#0f4c81", background: "#e8f0fe", padding: "6px 14px", borderRadius: "8px", letterSpacing: "1px" }}>
          🕐 {mounted ? currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="dash-root" style={{ padding: "24px 2rem", maxWidth: "1600px", margin: "0 auto" }}>

        {/* ── Overdue Banner ── */}
        {overdueList.length > 0 && !dismissOverdue && (
          <div className="overdue-banner" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "20px", animation: "pulse2 2s infinite", display: "block" }}>⚠️</span>
              <div>
                <div style={{ fontWeight: "700", color: "#92400e", fontSize: "13px", marginBottom: "8px" }}>
                  {overdueList.length} appointment{overdueList.length > 1 ? "s" : ""} overdue — still marked Confirmed
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {overdueList.map(a => (
                    <span key={a.id} style={{ background: "white", border: "1px solid #fcd34d", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: "600", color: "#92400e" }}>
                      {formatTime(a.time)} — {a.patient_name || a.patients?.name || "Unknown"}
                    </span>
                  ))}
                </div>
                <button onClick={() => router.push("/appointments")}
                  style={{ background: "#d97706", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                  Update Status →
                </button>
              </div>
            </div>
            <button onClick={() => setDismissOverdue(true)}
              style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
          {STAT_CARDS.map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 0.07}s`, ["--card-accent" as any]: s.color }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                  {s.icon}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: s.trendUp ? "#059669" : "#d97706", fontWeight: "700", background: s.trendUp ? "#d1fae5" : "#fef3c7", padding: "2px 7px", borderRadius: "5px" }}>
                    {s.trend}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <Sparkline data={sparkData.map(v => v + i * 2)} color={s.color} />
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "4px", fontWeight: "600" }}>{s.label}</div>
              <div style={{ fontSize: "36px", fontWeight: "800", color: s.color, lineHeight: 1, letterSpacing: "-1px" }}>
                {loading ? <div className="skeleton" style={{ height: "40px", width: "60px" }} /> : <AnimatedNumber value={s.value} />}
              </div>
              <div style={{ fontSize: "11px", color: "#b0bec5", marginTop: "4px" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="qa-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "New Appointment", icon: "📅", path: "/appointments", color: "#0f4c81", bg: "#e8f0fe", iconBg: "#dbeafe" },
            { label: "New Prescription", icon: "💊", path: "/prescriptions", color: "#059669", bg: "#ecfdf5", iconBg: "#d1fae5" },
            { label: "Create Invoice", icon: "🧾", path: "/billing", color: "#d97706", bg: "#fffbeb", iconBg: "#fef3c7" },
            { label: "View Reports", icon: "📊", path: "/reports", color: "#7c3aed", bg: "#f5f3ff", iconBg: "#ede9fe" },
          ].map(q => (
            <button key={q.label} className="quick-action" onClick={() => router.push(q.path)}
              style={{ background: q.bg, color: q.color, border: `1.5px solid transparent` }}>
              <div className="qa-icon" style={{ background: q.iconBg }}>
                {q.icon}
              </div>
              <span>{q.label}</span>
              <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: "14px" }}>→</span>
            </button>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Today's Schedule + Recent Patients (tabbed) */}
          <div className="section-card">
            <div className="section-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="section-title">
                  <div className="dot" />
                  {activeTab === "schedule" ? "Today's Schedule" : "Recent Patients"}
                </div>
                {activeTab === "schedule" && todaysList.length > 0 && (
                  <span className="badge" style={{ background: "#dbeafe", color: "#1e40af" }}>
                    {todaysList.length} appointments
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button className={`tab-btn ${activeTab === "schedule" ? "active" : "inactive"}`} onClick={() => setActiveTab("schedule")}>Schedule</button>
                <button className={`tab-btn ${activeTab === "patients" ? "active" : "inactive"}`} onClick={() => setActiveTab("patients")}>Patients</button>
                <div style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 4px" }} />
                <button onClick={() => loadDashboardData()} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "5px 10px", borderRadius: "7px", fontSize: "11px", cursor: "pointer", color: "#64748b", fontFamily: "'Outfit', sans-serif" }}>
                  ↻ Refresh
                </button>
                <button onClick={() => router.push(activeTab === "schedule" ? "/appointments" : "/patients")}
                  style={{ background: "none", border: "none", color: "#0f4c81", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "'Outfit', sans-serif" }}>
                  View All →
                </button>
              </div>
            </div>

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="appt-table-wrap" style={{ overflowX: "auto" }}>
                {todaysList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px", color: "#b0bec5" }}>
                    <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#94a3b8" }}>No appointments today</div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>Schedule is clear</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Time", "Patient", "Type", "Status", ""].map(h => (
                          <th key={h} style={{ padding: "10px 16px", fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", textAlign: "left", fontWeight: "700", borderBottom: "1px solid #f0f4f8" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {todaysList.map((a) => {
                        const st = STATUS_STYLES[a.status] || STATUS_STYLES["Confirmed"];
                        const [ah, am] = (a.time || "0:0").split(":").map(Number);
                        const isOverdue = a.status === "Confirmed" && (ah * 60 + am) < nowMinutes;
                        const isCurrent = a.status === "In Progress";
                        return (
                          <tr key={a.id} className="appt-row" style={{ background: isCurrent ? "#faf5ff" : isOverdue ? "#fffcf0" : "white" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: "700", fontSize: "13px", color: isOverdue ? "#d97706" : isCurrent ? "#7c3aed" : "#0f4c81" }}>
                                {formatTime(a.time)}
                              </div>
                              {isOverdue && (
                                <div style={{ fontSize: "9px", color: "#d97706", fontWeight: "700", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚠ Overdue</div>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div className="avatar" style={{ background: "#e8f0fe", color: "#1e40af", width: "28px", height: "28px", fontSize: "11px", borderRadius: "7px" }}>
                                  {(a.patients?.name || a.patient_name || "?").charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "13px" }}>
                                  {a.patients?.name || a.patient_name || "—"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>{a.visit_type || "Checkup"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="badge" style={{ background: st.bg, color: st.color }}>
                                <span className="badge-dot" style={{ background: st.dot }} />
                                {a.status || "Confirmed"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button onClick={() => router.push("/appointments")}
                                style={{ background: "none", border: "1px solid #e2e8f0", color: "#64748b", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === "patients" && (
              <div style={{ padding: "12px" }}>
                {filteredPatients.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#b0bec5" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔍</div>
                    <div style={{ fontSize: "13px" }}>{searchQuery ? "No patients match your search" : "No patients found"}</div>
                  </div>
                ) : (
                  <div className="patients-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {filteredPatients.map(p => {
                      const colors = ["#e8f0fe:#1e40af", "#d1fae5:#065f46", "#ede9fe:#6d28d9", "#fef3c7:#92400e"];
                      const [bg, fg] = colors[p.name?.charCodeAt(0) % 4].split(":");
                      return (
                        <div key={p.id} className="patient-chip">
                          <div className="avatar" style={{ background: bg, color: fg }}>
                            {p.name?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>
                              {p.type || "General"} · Age {p.age || "—"} · {p.blood_group || "—"}
                              {p.allergies && <span style={{ color: "#e53e3e", marginLeft: "4px", fontWeight: "600" }}>⚠</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column: Stats summary + recent Rx */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Today summary card */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-title"><div className="dot" style={{ background: "#059669" }} />Today's Summary</div>
              </div>
              <div style={{ padding: "16px" }}>
                {[
                  { label: "Completed", value: todaysList.filter(a => a.status === "Completed").length, color: "#059669", bg: "#d1fae5" },
                  { label: "In Progress", value: todaysList.filter(a => a.status === "In Progress").length, color: "#7c3aed", bg: "#ede9fe" },
                  { label: "Waiting", value: todaysList.filter(a => a.status === "Waiting").length, color: "#d97706", bg: "#fef3c7" },
                  { label: "Confirmed", value: todaysList.filter(a => a.status === "Confirmed").length, color: "#1e40af", bg: "#dbeafe" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", marginBottom: "6px", background: "#f8fafc", borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: s.bg, border: `2px solid ${s.color}` }} />
                      <span style={{ fontSize: "13px", color: "#4a5568", fontWeight: "500" }}>{s.label}</span>
                    </div>
                    <span style={{ fontWeight: "800", fontSize: "18px", color: s.color }}>{loading ? "—" : s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Prescriptions */}
            <div className="section-card" style={{ maxHeight: "340px", display: "flex", flexDirection: "column" }}>
              <div className="section-header">
                <div className="section-title"><div className="dot" style={{ background: "#7c3aed" }} />Recent Prescriptions</div>
                <button onClick={() => router.push("/prescriptions")} style={{ background: "none", border: "none", color: "#0f4c81", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "'Outfit', sans-serif" }}>View All →</button>
              </div>
              <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", flex: 1 }}>
                {recentPrescriptions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "#b0bec5", fontSize: "13px" }}>No prescriptions yet</div>
                ) : recentPrescriptions.map(p => (
                  <div key={p.id} className="rx-card">
                    <div style={{ fontWeight: "700", color: "#1e40af", fontSize: "12px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.medicine}>{p.medicine}</div>
                    <div style={{ fontSize: "11px", color: "#4a5568", marginBottom: "1px" }}>👤 {p.patients?.name || "—"}</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", display: "flex", gap: "6px" }}>
                      <span>{p.dosage ? p.dosage.split(" ").slice(0,3).join(" ") : "—"}</span>
                      {p.duration && <><span>·</span><span>{p.duration}</span></>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Info ── */}
        <div className="dash-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #e8edf2" }}>
          <div style={{ fontSize: "11px", color: "#b0bec5" }}>
            {hospitalConfig.dashboardTitle} · Clinic EMR v2.0
          </div>
          <div className="dash-footer-metrics" style={{ display: "flex", gap: "16px" }}>
            {[
              { label: "Total Records", value: stats.totalPatients },
              { label: "Today's Load", value: stats.todaysAppointments },
              { label: "Pending", value: stats.pendingBilling },
            ].map(m => (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f4c81" }}>{loading ? "—" : m.value}</div>
                <div style={{ fontSize: "10px", color: "#b0bec5", textTransform: "uppercase", letterSpacing: "0.8px" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Register Patient Modal ────────────────────────────────────────── */}
      {showAddPatient && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddPatient(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>👤</div>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#0f4c81", margin: 0 }}>Register New Patient</h2>
                  <p style={{ color: "#94a3b8", fontSize: "12px", margin: "2px 0 0" }}>Add to clinic records</p>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <input placeholder="Full Name *" style={inp} value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Date of Birth *</label>
                <input type="date" style={inp} value={newPatient.dob} onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })} />
                {previewAge !== null && (
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#0f4c81", background: "#e8f0fe", padding: "3px 10px", borderRadius: "20px", fontWeight: "700" }}>
                      Age: {previewAge} years
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input placeholder="Phone Number *" style={inp} value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                <select style={inp} value={newPatient.blood_group} onChange={e => setNewPatient({ ...newPatient, blood_group: e.target.value })}>
                  <option value="">Blood Group</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>

              <select style={inp} value={newPatient.type} onChange={e => setNewPatient({ ...newPatient, type: e.target.value })}>
                <option>General Patient</option>
                <option>Emergency</option>
                <option>Follow-up</option>
              </select>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Known Allergies</label>
                <input placeholder="e.g. Penicillin, Aspirin (leave blank if none)" style={inp} value={newPatient.allergies} onChange={e => setNewPatient({ ...newPatient, allergies: e.target.value })} />
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>⚠️ Shown as warning on prescriptions</div>
              </div>

              <textarea placeholder="Address (optional)" style={{ ...inp, minHeight: "70px", resize: "none" }} value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} />
            </div>

            <div style={{ padding: "0 28px 28px", display: "flex", gap: "10px" }}>
              <button onClick={() => setShowAddPatient(false)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "14px", color: "#4a5568", fontFamily: "'Outfit', sans-serif", fontWeight: "500", transition: "all 0.15s" }}>
                Cancel
              </button>
              <button onClick={handleRegisterPatient} disabled={isSaving}
                style={{ flex: 2, padding: "12px", borderRadius: "10px", background: isSaving ? "#93c5fd" : "linear-gradient(135deg, #0f4c81, #1a6bbf)", color: "white", border: "none", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "'Outfit', sans-serif", boxShadow: isSaving ? "none" : "0 4px 12px rgba(15,76,129,0.3)", transition: "all 0.15s" }}>
                {isSaving ? "⏳ Saving..." : "✓ Save Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
