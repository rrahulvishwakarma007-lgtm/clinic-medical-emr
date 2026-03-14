"use client";
import { useEffect, useState, useMemo } from "react";
import hospitalConfig from "@/config/hospital";

// ─── Types ───────────────────────────────────────────
interface InvoiceService { name: string; amt: number; }
interface Invoice {
  id: string; patId: string; patName: string;
  services: InvoiceService[]; discount: number;
  paid: number; method: string; date: string;
  notes: string; status: "Paid" | "Partial" | "Pending";
}
type DateRange = "today" | "week" | "month" | "quarter" | "year" | "custom";

// ─── Helpers ─────────────────────────────────────────
function rupee(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function calcNet(inv: Invoice) {
  const sub = (inv.services || []).reduce((s, x) => s + (Number(x.amt) || 0), 0);
  return sub - (sub * (inv.discount || 0)) / 100;
}
function getDateRange(range: DateRange, customFrom: string, customTo: string): [string, string] {
  const today = todayStr();
  if (range === "today") return [today, today];
  if (range === "week") return [addDays(today, -6), today];
  if (range === "month") return [addDays(today, -29), today];
  if (range === "quarter") return [addDays(today, -89), today];
  if (range === "year") return [addDays(today, -364), today];
  return [customFrom, customTo];
}
function groupByDay(invoices: Invoice[], from: string, to: string) {
  const map: Record<string, { revenue: number; pending: number; count: number }> = {};
  let cur = from;
  while (cur <= to) {
    map[cur] = { revenue: 0, pending: 0, count: 0 };
    cur = addDays(cur, 1);
  }
  invoices.forEach(inv => {
    if (map[inv.date]) {
      map[inv.date].revenue += inv.paid || 0;
      map[inv.date].pending += Math.max(0, calcNet(inv) - (inv.paid || 0));
      map[inv.date].count++;
    }
  });
  return map;
}
function groupByWeek(invoices: Invoice[], from: string, to: string) {
  const map: Record<string, { revenue: number; pending: number; count: number; label: string }> = {};
  invoices.filter(i => i.date >= from && i.date <= to).forEach(inv => {
    const d = new Date(inv.date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().split("T")[0];
    if (!map[key]) map[key] = { revenue: 0, pending: 0, count: 0, label: `Wk ${monday.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` };
    map[key].revenue += inv.paid || 0;
    map[key].pending += Math.max(0, calcNet(inv) - (inv.paid || 0));
    map[key].count++;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}
function groupByMonth(invoices: Invoice[]) {
  const map: Record<string, { revenue: number; pending: number; count: number }> = {};
  invoices.forEach(inv => {
    const key = inv.date.slice(0, 7);
    if (!map[key]) map[key] = { revenue: 0, pending: 0, count: 0 };
    map[key].revenue += inv.paid || 0;
    map[key].pending += Math.max(0, calcNet(inv) - (inv.paid || 0));
    map[key].count++;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

// ─── Seed data for demo ───────────────────────────────
function generateSeedInvoices(): Invoice[] {
  const services = [
    [{ name: "Consultation Fee", amt: 500 }],
    [{ name: "Consultation Fee", amt: 500 }, { name: "CBC Test", amt: 300 }],
    [{ name: "Consultation Fee", amt: 800 }, { name: "ECG", amt: 400 }, { name: "Medicines", amt: 600 }],
    [{ name: "Consultation Fee", amt: 500 }, { name: "HbA1c Test", amt: 600 }, { name: "Medicines", amt: 350 }],
    [{ name: "Consultation Fee", amt: 600 }, { name: "X-Ray", amt: 700 }],
    [{ name: "Consultation Fee", amt: 500 }, { name: "USG Abdomen", amt: 1200 }],
    [{ name: "Consultation Fee", amt: 500 }, { name: "LFT", amt: 800 }, { name: "Medicines", amt: 450 }],
    [{ name: "Consultation Fee", amt: 800 }, { name: "Thyroid Profile", amt: 900 }],
    [{ name: "Consultation Fee", amt: 500 }, { name: "Urine R/M", amt: 200 }, { name: "Medicines", amt: 350 }],
    [{ name: "Consultation Fee", amt: 1000 }, { name: "Lipid Profile", amt: 700 }, { name: "HbA1c", amt: 600 }],
  ];
  const methods = ["Cash", "UPI / GPay", "Card", "Insurance", "Cash", "UPI / GPay", "Cash", "Cash", "UPI / GPay", "Card"];
  const patients = ["Rajesh Kumar", "Priya Sharma", "Arun Patel", "Sunita Singh", "Mohan Verma", "Kavita Joshi", "Dinesh Gupta", "Rekha Tiwari", "Suresh Yadav", "Meena Dubey"];
  const invoices: Invoice[] = [];
  const today = new Date();
  let inv_num = 1;
  for (let daysAgo = 364; daysAgo >= 0; daysAgo--) {
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    const count = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < count; i++) {
      const svcIdx = Math.floor(Math.random() * services.length);
      const svc = services[svcIdx];
      const sub = svc.reduce((s, x) => s + x.amt, 0);
      const discount = Math.random() < 0.15 ? 10 : 0;
      const net = sub - (sub * discount) / 100;
      const methodIdx = Math.floor(Math.random() * methods.length);
      const r = Math.random();
      const status: Invoice["status"] = r > 0.2 ? "Paid" : r > 0.1 ? "Partial" : "Pending";
      const paid = status === "Paid" ? net : status === "Partial" ? Math.round(net * 0.5) : 0;
      const patIdx = Math.floor(Math.random() * patients.length);
      invoices.push({
        id: `INV-${String(inv_num++).padStart(6, "0")}`,
        patId: `P-${String(patIdx + 1).padStart(3, "0")}`,
        patName: patients[patIdx],
        services: svc,
        discount,
        paid,
        method: methods[methodIdx],
        date: dateStr,
        notes: "",
        status,
      });
    }
  }
  return invoices;
}

// ─── Bar Chart Component (SVG, no external lib) ──────
function BarChart({ data, height = 180 }: {
  data: { label: string; revenue: number; pending: number }[];
  height?: number;
}) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.revenue + d.pending), 1);
  const W = 100;
  const barW = Math.max(4, Math.min(28, (W / data.length) * 0.65));
  const gap = W / data.length;
  const chartH = height - 28;

  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: "100%", height: `${height}px`, overflow: "visible" }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const x = gap * i + gap / 2;
        const revH = (d.revenue / maxVal) * chartH;
        const penH = (d.pending / maxVal) * chartH;
        return (
          <g key={i}>
            {/* pending stacked */}
            {penH > 0 && <rect x={x - barW / 2} y={chartH - revH - penH} width={barW} height={penH} fill="#fde68a" rx="1" />}
            {/* revenue */}
            {revH > 0 && <rect x={x - barW / 2} y={chartH - revH} width={barW} height={revH} fill="#0f4c81" rx="1" />}
            {/* label */}
            {data.length <= 14 && (
              <text x={x} y={height - 4} textAnchor="middle" fontSize="3.5" fill="#94a3b8">{d.label}</text>
            )}
          </g>
        );
      })}
      {/* baseline */}
      <line x1="0" y1={chartH} x2="100" y2={chartH} stroke="#e2e8f0" strokeWidth="0.3" />
    </svg>
  );
}

// ─── Donut Chart (SVG) ────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return <div style={{ textAlign: "center", color: "#bbb", padding: "20px", fontSize: "12px" }}>No data</div>;
  const r = 36; const cx = 50; const cy = 50; const stroke = 14;
  let cumAngle = -90;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const angle = pct * 360;
    const start = cumAngle;
    cumAngle += angle;
    return { ...seg, pct, startAngle: start, endAngle: cumAngle };
  });
  function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function describeArc(startAngle: number, endAngle: number) {
    const s = polarToXY(cx, cy, r, startAngle);
    const e = polarToXY(cx, cy, r, endAngle - 0.01);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", maxWidth: "140px" }}>
      {arcs.map((arc, i) => (
        <path key={i} d={describeArc(arc.startAngle, arc.endAngle)}
          fill="none" stroke={arc.color} strokeWidth={stroke} strokeLinecap="butt" />
      ))}
      <circle cx={cx} cy={cy} r={r - stroke / 2 - 1} fill="white" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f4c81">{Math.round(arcs[0]?.pct * 100)}%</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="4.5" fill="#94a3b8">Collected</text>
    </svg>
  );
}

// ─── Trend Arrow ─────────────────────────────────────
function Trend({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span style={{ fontSize: "11px", fontWeight: "700", color: up ? "#16a34a" : "#dc2626", background: up ? "#f0fdf4" : "#fef2f2", padding: "2px 7px", borderRadius: "10px" }}>
      {up ? "↑" : "↓"} {Math.abs(Math.round(pct))}%
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────
export default function RevenueDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [range, setRange] = useState<DateRange>("month");
  const [customFrom, setCustomFrom] = useState(addDays(todayStr(), -29));
  const [customTo, setCustomTo] = useState(todayStr());
  const [activeView, setActiveView] = useState<"overview" | "breakdown" | "transactions">("overview");
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [exportMsg, setExportMsg] = useState("");

  // Load invoices from localStorage (clinic app data) or generate seed data
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cliniccare_data");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.invoices?.length > 0) {
          setInvoices(parsed.invoices);
          return;
        }
      }
    } catch {}
    // Use seed data for demo
    setInvoices(generateSeedInvoices());
  }, []);

  const [from, to] = getDateRange(range, customFrom, customTo);

  // Filter invoices to selected range
  const rangeInvoices = useMemo(() =>
    invoices.filter(i => i.date >= from && i.date <= to),
    [invoices, from, to]
  );

  // Previous period for comparison
  const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1);
  const prevFrom = addDays(from, -Math.round(days));
  const prevTo = addDays(from, -1);
  const prevInvoices = useMemo(() =>
    invoices.filter(i => i.date >= prevFrom && i.date <= prevTo),
    [invoices, prevFrom, prevTo]
  );

  // KPIs
  const totalRevenue = rangeInvoices.reduce((s, i) => s + (i.paid || 0), 0);
  const totalBilled = rangeInvoices.reduce((s, i) => s + calcNet(i), 0);
  const totalPending = totalBilled - totalRevenue;
  const totalInvoices = rangeInvoices.length;
  const avgPerVisit = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
  const collectionRate = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 0;

  const prevRevenue = prevInvoices.reduce((s, i) => s + (i.paid || 0), 0);
  const prevInvoiceCount = prevInvoices.length;
  const revTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const visitTrend = prevInvoiceCount > 0 ? ((totalInvoices - prevInvoiceCount) / prevInvoiceCount) * 100 : 0;

  // Chart data
  const chartData = useMemo(() => {
    if (days <= 31) {
      const byDay = groupByDay(rangeInvoices, from, to);
      return Object.entries(byDay).map(([date, d]) => ({
        label: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).replace(" ", "\n"),
        revenue: d.revenue,
        pending: d.pending,
        count: d.count,
      }));
    } else if (days <= 92) {
      return groupByWeek(rangeInvoices, from, to).map(([, d]) => ({
        label: d.label, revenue: d.revenue, pending: d.pending, count: d.count,
      }));
    } else {
      return groupByMonth(rangeInvoices).map(([key, d]) => ({
        label: new Date(key + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        revenue: d.revenue, pending: d.pending, count: d.count,
      }));
    }
  }, [rangeInvoices, from, to, days]);

  // Service breakdown
  const serviceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    rangeInvoices.forEach(inv => {
      (inv.services || []).forEach(svc => {
        map[svc.name] = (map[svc.name] || 0) + svc.amt;
      });
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [rangeInvoices]);

  const maxSvcAmt = serviceBreakdown[0]?.[1] || 1;

  // Payment method breakdown
  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    rangeInvoices.filter(i => i.paid > 0).forEach(inv => {
      map[inv.method] = (map[inv.method] || 0) + inv.paid;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [rangeInvoices]);

  const methodColors: Record<string, string> = {
    "Cash": "#16a34a", "UPI / GPay": "#0f4c81", "Card": "#7c3aed",
    "Insurance": "#b45309", "Cheque": "#0891b2",
  };

  // Status counts
  const statusCounts = useMemo(() => ({
    Paid: rangeInvoices.filter(i => i.status === "Paid").length,
    Partial: rangeInvoices.filter(i => i.status === "Partial").length,
    Pending: rangeInvoices.filter(i => i.status === "Pending").length,
  }), [rangeInvoices]);

  // Top patients
  const topPatients = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; visits: number }> = {};
    rangeInvoices.forEach(inv => {
      if (!map[inv.patId]) map[inv.patId] = { name: inv.patName, revenue: 0, visits: 0 };
      map[inv.patId].revenue += inv.paid || 0;
      map[inv.patId].visits++;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [rangeInvoices]);

  // Transactions filtered
  const transactions = useMemo(() => {
    return rangeInvoices
      .filter(i => (methodFilter === "All" || i.method === methodFilter) && (statusFilter === "All" || i.status === statusFilter))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [rangeInvoices, methodFilter, statusFilter]);

  // Export CSV
  function exportCSV() {
    const rows = [["Invoice ID", "Date", "Patient", "Services", "Gross", "Discount%", "Net", "Paid", "Balance", "Method", "Status"]];
    rangeInvoices.forEach(inv => {
      const net = calcNet(inv);
      rows.push([
        inv.id, inv.date, inv.patName,
        (inv.services || []).map(s => s.name).join("; "),
        String((inv.services || []).reduce((s, x) => s + x.amt, 0)),
        String(inv.discount || 0),
        String(Math.round(net)),
        String(inv.paid || 0),
        String(Math.round(net - (inv.paid || 0))),
        inv.method, inv.status,
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `revenue_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExportMsg("Exported!");
    setTimeout(() => setExportMsg(""), 2000);
  }

  const inputStyle = { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", background: "white", fontFamily: "inherit" };
  const RANGE_LABELS: Record<DateRange, string> = { today: "Today", week: "Last 7 days", month: "Last 30 days", quarter: "Last 90 days", year: "Last 365 days", custom: "Custom" };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" />
      <style>{`
        .stat-card{background:white;border-radius:14px;padding:20px 22px;box-shadow:0 1px 4px rgba(0,0,0,0.06);transition:transform 0.15s}
        .stat-card:hover{transform:translateY(-2px)}
        .hover-row:hover td{background:#f0f7ff!important}
        .tab-btn{border:none;cursor:pointer;padding:9px 20px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;transition:all 0.15s}
        .range-btn{border:1.5px solid #e2e8f0;background:white;cursor:pointer;padding:6px 14px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:600;transition:all 0.15s;color:#555}
        .range-btn:hover{border-color:#0f4c81;color:#0f4c81}
        .range-btn.active{background:#0f4c81;color:white;border-color:#0f4c81}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn 0.25s ease}
      `}</style>

      {/* ── Page Header ───────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "28px", color: "#0f4c81", margin: 0 }}>Revenue Dashboard</h1>
          <p style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>
            {hospitalConfig.name} · {from} → {to} · {rangeInvoices.length} invoices
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={exportCSV} style={{ ...inputStyle, cursor: "pointer", background: "#f0fdf4", color: "#15803d", border: "1.5px solid #bbf7d0", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
            📥 {exportMsg || "Export CSV"}
          </button>
        </div>
      </div>

      {/* ── Date Range Selector ────────────────────── */}
      <div style={{ background: "white", borderRadius: "12px", padding: "14px 18px", marginBottom: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginRight: "4px" }}>Range:</span>
        {(["today", "week", "month", "quarter", "year", "custom"] as DateRange[]).map(r => (
          <button key={r} className={`range-btn${range === r ? " active" : ""}`} onClick={() => setRange(r)}>
            {RANGE_LABELS[r]}
          </button>
        ))}
        {range === "custom" && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: "#bbb" }}>→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inputStyle} />
          </>
        )}
      </div>

      {/* ── KPI Cards ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        {[
          {
            label: "Total Collected", value: rupee(totalRevenue), sub: <Trend pct={revTrend} />,
            icon: "💰", color: "#0f4c81", bg: "#eff6ff",
          },
          {
            label: "Total Billed", value: rupee(totalBilled), sub: <span style={{ fontSize: "11px", color: "#888" }}>Gross after discount</span>,
            icon: "🧾", color: "#065f46", bg: "#f0fdf4",
          },
          {
            label: "Outstanding", value: rupee(totalPending), sub: <span style={{ fontSize: "11px", color: totalPending > 0 ? "#b91c1c" : "#16a34a" }}>{totalPending > 0 ? "Needs follow-up" : "All cleared"}</span>,
            icon: "⏳", color: "#b45309", bg: "#fffbeb",
          },
          {
            label: "Total Invoices", value: totalInvoices.toLocaleString(), sub: <Trend pct={visitTrend} />,
            icon: "📋", color: "#6d28d9", bg: "#f5f3ff",
          },
          {
            label: "Avg per Visit", value: rupee(avgPerVisit), sub: <span style={{ fontSize: "11px", color: "#888" }}>per invoice</span>,
            icon: "👤", color: "#0891b2", bg: "#ecfeff",
          },
          {
            label: "Collection Rate", value: `${Math.round(collectionRate)}%`, sub: <span style={{ fontSize: "11px", color: collectionRate >= 80 ? "#16a34a" : "#b91c1c" }}>{collectionRate >= 80 ? "Healthy" : "Needs attention"}</span>,
            icon: "📈", color: "#b45309", bg: "#fef9c3",
          },
        ].map((card, i) => (
          <div key={i} className="stat-card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "8px" }}>{card.label}</div>
              <span style={{ background: card.bg, padding: "4px 8px", borderRadius: "8px", fontSize: "16px" }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: card.color, marginBottom: "6px" }}>{card.value}</div>
            <div>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart ─────────────────────────── */}
      <div style={{ background: "white", borderRadius: "14px", padding: "22px 24px", marginBottom: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "18px", color: "#0f4c81" }}>Revenue Trend</div>
            <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>
              {days <= 31 ? "Daily view" : days <= 92 ? "Weekly view" : "Monthly view"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: "600" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#0f4c81", display: "inline-block" }} /> Collected
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#fde68a", display: "inline-block" }} /> Pending
            </span>
          </div>
        </div>
        <BarChart data={chartData} height={190} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px", color: "#aaa" }}>
          <span>Peak day: {rupee(Math.max(...chartData.map(d => d.revenue)))}</span>
          <span>Avg/period: {rupee(chartData.reduce((s, d) => s + d.revenue, 0) / Math.max(chartData.length, 1))}</span>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px", background: "white", padding: "4px", borderRadius: "11px", width: "fit-content", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {([
          { key: "overview", label: "📊 Overview" },
          { key: "breakdown", label: "🔍 Breakdown" },
          { key: "transactions", label: "🧾 Transactions" },
        ] as const).map(tab => (
          <button key={tab.key} className="tab-btn" onClick={() => setActiveView(tab.key)}
            style={{ background: activeView === tab.key ? "#0f4c81" : "transparent", color: activeView === tab.key ? "white" : "#888", boxShadow: activeView === tab.key ? "0 2px 8px rgba(15,76,129,0.25)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────── */}
      {activeView === "overview" && (
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

          {/* Collection rate donut */}
          <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "16px", color: "#0f4c81" }}>Collection Rate</div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <DonutChart segments={[
                { label: "Collected", value: totalRevenue, color: "#0f4c81" },
                { label: "Pending", value: totalPending, color: "#fde68a" },
              ]} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                {[
                  { label: "Collected", value: rupee(totalRevenue), color: "#0f4c81", dot: "#0f4c81" },
                  { label: "Pending", value: rupee(totalPending), color: "#b45309", dot: "#fde68a" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#999", marginBottom: "2px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.dot, display: "inline-block" }} />
                      {item.label}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Invoice status */}
          <div className="stat-card">
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "16px", color: "#0f4c81", marginBottom: "16px" }}>Invoice Status</div>
            {[
              { label: "Paid", count: statusCounts.Paid, color: "#16a34a", bg: "#f0fdf4" },
              { label: "Partial", count: statusCounts.Partial, color: "#b45309", bg: "#fffbeb" },
              { label: "Pending", count: statusCounts.Pending, color: "#b91c1c", bg: "#fef2f2" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ background: s.bg, color: s.color, padding: "3px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>{s.label}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "15px" }}>{s.count}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{totalInvoices > 0 ? Math.round((s.count / totalInvoices) * 100) : 0}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="stat-card">
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "16px", color: "#0f4c81", marginBottom: "16px" }}>Payment Methods</div>
            {methodBreakdown.length === 0 ? (
              <div style={{ color: "#bbb", fontSize: "13px" }}>No data</div>
            ) : methodBreakdown.map(([method, amt]) => {
              const pct = Math.round((amt / totalRevenue) * 100);
              const color = methodColors[method] || "#64748b";
              return (
                <div key={method} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#555" }}>{method}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color }}>₹{Math.round(amt).toLocaleString("en-IN")} <span style={{ color: "#aaa", fontWeight: "500" }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: "5px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top patients — full width */}
          <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "16px", color: "#0f4c81", marginBottom: "16px" }}>Top Patients by Revenue</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Patient", "Visits", "Total Revenue", "Avg per Visit", "Bar"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#999", textAlign: "left", fontWeight: "700", borderBottom: "2px solid #f0f0f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topPatients.map((pat, i) => {
                    const maxRev = topPatients[0]?.revenue || 1;
                    return (
                      <tr key={i} className="hover-row" style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "11px 14px", fontSize: "13px", color: "#aaa", fontWeight: "700" }}>#{i + 1}</td>
                        <td style={{ padding: "11px 14px", fontWeight: "700", color: "#1a1a2e", fontSize: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#dbeafe", color: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>
                              {pat.name.charAt(0)}
                            </span>
                            {pat.name}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: "13px", color: "#555" }}>{pat.visits}</td>
                        <td style={{ padding: "11px 14px", fontWeight: "700", color: "#0f4c81", fontSize: "14px" }}>{rupee(pat.revenue)}</td>
                        <td style={{ padding: "11px 14px", fontSize: "13px", color: "#666" }}>{rupee(pat.revenue / pat.visits)}</td>
                        <td style={{ padding: "11px 14px", width: "120px" }}>
                          <div style={{ height: "6px", background: "#f0f0f0", borderRadius: "3px" }}>
                            <div style={{ height: "100%", width: `${Math.round((pat.revenue / maxRev) * 100)}%`, background: "linear-gradient(90deg, #0f4c81, #3b82f6)", borderRadius: "3px" }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Breakdown Tab ─────────────────────────── */}
      {activeView === "breakdown" && (
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Service revenue breakdown */}
          <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "16px", color: "#0f4c81", marginBottom: "18px" }}>Revenue by Service Type</div>
            {serviceBreakdown.length === 0 ? (
              <div style={{ color: "#bbb", fontSize: "13px" }}>No data</div>
            ) : serviceBreakdown.map(([name, amt], i) => {
              const pct = Math.round((amt / maxSvcAmt) * 100);
              const colors = ["#0f4c81", "#1d6fb5", "#2b82c9", "#3996dc", "#47aaef", "#6bb8f3", "#8ec6f6", "#b1d5f9"];
              return (
                <div key={name} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>{name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", color: "#aaa" }}>{pct}% of top</span>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: colors[i] }}>₹{Math.round(amt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div style={{ height: "8px", background: "#f0f4f8", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: colors[i], borderRadius: "4px", transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily avg by day of week */}
          {(() => {
            const dayMap: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
            rangeInvoices.forEach(inv => {
              const dow = new Date(inv.date).getDay();
              dayMap[dow].push(inv.paid || 0);
            });
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const avgByDay = Object.entries(dayMap).map(([dow, vals]) => ({
              label: dayNames[Number(dow)],
              revenue: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0,
              pending: 0,
              count: vals.length,
            }));
            const maxAvg = Math.max(...avgByDay.map(d => d.revenue), 1);
            return (
              <div className="stat-card">
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "16px", color: "#0f4c81", marginBottom: "14px" }}>Avg Revenue by Day of Week</div>
                {avgByDay.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#888", width: "28px", flexShrink: 0, fontWeight: "600" }}>{d.label}</span>
                    <div style={{ flex: 1, height: "7px", background: "#f0f4f8", borderRadius: "4px" }}>
                      <div style={{ height: "100%", width: `${Math.round((d.revenue / maxAvg) * 100)}%`, background: d.revenue === maxAvg ? "#16a34a" : "#0f4c81", borderRadius: "4px" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#555", width: "70px", textAlign: "right" }}>
                      {d.count > 0 ? rupee(d.revenue) : "—"}
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "8px" }}>Average collected per invoice per day</div>
              </div>
            );
          })()}

          {/* Month-over-month if range > 30 days */}
          <div className="stat-card">
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "16px", color: "#0f4c81", marginBottom: "14px" }}>Discount Impact</div>
            {(() => {
              const withDiscount = rangeInvoices.filter(i => (i.discount || 0) > 0);
              const discountTotal = rangeInvoices.reduce((s, i) => {
                const gross = (i.services || []).reduce((g, x) => g + x.amt, 0);
                return s + (gross * (i.discount || 0)) / 100;
              }, 0);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { label: "Invoices with discount", value: `${withDiscount.length} / ${rangeInvoices.length}`, sub: `${totalInvoices > 0 ? Math.round((withDiscount.length / totalInvoices) * 100) : 0}% of all invoices` },
                    { label: "Total discounted amount", value: rupee(discountTotal), sub: "Revenue foregone" },
                    { label: "Avg discount", value: withDiscount.length > 0 ? `${Math.round(withDiscount.reduce((s, i) => s + (i.discount || 0), 0) / withDiscount.length)}%` : "—", sub: "On discounted invoices" },
                  ].map(item => (
                    <div key={item.label} style={{ padding: "12px", background: "#f8fbff", borderRadius: "8px", border: "1px solid #e8f1fb" }}>
                      <div style={{ fontSize: "11px", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f4c81" }}>{item.value}</div>
                      <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Transactions Tab ──────────────────────── */}
      {activeView === "transactions" && (
        <div className="fade-in">
          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={inputStyle}>
              <option value="All">All Methods</option>
              {["Cash", "UPI / GPay", "Card", "Insurance", "Cheque"].map(m => <option key={m}>{m}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
              <option value="All">All Status</option>
              {["Paid", "Partial", "Pending"].map(s => <option key={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: "13px", color: "#888" }}>{transactions.length} results</span>
          </div>

          <div style={{ background: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0f4c81" }}>
                  {["Invoice", "Date", "Patient", "Services", "Net", "Paid", "Balance", "Method", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", color: "white", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px", textAlign: "left", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>
                    <div style={{ fontSize: "32px" }}>🧾</div>
                    <div style={{ fontWeight: "600", marginTop: "8px" }}>No transactions found</div>
                  </td></tr>
                ) : transactions.slice(0, 100).map((inv, i) => {
                  const net = calcNet(inv);
                  const bal = net - (inv.paid || 0);
                  const statusColors: Record<string, { bg: string; color: string }> = {
                    Paid: { bg: "#f0fdf4", color: "#16a34a" },
                    Partial: { bg: "#fffbeb", color: "#b45309" },
                    Pending: { bg: "#fef2f2", color: "#b91c1c" },
                  };
                  const sc = statusColors[inv.status] || statusColors.Pending;
                  return (
                    <tr key={inv.id} className="hover-row" style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "11px", color: "#aaa" }}>{inv.id}</td>
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "#666" }}>{inv.date}</td>
                      <td style={{ padding: "10px 14px", fontWeight: "600", color: "#1a1a2e", fontSize: "13px" }}>{inv.patName}</td>
                      <td style={{ padding: "10px 14px", fontSize: "11px", color: "#777", maxWidth: "140px" }}>
                        {(inv.services || []).map(s => s.name).join(", ").substring(0, 40)}{(inv.services || []).map(s => s.name).join(", ").length > 40 ? "…" : ""}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: "600", fontSize: "13px", color: "#333" }}>{rupee(net)}</td>
                      <td style={{ padding: "10px 14px", fontWeight: "700", fontSize: "13px", color: "#16a34a" }}>{rupee(inv.paid || 0)}</td>
                      <td style={{ padding: "10px 14px", fontSize: "13px", color: bal > 0 ? "#b91c1c" : "#888", fontWeight: bal > 0 ? "700" : "400" }}>{bal > 0 ? rupee(bal) : "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "#555" }}>{inv.method}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>{inv.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transactions.length > 100 && (
              <div style={{ padding: "14px", textAlign: "center", fontSize: "12px", color: "#aaa", borderTop: "1px solid #f0f0f0" }}>
                Showing 100 of {transactions.length} — export CSV for full data
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}