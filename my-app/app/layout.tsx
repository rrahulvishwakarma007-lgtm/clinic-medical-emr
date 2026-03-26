import "./globals.css";
import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import hospitalConfig from "@/config/hospital";
import { Noto_Sans_Devanagari } from "next/font/google";

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: hospitalConfig.appName,
  description: `${hospitalConfig.name} EMR Dashboard`,
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#0d1b2e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={notoDevanagari.className}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}