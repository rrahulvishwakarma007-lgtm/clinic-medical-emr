import "./globals.css";
import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import hospitalConfig from "@/config/hospital";

export const metadata = {
  title: hospitalConfig.appName,
  description: `${hospitalConfig.name} EMR Dashboard`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}