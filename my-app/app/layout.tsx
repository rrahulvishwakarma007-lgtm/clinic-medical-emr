import "./globals.css";
import { ReactNode } from "react";
import SidebarNav from "@/components/SidebarNav";

export const metadata = {
  title: "MediCore Clinic Suite",
  description: "Clinic EMR Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          {/* LEFT SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-text">MediCore</div>
              <div className="logo-sub">Clinic Suite</div>
            </div>

            {/* ACTIVE SIDEBAR NAVIGATION */}
            <SidebarNav />
          </aside>

          {/* RIGHT MAIN CONTENT */}
          <main className="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}