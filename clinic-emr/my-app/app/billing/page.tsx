"use client";
import hospitalConfig from "@/config/hospital";
import { useEffect, useState } from "react";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const [form, setForm] = useState({
    patient_id: "", patient_name: "", service_name: "", amount: "", status: "Pending",
  });

  useEffect(() => { loadInvoices(); loadPatients(); }, []);

  async function loadInvoices() {
    const res = await fetch("/api/billing", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setInvoices(data);
  }

  async function loadPatients() {
    const res = await fetch("/api/patients", { cache: "no-store" });
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) setPatients(result.data);
    else if (Array.isArray(result)) setPatients(result);
  }

  async function createInvoice() {
    if (!form.patient_id || !form.service_name || !form.amount) return;
    setLoading(true);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    setLoading(false);
    if (!res.ok) return;
    setShowAdd(false);
    setForm({ patient_id: "", patient_name: "", service_name: "", amount: "", status: "Pending" });
    loadInvoices();
  }

  async function markAsPaid(id: string) {
    setMarkingPaid(id);
    await fetch("/api/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "Paid" }),
    });
    setMarkingPaid(null);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "Paid" } : inv));
    if (viewInvoice?.id === id) setViewInvoice((v: any) => ({ ...v, status: "Paid" }));
  }

  async function deleteInvoice(id: string) {
    if (!confirm("Delete this invoice?")) return;
    await fetch("/api/billing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    if (viewInvoice?.id === id) setViewInvoice(null);
  }

  function handlePrint(inv: any) {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    const gst = (inv.amount * 0.18).toFixed(2);
    const total = (Number(inv.amount) + Number(gst)).toFixed(2);
    const invoiceNum = `INV-${inv.id?.slice(0, 8).toUpperCase()}`;

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Invoice ${invoiceNum}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a1a2e;padding:0}
      .page{width:794px;min-height:1123px;margin:0 auto;padding:60px 70px;position:relative}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:50px}
      .hospital-name{font-family:'DM Serif Display',serif;font-size:28px;color:#0f4c81}
      .hospital-sub{font-size:12px;color:#666;margin-top:4px;line-height:1.6}
      .invoice-title{font-size:36px;font-weight:300;color:#0f4c81;letter-spacing:4px;text-transform:uppercase;text-align:right}
      .invoice-num{font-size:13px;color:#888;margin-top:6px;letter-spacing:1px;text-align:right}
      .divider{height:2px;background:linear-gradient(90deg,#0f4c81,#4fc3f7,transparent);margin:30px 0}
      .meta-row{display:flex;justify-content:space-between;margin-bottom:40px}
      .meta-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px}
      .meta-value{font-size:14px;color:#1a1a2e;font-weight:500;line-height:1.7}
      .table-head{display:grid;grid-template-columns:1fr 120px 120px 120px;background:#0f4c81;color:white;padding:12px 16px;border-radius:8px 8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px}
      .table-row{display:grid;grid-template-columns:1fr 120px 120px 120px;padding:14px 16px;border-bottom:1px solid #f0f0f0;font-size:13px}
      .totals{margin-top:20px;display:flex;justify-content:flex-end}
      .totals-box{width:280px}
      .totals-row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;border-bottom:1px solid #eee}
      .totals-final{padding-top:12px;font-size:16px;font-weight:600;color:#0f4c81;border-bottom:none;border-top:2px solid #0f4c81;margin-top:4px;display:flex;justify-content:space-between}
      .status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
      .status-paid{background:#d1fae5;color:#065f46}
      .status-pending{background:#fef3c7;color:#92400e}
      .footer{margin-top:60px;padding-top:30px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end}
      .footer-note{font-size:11px;color:#999;line-height:1.8;max-width:300px}
      .sign-line{width:160px;border-top:1px solid #333;margin-bottom:6px;margin-left:auto}
      .sign-label{font-size:11px;color:#666;text-align:right}
      .watermark{position:absolute;bottom:160px;left:50%;transform:translateX(-50%) rotate(-30deg);font-family:'DM Serif Display',serif;font-size:90px;color:rgba(15,76,129,0.04);white-space:nowrap;pointer-events:none;letter-spacing:10px}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="page">
      <div class="watermark">${inv.status === "Paid" ? "PAID" : "PENDING"}</div>
      <div class="header">
        <div>
          <div class="hospital-name">${hospitalConfig.name}</div>
          <div class="hospital-sub">${hospitalConfig.address}, ${hospitalConfig.city}, ${hospitalConfig.state}<br/>
          Phone: ${hospitalConfig.phone} &nbsp;|&nbsp; GST: ${hospitalConfig.gst || "N/A"}</div>
        </div>
        <div>
          <div class="invoice-title">Invoice</div>
          <div class="invoice-num">${invoiceNum}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="meta-row">
        <div><div class="meta-label">Billed To</div>
        <div class="meta-value"><strong style="font-size:16px;color:#0f4c81">${inv.patient_name}</strong></div></div>
        <div><div class="meta-label">Invoice Date</div>
        <div class="meta-value">${new Date(inv.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
        <div><div class="meta-label">Status</div>
        <div class="meta-value"><span class="status-badge ${inv.status === "Paid" ? "status-paid" : "status-pending"}">${inv.status}</span></div></div>
      </div>
      <div class="table-head"><span>Description</span><span style="text-align:right">Unit Price</span><span style="text-align:right">GST (18%)</span><span style="text-align:right">Total</span></div>
      <div class="table-row"><span>${inv.service_name}</span><span style="text-align:right">Rs. ${Number(inv.amount).toLocaleString("en-IN")}</span><span style="text-align:right">Rs. ${Number(gst).toLocaleString("en-IN")}</span><span style="text-align:right">Rs. ${Number(total).toLocaleString("en-IN")}</span></div>
      <div class="totals"><div class="totals-box">
        <div class="totals-row"><span>Subtotal</span><span>Rs. ${Number(inv.amount).toLocaleString("en-IN")}</span></div>
        <div class="totals-row"><span>GST @ 18%</span><span>Rs. ${Number(gst).toLocaleString("en-IN")}</span></div>
        <div class="totals-row"><span>Discount</span><span>Rs. 0.00</span></div>
        <div class="totals-final"><span>Amount Due</span><span>Rs. ${Number(total).toLocaleString("en-IN")}</span></div>
      </div></div>
      <div class="footer">
        <div class="footer-note">Thank you for choosing ${hospitalConfig.name}.<br/>Payment is due within 30 days of invoice date.<br/>${hospitalConfig.email}</div>
        <div><div class="sign-line"></div><div class="sign-label">Authorized Signatory</div></div>
      </div>
    </div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
    printWindow.document.close();
  }

  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + Number(i.amount), 0);
  const pendingAmount = invoices.filter(i => i.status === "Pending").reduce((sum, i) => sum + Number(i.amount), 0);
  const inputStyle: any = { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ padding: "2rem", background: "#f0f4f8", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .action-btn{background:none;border:none;cursor:pointer;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;transition:all 0.15s;font-family:inherit}
        .view-btn{color:#0f4c81;background:#e8f1fb}.view-btn:hover{background:#c8dff5}
        .print-btn{color:#065f46;background:#d1fae5}.print-btn:hover{background:#a7f3d0}
        .mark-paid-btn{color:#92400e;background:#fef3c7;border:none;cursor:pointer;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;transition:all 0.15s;font-family:inherit}.mark-paid-btn:hover{background:#fde68a}.mark-paid-btn:disabled{opacity:0.5;cursor:not-allowed}
        .del-btn{color:#991b1b;background:#fee2e2}.del-btn:hover{background:#fecaca}
        .invoice-row:hover td{background:#f0f7ff!important}
        .stat-card{background:white;border-radius:14px;padding:22px 26px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
        input:focus,select:focus{outline:none!important;border-color:#0f4c81!important;box-shadow:0 0 0 3px rgba(15,76,129,0.1)!important}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .modal-overlay{animation:fadeIn 0.2s ease}
        .modal-box{animation:slideUp 0.25s ease}
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#0f4c81", fontFamily: "'DM Serif Display', serif", margin: 0 }}>Billing & Invoices</h1>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>{invoices.length} total invoices</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ background: "#0f4c81", color: "white", padding: "11px 22px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#0a3d6b")}
          onMouseLeave={e => (e.currentTarget.style.background = "#0f4c81")}>
          + Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Invoices", value: invoices.length, color: "#1a1a2e" },
          { label: "Revenue Collected", value: `Rs. ${totalRevenue.toLocaleString("en-IN")}`, color: "#065f46" },
          { label: "Pending Amount", value: `Rs. ${pendingAmount.toLocaleString("en-IN")}`, color: "#92400e" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0f4c81" }}>
              {["Invoice #", "Patient", "Service", "Amount", "Date", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "13px 16px", color: "white", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>No invoices yet. Create your first invoice.</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="invoice-row" style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "13px 16px", fontSize: "12px", color: "#888", fontFamily: "monospace" }}>INV-{inv.id?.slice(0, 8).toUpperCase()}</td>
                <td style={{ padding: "13px 16px", fontWeight: "600", color: "#1a1a2e", fontSize: "14px" }}>{inv.patient_name}</td>
                <td style={{ padding: "13px 16px", fontSize: "13px", color: "#555" }}>{inv.service_name}</td>
                <td style={{ padding: "13px 16px", fontSize: "14px", fontWeight: "600", color: "#0f4c81" }}>Rs. {Number(inv.amount).toLocaleString("en-IN")}</td>
                <td style={{ padding: "13px 16px", fontSize: "13px", color: "#666" }}>{new Date(inv.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", background: inv.status === "Paid" ? "#d1fae5" : "#fef3c7", color: inv.status === "Paid" ? "#065f46" : "#92400e" }}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <button className="action-btn view-btn" onClick={() => setViewInvoice(inv)}>View</button>
                    <button className="action-btn print-btn" onClick={() => handlePrint(inv)}>Print</button>
                    {inv.status === "Pending" && (
                      <button className="mark-paid-btn" disabled={markingPaid === inv.id} onClick={() => markAsPaid(inv.id)}>
                        {markingPaid === inv.id ? "..." : "✓ Paid"}
                      </button>
                    )}
                    <button className="action-btn del-btn" onClick={() => deleteInvoice(inv.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div className="modal-box" style={{ background: "white", borderRadius: "16px", width: "640px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ background: "linear-gradient(135deg,#0f4c81,#1a6eb5)", padding: "28px 36px", borderRadius: "16px 16px 0 0", color: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "22px", marginBottom: "4px" }}>{hospitalConfig.name}</div>
                  <div style={{ fontSize: "12px", opacity: 0.7, lineHeight: 1.8 }}>{hospitalConfig.address}, {hospitalConfig.city}<br/>GST: {hospitalConfig.gst || "N/A"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "28px", fontWeight: "300", letterSpacing: "4px", textTransform: "uppercase" }}>Invoice</div>
                  <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px", fontFamily: "monospace" }}>INV-{viewInvoice.id?.slice(0, 8).toUpperCase()}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "28px 36px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#999", marginBottom: "6px" }}>Billed To</div>
                  <div style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "15px" }}>{viewInvoice.patient_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#999", marginBottom: "6px" }}>Invoice Date</div>
                  <div style={{ fontWeight: "500", color: "#1a1a2e" }}>{new Date(viewInvoice.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#999", marginBottom: "6px" }}>Status</div>
                  <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: viewInvoice.status === "Paid" ? "#d1fae5" : "#fef3c7", color: viewInvoice.status === "Paid" ? "#065f46" : "#92400e" }}>
                    {viewInvoice.status}
                  </span>
                </div>
              </div>
              <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #eee", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 110px", background: "#f8f9fa", padding: "10px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#666" }}>
                  <span>Description</span><span style={{ textAlign: "right" }}>Base</span><span style={{ textAlign: "right" }}>GST 18%</span><span style={{ textAlign: "right" }}>Total</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 110px", padding: "14px 16px", fontSize: "14px" }}>
                  <span style={{ fontWeight: "500", color: "#1a1a2e" }}>{viewInvoice.service_name}</span>
                  <span style={{ textAlign: "right", color: "#555" }}>Rs. {Number(viewInvoice.amount).toLocaleString("en-IN")}</span>
                  <span style={{ textAlign: "right", color: "#555" }}>Rs. {(viewInvoice.amount * 0.18).toFixed(2)}</span>
                  <span style={{ textAlign: "right", fontWeight: "700", color: "#0f4c81" }}>Rs. {(Number(viewInvoice.amount) * 1.18).toFixed(2)}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                <div style={{ width: "260px" }}>
                  {[["Subtotal", `Rs. ${Number(viewInvoice.amount).toLocaleString("en-IN")}`], ["GST @ 18%", `Rs. ${(viewInvoice.amount * 0.18).toFixed(2)}`], ["Discount", "Rs. 0.00"]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0f0f0", fontSize: "13px", color: "#555" }}>
                      <span>{l}</span><span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: "16px", fontWeight: "700", color: "#0f4c81", borderTop: "2px solid #0f4c81", marginTop: "4px" }}>
                    <span>Amount Due</span><span>Rs. {(Number(viewInvoice.amount) * 1.18).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button onClick={() => setViewInvoice(null)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Close</button>
                {viewInvoice.status === "Pending" && (
                  <button onClick={() => markAsPaid(viewInvoice.id)} disabled={markingPaid === viewInvoice.id}
                    style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#d1fae5", color: "#065f46", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                    {markingPaid === viewInvoice.id ? "Saving..." : "✓ Mark as Paid"}
                  </button>
                )}
                <button onClick={() => handlePrint(viewInvoice)} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0f4c81", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                  🖨 Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showAdd && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(10,20,40,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-box" style={{ background: "white", padding: "36px", borderRadius: "16px", width: "420px", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "22px", color: "#0f4c81", marginBottom: "6px" }}>New Invoice</h2>
            <p style={{ color: "#999", fontSize: "13px", marginBottom: "24px" }}>Fill in details to generate an invoice</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Patient</label>
                <select style={inputStyle} value={form.patient_id} onChange={e => { const p = patients.find(p => String(p.id) === String(e.target.value)); setForm({ ...form, patient_id: e.target.value, patient_name: p?.name || "" }); }}>
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Service Name</label>
                <input style={inputStyle} placeholder="e.g. Consultation, X-Ray, Blood Test" value={form.service_name} onChange={e => setForm({ ...form, service_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Amount (Rs.)</label>
                <input type="number" style={inputStyle} placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Payment Status</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Pending</option>
                  <option>Paid</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", fontSize: "14px", color: "#555" }}>Cancel</button>
              <button onClick={createInvoice} disabled={loading} style={{ flex: 1, background: loading ? "#93c5fd" : "#0f4c81", color: "white", border: "none", borderRadius: "8px", padding: "12px", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>
                {loading ? "Creating..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
