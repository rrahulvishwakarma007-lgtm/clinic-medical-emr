import "./globals.css";
import { ReactNode } from "react";
import SidebarNav from "@/components/SidebarNav";
import hospitalConfig from "@/config/hospital";

export const metadata = {
  title: hospitalConfig.appName,
  description: `${hospitalConfig.name} EMR Dashboard`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-text">{hospitalConfig.name}</div>
              <div className="logo-sub">{hospitalConfig.tagline}</div>
            </div>
            <SidebarNav />
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
