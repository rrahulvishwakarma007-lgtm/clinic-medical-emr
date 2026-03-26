"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "../components/Dashboard";

export default function Page() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "dashboard" | "welcome">("loading");

  useEffect(() => {
    const user = localStorage.getItem("clinic_user");
    if (user) {
      setStatus("dashboard");
    } else {
      setStatus("welcome");
      router.replace("/welcome");
    }
  }, []);

  // Show dashboard directly — no redirect needed for APK
  if (status === "dashboard") {
    return <Dashboard />;
  }

  // Spinner while checking
  return (
    <div style={{ minHeight:"100vh", background:"#060d1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"40px", height:"40px", border:"3px solid #1e3a5f", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}