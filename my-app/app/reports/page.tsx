"use client";
import { useState, useEffect, useRef } from "react";
import hospitalConfig from "@/config/hospital";

type Tab = "overview" | "patients" | "billing" | "appointments" | "prescriptions" | "uploads";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [patients, setPatients] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ patient_name: "", category: "Lab Result", notes: "", file: null as File | null });
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [pRes, bRes, aRes, prRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/billing"),
        fetch("/api/appointments"),
        fetch("/api/prescriptions"),
      ]);
      const pData = await pRes.json();
      const bData = await bRes.json();
      const aData = await aRes.json();
      const prData = await prRes.json();
      setPatients(pData.success ? pData.data : Array.isArray(pData) ? pData : []);
      setBilling(Array.isArray(bData) ? bData : []);
      setAppointments(Array.isArray(aData) ? aData : []);
      setPrescriptions(Array.isArray(prData) ? prData : []);
      try {
        const upRes = await fetch("/api/reports");
        const upData = await upRes.json();
        setUploads(Array.isArray(upData) ? upData : []);
      } catch { setUploads([]); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const totalRevenue = billing.filter(b => b.status === "Paid").reduce((s, b) => s + Number(b.amount), 0);
  const pendingRevenue = billing.filter(b => b.status === "Pending").reduce((s, b) => s + Number(b.amount), 0);
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.date === today);
  const bloodGroups = patients.reduce((acc: any, p) => { if (p.blood_group) acc[p.blood_group] = (acc[p.blood_group] || 0) + 1; return acc; }, {});
  const serviceRevenue = billing.reduce((acc: any, b) => { acc[b.service_name] = (acc[b.service_name] || 0) + Number(b.amount); return acc; }, {});
  const topMedicines = prescriptions.reduce((acc: any, p) => { acc[p.medicine] = (acc[p.medicine] || 0) + 1; return acc; }, {});

  function filterByDate<T extends { created_at?: string; date?: string; invoice_date?: string }>(arr: T[]) {
    if (!dateFrom && !dateTo) return arr;
    return arr.filter(item => {
      const d = item.created_at || item.date || item.invoice_date || "";
      const itemDate = d.split("T")[0];
      if (dateFrom && itemDate < dateFrom) return false;
      if (dateTo && itemDate > dateTo) return false;
      return true;
    });
  }

  function printReport(title: string, tableHtml: string, summaryHtml = "") {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>${title}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap"/>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'DM Sans',sans-serif;padding:40px;color:#1a1a2e;font-size:13px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f4c81;padding-bottom:16px;margin-bottom:24px}
      .hospital{font-family:'DM Serif Display',serif;font-size:22px;color:#0f4c81}
      .sub{font-size:11px;color:#888;margin-top:4px;line-height:1.7}
      .report-title{font-size:20px;font-weight:600;color:#1a1a2e;margin-bottom:16px}
      .summary{display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap}
      .stat{background:#f0f4f8;padding:12px 18px;border-radius:8px;min-width:120px}
      .stat-val{font-size:22px;font-weight:700;color:#0f4c81}
      .stat-label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
      table{width:100%;border-collapse:collapse}
      th{background:#0f4c81;color:white;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}
      td{padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px}
      tr:nth-child(even) td{background:#f8fbff}
      .footer{margin-top:40px;border-top:1px solid #eee;padding-top:12px;font-size:10px;color:#aaa;text-align:center}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="header">
      <div><div class="hospital">${hospitalConfig.name}</div>
      <div class="sub">${hospitalConfig.address}, ${hospitalConfig.city}<br/>${hospitalConfig.phone} | ${hospitalConfig.email}</div></div>
      <div style="text-align:right;font-size:12px;color:#888">
        <div style="font-weight:600;color:#1a1a2e">${hospitalConfig.doctorName}</div>
        <div>${hospitalConfig.doctorDegree}</div>
        <div>Generated: ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</div>
      </div>
    </div>
    <div class="report-title">${title}</div>
    ${summaryHtml}${tableHtml}
    <div class="footer">${hospitalConfig.appName} &bull; Confidential Medical Record &bull; ${hospitalConfig.name}</div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
    w.document.close();
  }

  function printPatients() {
    const rows = filterByDate(patients).map(p => `<tr><td>${p.name}</td><td>${p.age||"—"}</td><td>${p.blood_group||"—"}</td><td>${p.phone||"—"}</td><td>${p.type||"General"}</td><td>${(p.created_at||p.date||"").split("T")[0]}</td></tr>`).join("");
    printReport("Patient Register", `<table><thead><tr><th>Name</th><th>Age</th><th>Blood Group</th><th>Phone</th><th>Type</th><th>Registered</th></tr></thead><tbody>${rows}</tbody></table>`,
      `<div class="summary"><div class="stat"><div class="stat-val">${patients.length}</div><div class="stat-label">Total Patients</div></div></div>`);
  }
  function printBilling() {
    const rows = filterByDate(billing).map(b => `<tr><td>${b.patient_name}</td><td>${b.service_name}</td><td>Rs.${Number(b.amount).toLocaleString("en-IN")}</td><td>${b.invoice_date}</td><td>${b.status}</td></tr>`).join("");
    printReport("Billing & Revenue Report", `<table><thead><tr><th>Patient</th><th>Service</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`,
      `<div class="summary"><div class="stat"><div class="stat-val">${billing.length}</div><div class="stat-label">Total Invoices</div></div><div class="stat"><div class="stat-val">Rs.${totalRevenue.toLocaleString("en-IN")}</div><div class="stat-label">Collected</div></div><div class="stat"><div class="stat-val">Rs.${pendingRevenue.toLocaleString("en-IN")}</div><div class="stat-label">Pending</div></div></div>`);
  }
  function printAppointments() {
    const rows = filterByDate(appointments).map(a => `<tr><td>${a.patients?.name||a.patient_name||"—"}</td><td>${a.date}</td><td>${a.time||"—"}</td><td>${a.type||"—"}</td><td>${a.status||"—"}</td></tr>`).join("");
    printReport("Appointments Report", `<table><thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`,
      `<div class="summary"><div class="stat"><div class="stat-val">${appointments.length}</div><div class="stat-label">Total</div></div><div class="stat"><div class="stat-val">${todayAppts.length}</div><div class="stat-label">Today</div></div></div>`);
  }
  function printPrescriptions() {
    const rows = filterByDate(prescriptions).map(p => `<tr><td>${p.patients?.name||"—"}</td><td>${p.medicine}</td><td>${p.dosage||"—"}</td><td>${p.duration||"—"}</td><td>${(p.created_at||"").split("T")[0]}</td></tr>`).join("");
    printReport("Prescription Report", `<table><thead><tr><th>Patient</th><th>Medicine</th><th>Dosage</th><th>Duration</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`,
      `<div class="summary"><div class="stat"><div class="stat-val">${prescriptions.length}</div><div class="stat-label">Total Rx</div></div></div>`);
  }

  async function handleUpload() {
    if (!uploadForm.file || !uploadForm.patient_name) return alert("Please select a file and enter patient name.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadForm.file);
      fd.append("category", uploadForm.category);
      fd.append("patient_name", uploadForm.patient_name);
      fd.append("notes", uploadForm.notes);
      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUploadForm({ patient_name: "", category: "Lab Result", notes: "", file: null });
      if (fileRef.current) fileRef.current.value = "";
      loadAll();
    } catch (err: any) { alert("Upload failed: " + err.message); }
    finally { setUploading(false); }
  }

  async function handleDownload(report: any) {
    try {
      const res = await fetch("/api/reports/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: report.path }) });
      const data = await res.json();
      if (data.url) { const a = document.createElement("a"); a.href = data.url; a.download = report.name; a.target = "_blank"; a.click(); }
    } catch { alert("Download failed"); }
  }

  async function handleDeleteUpload(report: any) {
    if (!confirm(`Delete "${report.name}"?`)) return;
    await fetch("/api/reports", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: report.id, path: report.path }) });
    loadAll();
  }

  function formatSize(b: number) {
    if (!b) return "—";
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    return (b / (1024 * 1024)).toFixed(1) + " MB";
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "patients", label: "Patients", icon: "👥" },
    { id: "billing", label: "Billing", icon: "🧾" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "prescriptions", label: "Prescriptions", icon: "💊" },
    { id: "uploads", label: "External Files", icon: "📁" },
  ];

  const inputStyle: any = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div className="rpt-page" style={{ padding: "2rem", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif", maxWidth: "100%", boxSizing: "border-box" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" />
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        .tab-btn{border:none;cursor:pointer;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;transition:all 0.15s;display:flex;align-items:center;gap:6px;font-family:inherit;white-space:nowrap;flex-shrink:0}
        .tab-btn.active{background:#0f4c81;color:white}
        .tab-btn:not(.active){background:white;color:#555}
        .tab-btn:not(.active):hover{background:#e8f1fb;color:#0f4c81}
        .print-btn{background:#0f4c81;color:white;border:none;padding:9px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;transition:all 0.15s;font-family:inherit;white-space:nowrap}
        .print-btn:hover{background:#0a3d6b}
        .stat-card{background:white;border-radius:14px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}

        /* ── Data table scroll wrapper ── */
        .rpt-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%}
        .data-table{width:100%;border-collapse:collapse;min-width:600px}
        .data-table th{background:#0f4c81;color:white;padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;white-space:nowrap}
        .data-table td{padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#444;white-space:nowrap}
        .data-table tr:nth-child(even) td{background:#fafbfc}
        .data-table tr:hover td{background:#f0f7ff}
        /* Override globals.css hide rules */
        .rpt-table-wrap .data-table th,
        .rpt-table-wrap .data-table td{display:table-cell!important;max-width:unset!important;overflow:visible!important;text-overflow:unset!important}
        .rpt-table-wrap .data-table th:last-child,
        .rpt-table-wrap .data-table td:last-child{display:table-cell!important}
        .rpt-table-wrap .data-table th:nth-child(4),
        .rpt-table-wrap .data-table td:nth-child(4){display:table-cell!important}

        .drop-zone{border:2px dashed #cbd5e0;border-radius:12px;padding:28px;text-align:center;cursor:pointer;transition:all 0.2s}
        .drop-zone.over{border-color:#0f4c81;background:#ebf8ff}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        .bar{height:8px;border-radius:4px;background:#0f4c81;transition:width 0.6s ease}

        /* ── MOBILE ── */
        @media(max-width:768px){
          /* Page padding */
          .rpt-page{padding:1rem!important}

          /* Header — stack */
          .rpt-header{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .rpt-header>div:last-child{flex-direction:column!important;align-items:stretch!important;width:100%!important}
          .rpt-header input,.rpt-header button{width:100%!important}

          /* Tabs — horizontal scroll */
          .rpt-tabs{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;flex-wrap:nowrap!important;padding-bottom:4px!important}

          /* Section header — stack */
          .rpt-section-head{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .rpt-section-head .print-btn{width:100%!important;justify-content:center!important}

          /* Overview grid — 2 col */
          .rpt-overview-kpi{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}
          .rpt-overview-charts{grid-template-columns:1fr!important}

          /* Billing stats grid — single col */
          .rpt-billing-stats{grid-template-columns:1fr!important;gap:10px!important}

          /* Uploads grid — stack */
          .rpt-uploads-grid{grid-template-columns:1fr!important}

          /* Table cells compact on mobile */
          .rpt-table-wrap .data-table th,
          .rpt-table-wrap .data-table td{padding:9px 10px!important;font-size:11px!important}
        }

        /* ── DESKTOP ── */
        @media(min-width:1024px){
          .rpt-page{padding:2.5rem 3rem!important}
          .rpt-overview-kpi{grid-template-columns:repeat(3,1fr)!important}
        }
      `}</style>

      {/* Header */}
      <div className="rpt-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"26px", color:"#0f4c81", margin:0 }}>Reports & Analytics</h1>
          <p style={{ color:"#888", fontSize:"14px", marginTop:"4px" }}>{hospitalConfig.name} &bull; Auto-generated from live data</p>
        </div>
        <div style={{ display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:"12px", color:"#888" }}>From</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ padding:"8px 12px", borderRadius:"8px", border:"1.5px solid #e2e8f0", fontSize:"13px" }} />
          <span style={{ fontSize:"12px", color:"#888" }}>To</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ padding:"8px 12px", borderRadius:"8px", border:"1.5px solid #e2e8f0", fontSize:"13px" }} />
          {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom("");setDateTo("");}} style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid #ddd", background:"white", cursor:"pointer", fontSize:"12px", color:"#888" }}>Clear</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="rpt-tabs" style={{ display:"flex", gap:"8px", marginBottom:"24px", flexWrap:"wrap" }}>
        {TABS.map(t=>(
          <button key={t.id} className={`tab-btn ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:"center", padding:"80px", color:"#aaa" }}>Loading reports...</div> : (
        <>
          {/* OVERVIEW */}
          {activeTab==="overview" && (
            <div>
              <div className="rpt-overview-kpi" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"16px", marginBottom:"24px" }}>
                {[
                  { label:"Total Patients", value:patients.length, color:"#0f4c81", icon:"👥" },
                  { label:"Total Invoices", value:billing.length, color:"#1a1a2e", icon:"🧾" },
                  { label:"Revenue Collected", value:`Rs.${totalRevenue.toLocaleString("en-IN")}`, color:"#065f46", icon:"💰" },
                  { label:"Pending Amount", value:`Rs.${pendingRevenue.toLocaleString("en-IN")}`, color:"#92400e", icon:"⏳" },
                  { label:"Total Appointments", value:appointments.length, color:"#6d28d9", icon:"📅" },
                  { label:"Prescriptions Issued", value:prescriptions.length, color:"#0369a1", icon:"💊" },
                ].map(s=>(
                  <div key={s.label} className="stat-card">
                    <div style={{ fontSize:"22px", marginBottom:"8px" }}>{s.icon}</div>
                    <div style={{ fontSize:"11px", color:"#999", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"6px" }}>{s.label}</div>
                    <div style={{ fontSize:"24px", fontWeight:"700", color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="rpt-overview-charts" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                <div className="stat-card">
                  <div style={{ fontWeight:"700", color:"#1a1a2e", marginBottom:"16px", fontSize:"15px" }}>Blood Group Distribution</div>
                  {Object.entries(bloodGroups).length===0 ? <p style={{ color:"#bbb", fontSize:"13px" }}>No data yet</p> :
                    Object.entries(bloodGroups).map(([bg,count]:any)=>(
                      <div key={bg} style={{ marginBottom:"12px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", marginBottom:"4px" }}>
                          <span style={{ fontWeight:"600" }}>{bg}</span><span style={{ color:"#888" }}>{count} patients</span>
                        </div>
                        <div style={{ background:"#f0f4f8", borderRadius:"4px", height:"8px" }}>
                          <div className="bar" style={{ width:`${Math.round((count/patients.length)*100)}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
                <div className="stat-card">
                  <div style={{ fontWeight:"700", color:"#1a1a2e", marginBottom:"16px", fontSize:"15px" }}>Top Prescribed Medicines</div>
                  {Object.entries(topMedicines).length===0 ? <p style={{ color:"#bbb", fontSize:"13px" }}>No data yet</p> :
                    Object.entries(topMedicines).sort((a:any,b:any)=>b[1]-a[1]).slice(0,6).map(([med,count]:any)=>(
                      <div key={med} style={{ marginBottom:"12px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", marginBottom:"4px" }}>
                          <span style={{ fontWeight:"500" }}>{med}</span><span style={{ color:"#888" }}>{count}x prescribed</span>
                        </div>
                        <div style={{ background:"#f0f4f8", borderRadius:"4px", height:"8px" }}>
                          <div className="bar" style={{ width:`${Math.round((count/prescriptions.length)*100)}%`, background:"#6d28d9" }} />
                        </div>
                      </div>
                    ))}
                </div>
                <div className="stat-card" style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontWeight:"700", color:"#1a1a2e", marginBottom:"16px", fontSize:"15px" }}>Revenue by Service</div>
                  {Object.entries(serviceRevenue).length===0 ? <p style={{ color:"#bbb", fontSize:"13px" }}>No billing data yet</p> : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"12px" }}>
                      {Object.entries(serviceRevenue).sort((a:any,b:any)=>b[1]-a[1]).map(([svc,amt]:any)=>(
                        <div key={svc} style={{ background:"#f8fbff", padding:"14px", borderRadius:"10px", borderLeft:"3px solid #0f4c81" }}>
                          <div style={{ fontSize:"12px", color:"#888", marginBottom:"4px" }}>{svc}</div>
                          <div style={{ fontSize:"18px", fontWeight:"700", color:"#0f4c81" }}>Rs.{Number(amt).toLocaleString("en-IN")}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PATIENTS */}
          {activeTab==="patients" && (
            <div>
              <div className="rpt-section-head" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <div style={{ fontWeight:"700", color:"#1a1a2e", fontSize:"16px" }}>Patient Register <span style={{ color:"#888", fontWeight:"400", fontSize:"13px" }}>({filterByDate(patients).length} records)</span></div>
                <button className="print-btn" onClick={printPatients}>🖨 Print Report</button>
              </div>
              <div style={{ background:"white", borderRadius:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="rpt-table-wrap">
                <table className="data-table">
                  <thead><tr><th>#</th><th>Patient Name</th><th>Age</th><th>Blood Group</th><th>Phone</th><th>Type</th><th>Address</th><th>Registered</th></tr></thead>
                  <tbody>
                    {filterByDate(patients).length===0 ? <tr><td colSpan={8} style={{ textAlign:"center", padding:"40px", color:"#bbb" }}>No patients found</td></tr>
                      : filterByDate(patients).map((p,i)=>(
                        <tr key={p.id}>
                          <td style={{ color:"#aaa" }}>{i+1}</td>
                          <td style={{ fontWeight:"600", color:"#1a1a2e" }}>{p.name}</td>
                          <td>{p.age||"—"}</td>
                          <td><span style={{ background:"#dbeafe", color:"#1e40af", padding:"2px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:"600" }}>{p.blood_group||"—"}</span></td>
                          <td>{p.phone||"—"}</td><td>{p.type||"General"}</td>
                          <td style={{ color:"#888", maxWidth:"160px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.address||"—"}</td>
                          <td style={{ color:"#888" }}>{(p.created_at||p.date||"").split("T")[0]}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* BILLING */}
          {activeTab==="billing" && (
            <div>
              <div className="rpt-billing-stats" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"20px" }}>
                <div className="stat-card"><div style={{ fontSize:"11px", color:"#999", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"6px" }}>Total Invoices</div><div style={{ fontSize:"26px", fontWeight:"700", color:"#1a1a2e" }}>{billing.length}</div></div>
                <div className="stat-card"><div style={{ fontSize:"11px", color:"#999", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"6px" }}>Revenue Collected</div><div style={{ fontSize:"26px", fontWeight:"700", color:"#065f46" }}>Rs.{totalRevenue.toLocaleString("en-IN")}</div></div>
                <div className="stat-card"><div style={{ fontSize:"11px", color:"#999", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"6px" }}>Pending</div><div style={{ fontSize:"26px", fontWeight:"700", color:"#92400e" }}>Rs.{pendingRevenue.toLocaleString("en-IN")}</div></div>
              </div>
              <div className="rpt-section-head" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <div style={{ fontWeight:"700", color:"#1a1a2e", fontSize:"16px" }}>Billing Report <span style={{ color:"#888", fontWeight:"400", fontSize:"13px" }}>({filterByDate(billing).length} invoices)</span></div>
                <button className="print-btn" onClick={printBilling}>🖨 Print Report</button>
              </div>
              <div style={{ background:"white", borderRadius:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="rpt-table-wrap">
                <table className="data-table">
                  <thead><tr><th>#</th><th>Patient</th><th>Service</th><th>Amount</th><th>GST 18%</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {filterByDate(billing).length===0 ? <tr><td colSpan={8} style={{ textAlign:"center", padding:"40px", color:"#bbb" }}>No billing records</td></tr>
                      : filterByDate(billing).map((b,i)=>(
                        <tr key={b.id}>
                          <td style={{ color:"#aaa" }}>{i+1}</td>
                          <td style={{ fontWeight:"600", color:"#1a1a2e" }}>{b.patient_name}</td>
                          <td>{b.service_name}</td>
                          <td>Rs.{Number(b.amount).toLocaleString("en-IN")}</td>
                          <td style={{ color:"#888" }}>Rs.{(b.amount*0.18).toFixed(2)}</td>
                          <td style={{ fontWeight:"600", color:"#0f4c81" }}>Rs.{(b.amount*1.18).toFixed(2)}</td>
                          <td style={{ color:"#888" }}>{b.invoice_date}</td>
                          <td><span style={{ padding:"3px 10px", borderRadius:"12px", fontSize:"11px", fontWeight:"700", background:b.status==="Paid"?"#d1fae5":"#fef3c7", color:b.status==="Paid"?"#065f46":"#92400e" }}>{b.status}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS */}
          {activeTab==="appointments" && (
            <div>
              <div className="rpt-section-head" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <div style={{ fontWeight:"700", color:"#1a1a2e", fontSize:"16px" }}>Appointments <span style={{ color:"#888", fontWeight:"400", fontSize:"13px" }}>({filterByDate(appointments).length} records)</span></div>
                <button className="print-btn" onClick={printAppointments}>🖨 Print Report</button>
              </div>
              <div style={{ background:"white", borderRadius:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="rpt-table-wrap">
                <table className="data-table">
                  <thead><tr><th>#</th><th>Patient</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {filterByDate(appointments).length===0 ? <tr><td colSpan={6} style={{ textAlign:"center", padding:"40px", color:"#bbb" }}>No appointments found</td></tr>
                      : filterByDate(appointments).map((a,i)=>(
                        <tr key={a.id}>
                          <td style={{ color:"#aaa" }}>{i+1}</td>
                          <td style={{ fontWeight:"600", color:"#1a1a2e" }}>{a.patients?.name||a.patient_name||"—"}</td>
                          <td>{a.date}</td><td>{a.time||"—"}</td><td>{a.type||"—"}</td>
                          <td><span style={{ padding:"3px 10px", borderRadius:"12px", fontSize:"11px", fontWeight:"700", background:"#d1fae5", color:"#065f46" }}>{a.status||"Confirmed"}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* PRESCRIPTIONS */}
          {activeTab==="prescriptions" && (
            <div>
              <div className="rpt-section-head" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <div style={{ fontWeight:"700", color:"#1a1a2e", fontSize:"16px" }}>Prescriptions <span style={{ color:"#888", fontWeight:"400", fontSize:"13px" }}>({filterByDate(prescriptions).length} records)</span></div>
                <button className="print-btn" onClick={printPrescriptions}>🖨 Print Report</button>
              </div>
              <div style={{ background:"white", borderRadius:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="rpt-table-wrap">
                <table className="data-table">
                  <thead><tr><th>#</th><th>Patient</th><th>Medicine</th><th>Dosage</th><th>Duration</th><th>Notes</th><th>Date</th></tr></thead>
                  <tbody>
                    {filterByDate(prescriptions).length===0 ? <tr><td colSpan={7} style={{ textAlign:"center", padding:"40px", color:"#bbb" }}>No prescriptions found</td></tr>
                      : filterByDate(prescriptions).map((p,i)=>(
                        <tr key={p.id}>
                          <td style={{ color:"#aaa" }}>{i+1}</td>
                          <td style={{ fontWeight:"600", color:"#1a1a2e" }}>{p.patients?.name||"—"}</td>
                          <td><span style={{ background:"#ebf8ff", color:"#1e40af", padding:"2px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:"600" }}>{p.medicine}</span></td>
                          <td>{p.dosage||"—"}</td><td>{p.duration||"—"}</td>
                          <td style={{ color:"#888", maxWidth:"160px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.notes||"—"}</td>
                          <td style={{ color:"#888" }}>{(p.created_at||"").split("T")[0]}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* UPLOADS */}
          {activeTab==="uploads" && (
            <div className="rpt-uploads-grid" style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:"20px", alignItems:"start" }}>
              <div style={{ background:"white", borderRadius:"14px", padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight:"700", color:"#1a1a2e", fontSize:"15px", marginBottom:"4px" }}>Upload External File</div>
                <div style={{ fontSize:"12px", color:"#999", marginBottom:"18px" }}>Lab results, X-rays, scanned documents</div>
                <div className={`drop-zone${dragOver?" over":""}`}
                  onClick={()=>fileRef.current?.click()}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)setUploadForm(p=>({...p,file:f}));}}>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style={{ display:"none" }}
                    onChange={e=>{const f=e.target.files?.[0];if(f)setUploadForm(p=>({...p,file:f}));}} />
                  {uploadForm.file ? (
                    <div><div style={{ fontSize:"24px", marginBottom:"4px" }}>📎</div>
                      <div style={{ fontWeight:"600", fontSize:"13px", color:"#1a1a2e" }}>{uploadForm.file.name}</div>
                      <div style={{ color:"#aaa", fontSize:"11px", marginTop:"2px" }}>{formatSize(uploadForm.file.size)}</div>
                    </div>
                  ) : (
                    <div><div style={{ fontSize:"28px", marginBottom:"6px" }}>☁️</div>
                      <div style={{ fontWeight:"600", color:"#555", fontSize:"13px" }}>Drag & drop or click to browse</div>
                      <div style={{ color:"#aaa", fontSize:"11px", marginTop:"2px" }}>PDF, Images, Word, Excel</div>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop:"14px" }}>
                  <input placeholder="Patient Name *" value={uploadForm.patient_name} onChange={e=>setUploadForm(p=>({...p,patient_name:e.target.value}))} style={inputStyle} />
                  <select value={uploadForm.category} onChange={e=>setUploadForm(p=>({...p,category:e.target.value}))} style={inputStyle}>
                    {["Lab Result","X-Ray","MRI/CT Scan","ECG","Ultrasound","Discharge Summary","Referral Letter","Other"].map(c=><option key={c}>{c}</option>)}
                  </select>
                  <textarea placeholder="Notes (optional)" value={uploadForm.notes} onChange={e=>setUploadForm(p=>({...p,notes:e.target.value}))} style={{ ...inputStyle, minHeight:"70px", resize:"none" }} />
                  <button onClick={handleUpload} disabled={uploading} style={{ padding:"11px", borderRadius:"8px", background:uploading?"#93c5fd":"#0f4c81", color:"white", border:"none", cursor:uploading?"not-allowed":"pointer", fontWeight:"600", fontSize:"14px", fontFamily:"inherit" }}>
                    {uploading?"Uploading...":"☁️ Upload File"}
                  </button>
                </div>
              </div>

              <div style={{ background:"white", borderRadius:"14px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #f0f0f0", fontWeight:"700", color:"#1a1a2e", fontSize:"15px" }}>
                  Uploaded Files <span style={{ color:"#888", fontWeight:"400", fontSize:"13px" }}>({uploads.length})</span>
                </div>
                {uploads.length===0 ? (
                  <div style={{ textAlign:"center", padding:"60px", color:"#bbb" }}>
                    <div style={{ fontSize:"40px", marginBottom:"12px" }}>📂</div>
                    <div>No external files uploaded yet</div>
                  </div>
                ) : (
                  <div className="rpt-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>File Name</th><th>Patient</th><th>Category</th><th>Size</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                      {uploads.map(u=>(
                        <tr key={u.id}>
                          <td style={{ fontWeight:"500", color:"#1a1a2e", maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</td>
                          <td>{u.patient_name||"—"}</td>
                          <td><span style={{ background:"#e0f2fe", color:"#075985", padding:"2px 10px", borderRadius:"12px", fontSize:"11px", fontWeight:"600" }}>{u.category}</span></td>
                          <td style={{ color:"#888" }}>{formatSize(u.size||0)}</td>
                          <td style={{ color:"#888" }}>{(u.created_at||"").split("T")[0]}</td>
                          <td>
                            <div style={{ display:"flex", gap:"6px", flexWrap:"nowrap" }}>
                              <button onClick={()=>handleDownload(u)} style={{ background:"#d1fae5", color:"#065f46", border:"none", padding:"5px 10px", borderRadius:"6px", cursor:"pointer", fontSize:"12px", fontWeight:"600", whiteSpace:"nowrap" }}>⬇ Download</button>
                              <button onClick={()=>handleDeleteUpload(u)} style={{ background:"#fee2e2", color:"#991b1b", border:"none", padding:"5px 10px", borderRadius:"6px", cursor:"pointer", fontSize:"12px", fontWeight:"600", whiteSpace:"nowrap" }}>✕ Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
