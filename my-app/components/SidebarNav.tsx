"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import hospitalConfig from "@/config/hospital";

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard",     path: "/",             icon: "🏠" },
    { name: "Patients",      path: "/patients",     icon: "👥" },
    { name: "Appointments",  path: "/appointments", icon: "📅" },
    { name: "Prescriptions", path: "/prescriptions",icon: "💊" },
    { name: "Billing",       path: "/billing",      icon: "🧾" },
    { name: "Reports",       path: "/reports",      icon: "📊" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  function handleLogout() {
    localStorage.removeItem("clinic_user");
    window.location.href = "/login";
  }

  return (
    <nav style={{ padding: "12px 10px", display: "flex", flexDirection: "column", height: "100%", gap: "4px" }}>

      {/* Doctor card */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 10px", background: "rgba(255,255,255,0.07)", borderRadius: "10px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #3182ce, #63b3ed)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "15px", flexShrink: 0 }}>
          {hospitalConfig.doctorName.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#f0f4f8" }}>{hospitalConfig.doctorName}</div>
          <div style={{ fontSize: "10px", color: "#718096", marginTop: "1px" }}>{hospitalConfig.doctorDegree}</div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ fontSize: "10px", fontWeight: "700", color: "#4a5568", textTransform: "uppercase", letterSpacing: "1.5px", padding: "0 10px", marginBottom: "6px" }}>
        Main Menu
      </div>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                textDecoration: "none",
                borderRadius: "9px",
                fontWeight: active ? "600" : "500",
                fontSize: "14px",
                color: active ? "#ffffff" : "#a0aec0",
                background: active ? "linear-gradient(135deg, #2b6cb0, #3182ce)" : "transparent",
                boxShadow: active ? "0 2px 8px rgba(49,130,206,0.35)" : "none",
                transition: "all 0.15s",
                borderLeft: active ? "3px solid #63b3ed" : "3px solid transparent",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#a0aec0";
                }
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
              <span>{item.name}</span>
              {active && <span style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#63b3ed" }} />}
            </Link>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          padding: "10px 12px",
          background: "transparent",
          color: "#fc8181",
          border: "1px solid rgba(252,129,129,0.15)",
          borderRadius: "9px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.15s",
          fontFamily: "inherit",
          textAlign: "left",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "rgba(254,178,178,0.1)";
          (e.currentTarget as HTMLElement).style.color = "#feb2b2";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#fc8181";
        }}
      >
        <span style={{ fontSize: "16px" }}>🚪</span>
        <span>Sign Out</span>
      </button>
    </nav>
  );
}