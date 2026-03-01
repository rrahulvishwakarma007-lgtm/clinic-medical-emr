"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import hospitalConfig from "@/config/hospital";

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/", icon: "🏠" },
    { name: "Patients", path: "/patients", icon: "👥" },
    { name: "Appointments", path: "/appointments", icon: "📅" },
    { name: "Prescriptions", path: "/prescriptions", icon: "💊" },
    { name: "Billing", path: "/billing", icon: "🧾" },
    { name: "Reports", path: "/reports", icon: "📊" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="sidebar-nav">
      {/* Doctor info at top of sidebar */}
      <div className="doctor-info">
        <div className="doctor-avatar">
          {hospitalConfig.doctorName.charAt(0)}
        </div>
        <div>
          <div className="doctor-name">{hospitalConfig.doctorName}</div>
          <div className="doctor-degree">{hospitalConfig.doctorDegree}</div>
        </div>
      </div>

      <div className="nav-group">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-link ${isActive(item.path) ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .sidebar-nav { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .doctor-info { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.08); border-radius: 10px; margin-bottom: 0.5rem; }
        .doctor-avatar { width: 34px; height: 34px; border-radius: 50%; background: #3182ce; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .doctor-name { font-size: 12px; font-weight: 600; color: #e2e8f0; line-height: 1.3; }
        .doctor-degree { font-size: 10px; color: #a0aec0; }
        .nav-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; text-decoration: none; color: #4a5568; border-radius: 10px; font-weight: 500; transition: all 0.2s; }
        .nav-link:hover { background: #f7fafc; color: #3182ce; }
        .nav-link.active { background: #ebf8ff; color: #3182ce; font-weight: 600; }
        .nav-icon { font-size: 1.1rem; }
        .nav-text { font-size: 0.95rem; }
      `}</style>
    </nav>
  );
}
