"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/", icon: "🏠" },
    { name: "Patients", path: "/patients", icon: "👥" },
    { name: "Appointments", path: "/appointments", icon: "📅" },
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
        .sidebar-nav { padding: 1rem; }
        .nav-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-link { 
          display: flex; 
          align-items: center; 
          gap: 0.75rem; 
          padding: 0.75rem 1rem; 
          text-decoration: none; 
          color: #4a5568; 
          border-radius: 10px; 
          font-weight: 500; 
          transition: all 0.2s;
        }
        .nav-link:hover { background: #f7fafc; color: #3182ce; }
        .nav-link.active { background: #ebf8ff; color: #3182ce; font-weight: 600; }
        .nav-icon { font-size: 1.1rem; }
        .nav-text { font-size: 0.95rem; }
      `}</style>
    </nav>
  );
}