"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNav() {

  const pathname = usePathname();

  const linkClass = (path: string) => {

    // Special handling for dashboard
    if (path === "/") {
      return pathname === "/" ? "active-link" : "";
    }

    return pathname.startsWith(path) ? "active-link" : "";
  };

  return (
    <nav>

      {/* MAIN */}
      <Link href="/" className={linkClass("/")}>
        🏠 Dashboard
      </Link>

      <Link href="/patients" className={linkClass("/patients")}>
        👥 Patients
      </Link>

      <Link href="/appointments" className={linkClass("/appointments")}>
        📅 Appointments
      </Link>

      <Link href="#" >
        💊 Prescriptions
      </Link>

      <Link href="#" >
        🧪 Lab Results
      </Link>

      {/* ADMIN SECTION */}
      <div className="sidebar-section">ADMINISTRATION</div>

      <Link href="#">
        🧾 Billing
      </Link>

      <Link href="#">
        📊 Reports
      </Link>

      <Link href="#">
        ⚙️ Settings
      </Link>

    </nav>
  );
}