"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type TokenStatus = "waiting" | "calling" | "with-doctor" | "done" | "skipped";
interface Token {
  id: string;
  token: number;
  name: string;
  phone: string;
  type: "General" | "Emergency" | "Follow-up" | "Senior Citizen";
  doctor: string;
  status: TokenStatus;
  createdAt: Date;
  calledAt?: Date;
  note?: string;
}

const DOCTORS = [
  "Dr. Anand Sharma (General Medicine)",
  "Dr. Priya Mehta (Pediatrics)",
  "Dr. Ravi Kumar (Orthopedics)",
  "Dr. Sunita Patel (Gynecology)",
  "Dr. Arun Verma (Cardiology)",
];

const TYPE_CONFIG: Record<Token["type"], { color: string; bg: string; border: string; priority: number }> = {
  Emergency:        { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", priority: 0 },
  "Senior Citizen": { color: "#d97706", bg: "#fffbeb", border: "#fde68a", priority: 1 },
  "Follow-up":      { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", priority: 2 },
  General:          { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", priority: 3 },
};

const STATUS_CONFIG: Record<TokenStatus, { label: string; color: string; bg: string }> = {
  waiting:      { label: "Waiting",     color: "#64748b", bg: "#f1f5f9" },
  calling:      { label: "Calling…",    color: "#d97706", bg: "#fef3c7" },
  "with-doctor":{ label: "With Doctor", color: "#059669", bg: "#d1fae5" },
  done:         { label: "Done",        color: "#94a3b8", bg: "#f8fafc" },
  skipped:      { label: "Skipped",     color: "#dc2626", bg: "#fff1f2" },
};

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --sans: 'DM Sans', sans-serif;
    --display: 'Syne', sans-serif;
    --ink: #0f172a; --ink-2: #334155; --ink-3: #64748b; --ink-4: #94a3b8;
    --border: #e2e8f0; --bg: #f8fafc; --surface: #ffffff;
    --teal: #0d9488; --teal-d: #0f766e; --teal-l: #f0fdfa; --teal-m: #ccfbf1;
    --red: #dc2626; --amber: #d97706; --green: #059669; --violet: #7c3aed;
    --shadow-sm: 0 1px 3px rgba(15,23,42,.05),0 1px 2px rgba(15,23,42,.04);
    --shadow: 0 2px 8px rgba(15,23,42,.07),0 4px 20px rgba(15,23,42,.05);
    --shadow-md: 0 8px 24px rgba(15,23,42,.09),0 2px 6px rgba(15,23,42,.05);
    --shadow-lg: 0 20px 60px rgba(15,23,42,.13);
    --r: 14px; --r-sm: 9px; --r-lg: 20px; --r-xl: 26px;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:var(--sans);background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased;}
  input,select,textarea,button{font-family:var(--sans);}

  /* ── TOPBAR ── */
  .opd-top{background:var(--ink);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:58px;gap:16px;}
  .opd-top-left{display:flex;align-items:center;gap:16px;}
  .opd-logo{display:flex;align-items:center;gap:9px;}
  .opd-logo-dot{width:32px;height:32px;background:var(--teal);border-radius:9px;display:flex;align-items:center;justify-content:center;}
  .opd-logo-dot svg{width:16px;height:16px;}
  .opd-logo-text{font-family:var(--display);font-size:1rem;font-weight:700;color:#fff;letter-spacing:-.01em;}
  .opd-divider{width:1px;height:20px;background:rgba(255,255,255,.12);}
  .opd-page-title{font-size:12.5px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:.04em;text-transform:uppercase;}
  .opd-top-right{display:flex;align-items:center;gap:10px;}
  .opd-clock{font-family:var(--display);font-size:.9rem;font-weight:700;color:rgba(255,255,255,.7);background:rgba(255,255,255,.07);padding:5px 12px;border-radius:6px;letter-spacing:.02em;}
  .opd-date{font-size:11px;color:rgba(255,255,255,.38);font-weight:500;}

  /* ── LAYOUT ── */
  .opd-body{display:grid;grid-template-columns:380px 1fr;min-height:calc(100vh - 58px);}
  .opd-left{background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
  .opd-right{display:flex;flex-direction:column;overflow:hidden;}

  /* ── REGISTER PANEL ── */
  .opd-reg-head{padding:20px 22px 16px;border-bottom:1px solid var(--border);}
  .opd-section-label{font-family:var(--display);font-size:.82rem;font-weight:700;color:var(--ink-2);letter-spacing:.01em;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
  .opd-section-label svg{width:15px;height:15px;color:var(--teal);}
  .opd-form{display:flex;flex-direction:column;gap:11px;}
  .opd-fg{display:flex;flex-direction:column;gap:4px;}
  .opd-label{font-size:10.5px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.07em;}
  .opd-input{padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-sm);font-size:13px;font-weight:500;color:var(--ink);background:#fff;outline:none;transition:border-color .18s,box-shadow .18s;width:100%;}
  .opd-input:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(13,148,136,.12);}
  .opd-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .opd-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
  .opd-type-btn{padding:8px 10px;border-radius:var(--r-sm);border:1.5px solid var(--border);background:#fff;cursor:pointer;font-size:11.5px;font-weight:700;color:var(--ink-3);transition:all .15s;text-align:center;}
  .opd-type-btn.selected{border-width:2px;}
  .opd-reg-btn{width:100%;padding:12px;background:var(--ink);color:#fff;border:none;border-radius:var(--r-sm);font-family:var(--display);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;position:relative;overflow:hidden;margin-top:4px;}
  .opd-reg-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--teal),var(--teal-d));opacity:0;transition:opacity .2s;}
  .opd-reg-btn>*{position:relative;z-index:1;}
  .opd-reg-btn:hover::before{opacity:1;}
  .opd-reg-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,148,136,.3);}
  .opd-reg-btn svg{width:15px;height:15px;}

  /* ── STATS ROW ── */
  .opd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid var(--border);}
  .opd-stat{padding:14px 16px;text-align:center;border-right:1px solid var(--border);}
  .opd-stat:last-child{border-right:none;}
  .opd-stat-val{font-family:var(--display);font-size:1.5rem;font-weight:800;line-height:1;margin-bottom:3px;}
  .opd-stat-lbl{font-size:10px;font-weight:600;color:var(--ink-4);text-transform:uppercase;letter-spacing:.08em;}

  /* ── CURRENT TOKEN HERO ── */
  .opd-current{margin:16px 20px;background:linear-gradient(135deg,var(--ink) 0%,#1e293b 100%);border-radius:var(--r-lg);padding:22px 24px;position:relative;overflow:hidden;}
  .opd-current::before{content:'';position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(13,148,136,.3),transparent 70%);}
  .opd-current::after{content:'';position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(13,148,136,.15),transparent 70%);}
  .opd-current-label{font-size:9.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.38);margin-bottom:10px;position:relative;z-index:1;}
  .opd-current-num{font-family:var(--display);font-size:3.8rem;font-weight:800;color:#fff;line-height:1;margin-bottom:6px;position:relative;z-index:1;letter-spacing:-.03em;}
  .opd-current-name{font-size:14px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:3px;position:relative;z-index:1;}
  .opd-current-doc{font-size:11.5px;color:rgba(255,255,255,.45);position:relative;z-index:1;}
  .opd-current-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:rgba(13,148,136,.25);border:1px solid rgba(13,148,136,.4);border-radius:20px;font-size:11px;font-weight:700;color:#2dd4bf;margin-top:10px;position:relative;z-index:1;}
  .opd-current-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:#2dd4bf;animation:blink 1.2s ease-in-out infinite;}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}
  .opd-no-current{text-align:center;padding:28px 20px;color:rgba(255,255,255,.4);font-size:13px;}

  /* ── QUEUE PANEL ── */
  .opd-queue-head{padding:14px 20px 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);}
  .opd-queue-filters{display:flex;gap:6px;padding:10px 20px;border-bottom:1px solid var(--border);overflow-x:auto;}
  .opd-filter-btn{padding:5px 13px;border:1.5px solid var(--border);border-radius:20px;font-size:11.5px;font-weight:700;color:var(--ink-3);background:#fff;cursor:pointer;transition:all .15s;white-space:nowrap;}
  .opd-filter-btn.active{background:var(--ink);color:#fff;border-color:var(--ink);}
  .opd-queue-list{flex:1;overflow-y:auto;padding:12px 20px;}

  /* ── TOKEN CARD ── */
  .opd-token-card{
    background:#fff;border:1.5px solid var(--border);border-radius:12px;
    padding:12px 14px;margin-bottom:8px;
    display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;
    transition:all .18s;animation:slideIn .25s ease both;
  }
  @keyframes slideIn{from{opacity:0;transform:translateY(6px);}}
  .opd-token-card:hover{box-shadow:0 4px 16px rgba(15,23,42,.08);border-color:#cbd5e1;}
  .opd-token-card.status-calling{border-color:#f59e0b;background:#fffbeb;animation:slideIn .25s ease both,pulseCard 2s ease-in-out infinite;}
  @keyframes pulseCard{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.15);}50%{box-shadow:0 0 0 8px rgba(245,158,11,.0);}}
  .opd-token-card.status-with-doctor{border-color:#10b981;background:#f0fdf4;}
  .opd-token-card.status-done{opacity:.45;}
  .opd-token-card.status-skipped{opacity:.4;}

  /* Token Number Badge */
  .opd-token-badge{
    display:flex;align-items:center;justify-content:center;
    background:#0f172a;color:#fff;
    border-radius:8px;
    min-width:52px;width:52px;height:44px;
    font-family:'DM Sans',sans-serif;font-size:13px;font-weight:800;
    letter-spacing:.03em;flex-shrink:0;
    padding:0 6px;white-space:nowrap;
  }
  .opd-token-badge.done{background:#e2e8f0;color:#64748b;}
  .opd-token-badge.calling{background:#f59e0b;color:#fff;}
  .opd-token-badge.with-doctor{background:#059669;color:#fff;}
  .opd-token-badge.skipped{background:#e2e8f0;color:#94a3b8;}

  .opd-token-info{min-width:0;}
  .opd-token-name{font-size:14px;font-weight:700;color:var(--ink);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .opd-token-meta{font-size:11.5px;color:var(--ink-4);font-weight:500;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .opd-token-tags{display:flex;gap:5px;flex-wrap:wrap;}
  .opd-tag{display:inline-flex;align-items:center;padding:3px 8px;border-radius:5px;font-size:10.5px;font-weight:700;letter-spacing:.01em;}
  .opd-token-actions{display:flex;gap:5px;flex-direction:column;flex-shrink:0;align-items:stretch;}
  .opd-act-btn{padding:6px 14px;border-radius:7px;font-size:11.5px;font-weight:700;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;font-family:var(--sans);text-align:center;}
  .btn-call{background:#fef3c7;color:#92400e;border:1px solid #fde68a;} .btn-call:hover{background:#f59e0b;color:#fff;border-color:#f59e0b;}
  .btn-done{background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;} .btn-done:hover{background:#059669;color:#fff;border-color:#059669;}
  .btn-skip{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;} .btn-skip:hover{background:#64748b;color:#fff;border-color:#64748b;}
  .btn-recall{background:#ede9fe;color:#5b21b6;border:1px solid #ddd6fe;} .btn-recall:hover{background:#7c3aed;color:#fff;border-color:#7c3aed;}

  /* ── DISPLAY MODE ── */
  .opd-display{position:fixed;inset:0;background:#020617;z-index:99999;display:flex;flex-direction:column;overflow:hidden;}
  .opd-display-head{
    padding:16px 36px;display:flex;justify-content:space-between;align-items:center;
    border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;
    background:rgba(255,255,255,.02);
  }
  .opd-display-clinic{font-family:'DM Sans',sans-serif;font-size:1rem;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.01em;}
  .opd-display-clock{font-family:'DM Sans',sans-serif;font-size:1.3rem;font-weight:800;color:#fff;letter-spacing:.04em;}
  .opd-display-body{flex:1;display:grid;grid-template-columns:55% 45%;gap:0;min-height:0;overflow:hidden;}

  /* Left panel — Now Calling */
  .opd-display-main{
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:48px 40px;border-right:1px solid rgba(255,255,255,.06);
    position:relative;overflow:hidden;gap:0;
  }
  .opd-display-main::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 70% 50% at 50% 60%,rgba(13,148,136,.1),transparent 70%);
    pointer-events:none;
  }
  .opd-display-label{
    font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
    color:rgba(255,255,255,.25);margin-bottom:24px;position:relative;z-index:1;
  }
  /* Token number — uses a pill container, no text clipping */
  .opd-display-token-wrap{
    position:relative;z-index:1;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.1);
    border-radius:20px;
    padding:20px 40px;
    margin-bottom:24px;
    text-align:center;
  }
  .opd-display-token{
    font-family:'DM Sans',sans-serif;
    font-size:clamp(3.5rem,8vw,6.5rem);
    font-weight:800;line-height:1;
    color:#fff;
    letter-spacing:.04em;
    white-space:nowrap;
  }
  .opd-display-pname{
    font-family:'DM Sans',sans-serif;font-size:clamp(1.4rem,2.5vw,2.2rem);font-weight:700;
    color:rgba(255,255,255,.9);position:relative;z-index:1;
    text-align:center;letter-spacing:-.01em;max-width:100%;
    padding:0 24px;word-break:break-word;line-height:1.2;
  }
  .opd-display-pdoc{
    font-family:'DM Sans',sans-serif;font-size:14px;color:rgba(255,255,255,.35);
    margin-top:8px;position:relative;z-index:1;text-align:center;
  }
  .opd-display-type-badge{
    margin-top:16px;position:relative;z-index:1;
    display:inline-block;padding:5px 16px;border-radius:20px;
    font-size:12px;font-weight:700;letter-spacing:.04em;
  }

  /* Right panel — queue list */
  .opd-display-side{padding:28px 24px;overflow-y:auto;}
  .opd-display-side-title{
    font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;
    color:rgba(255,255,255,.2);margin-bottom:14px;
  }
  .opd-display-queue-item{
    display:grid;grid-template-columns:50px 1fr auto;
    align-items:center;gap:10px;
    padding:12px 14px;border-radius:10px;margin-bottom:6px;
    background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);
    transition:background .15s;
  }
  .opd-display-queue-item:hover{background:rgba(255,255,255,.07);}
  .opd-display-qnum{
    font-family:'DM Sans',sans-serif;font-size:12px;font-weight:800;
    color:rgba(255,255,255,.4);
    background:rgba(255,255,255,.07);
    border-radius:6px;padding:4px 6px;
    text-align:center;white-space:nowrap;
  }
  .opd-display-qinfo{min-width:0;overflow:hidden;}
  .opd-display-qname{
    font-size:14px;font-weight:700;color:rgba(255,255,255,.8);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .opd-display-qtype{
    font-size:11px;color:rgba(255,255,255,.28);margin-top:2px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .opd-display-close{
    position:fixed;top:16px;right:16px;
    background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
    color:rgba(255,255,255,.5);width:36px;height:36px;border-radius:8px;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:all .15s;z-index:100000;
  }
  .opd-display-close:hover{background:rgba(255,255,255,.15);color:#fff;}
  .opd-display-close svg{width:16px;height:16px;}

  /* ── EMPTY ── */
  .opd-empty{text-align:center;padding:48px 20px;color:var(--ink-4);}
  .opd-empty-ico{font-size:2.5rem;margin-bottom:12px;}
  .opd-empty h4{font-size:15px;font-weight:700;color:var(--ink-3);margin-bottom:5px;}
  .opd-empty p{font-size:13px;}

  /* ── TOAST ── */
  .opd-toast{position:fixed;bottom:24px;right:24px;z-index:3000;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;box-shadow:var(--shadow-lg);animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);max-width:320px;}
  @keyframes toastIn{from{opacity:0;transform:translateX(20px);}}
  .toast-success{background:#064e3b;color:#6ee7b7;border-left:4px solid #10b981;}
  .toast-info{background:#0c2340;color:#93c5fd;border-left:4px solid #3b82f6;}
  .toast-warn{background:#451a03;color:#fcd34d;border-left:4px solid #f59e0b;}

  /* ── BUTTONS ── */
  .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:var(--r-sm);font-size:12.5px;font-weight:700;cursor:pointer;border:none;transition:all .18s;white-space:nowrap;font-family:var(--sans);}
  .btn svg{width:14px;height:14px;}
  .btn-primary{background:var(--teal);color:#fff;} .btn-primary:hover{background:var(--teal-d);transform:translateY(-1px);}
  .btn-outline{background:transparent;color:var(--ink-2);border:1.5px solid var(--border);} .btn-outline:hover{background:var(--bg);}
  .btn-dark{background:var(--ink);color:#fff;} .btn-dark:hover{background:#1e293b;}
  .btn-sm{padding:6px 12px;font-size:11.5px;}

  @media(max-width:900px){.opd-body{grid-template-columns:1fr;}.opd-left{border-right:none;border-bottom:1px solid var(--border);}.opd-display-body{grid-template-columns:1fr;}}
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function OPDQueue() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filter, setFilter] = useState<"all" | TokenStatus>("all");
  const [showDisplay, setShowDisplay] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [clock, setClock] = useState("");
  const [tokenCounter, setTokenCounter] = useState(1);

  // Form state
  const [form, setForm] = useState({
    name: "", phone: "", doctor: DOCTORS[0],
    type: "General" as Token["type"], note: "",
  });

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("opd_tokens");
      const cnt   = localStorage.getItem("opd_counter");
      if (saved)  setTokens(JSON.parse(saved).map((t: any) => ({ ...t, createdAt: new Date(t.createdAt), calledAt: t.calledAt ? new Date(t.calledAt) : undefined })));
      if (cnt)    setTokenCounter(parseInt(cnt));
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem("opd_tokens", JSON.stringify(tokens));
      localStorage.setItem("opd_counter", String(tokenCounter));
    } catch {}
  }, [tokens, tokenCounter]);

  function showToast(msg: string, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function registerToken() {
    if (!form.name.trim()) return showToast("Patient name is required.", "warn");
    const newToken: Token = {
      id: Date.now().toString(),
      token: tokenCounter,
      name: form.name.trim(),
      phone: form.phone,
      type: form.type,
      doctor: form.doctor,
      status: "waiting",
      createdAt: new Date(),
      note: form.note,
    };
    setTokens(prev => [...prev, newToken]);
    setTokenCounter(c => c + 1);
    setForm({ name: "", phone: "", doctor: DOCTORS[0], type: "General", note: "" });
    showToast(`Token #${tokenCounter} issued for ${newToken.name}`, "success");
  }

  function updateStatus(id: string, status: TokenStatus) {
    setTokens(prev => prev.map(t =>
      t.id === id ? { ...t, status, calledAt: status === "calling" ? new Date() : t.calledAt } : t
    ));
    const t = tokens.find(x => x.id === id);
    if (!t) return;
    const msgs: Record<string, string> = {
      calling:       `Calling Token #${t.token} — ${t.name}`,
      "with-doctor": `Token #${t.token} is now with the doctor`,
      done:          `Token #${t.token} completed`,
      skipped:       `Token #${t.token} skipped`,
    };
    showToast(msgs[status] || "Updated", status === "done" ? "success" : "info");
  }

  function resetDay() {
    if (!confirm("Reset all tokens for a new day?")) return;
    setTokens([]);
    setTokenCounter(1);
    showToast("Queue reset for new day!", "info");
  }

  // Derived
  const waiting     = tokens.filter(t => t.status === "waiting");
  const calling     = tokens.find(t => t.status === "calling");
  const withDoctor  = tokens.filter(t => t.status === "with-doctor");
  const done        = tokens.filter(t => t.status === "done");

  const sorted = [...tokens].sort((a, b) => {
    const priorityOrder = { calling: 0, "with-doctor": 1, waiting: 2, skipped: 3, done: 4 };
    if (priorityOrder[a.status] !== priorityOrder[b.status]) return priorityOrder[a.status] - priorityOrder[b.status];
    return TYPE_CONFIG[a.type].priority - TYPE_CONFIG[b.type].priority || a.token - b.token;
  });

  const filtered = filter === "all" ? sorted : sorted.filter(t => t.status === filter);

  const todayDate = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <style>{STYLES}</style>

      {/* ── TOPBAR ── */}
      <div className="opd-top">
        <div className="opd-top-left">
          <div className="opd-logo">
            <div className="opd-logo-dot">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <span className="opd-logo-text">OPD Queue</span>
          </div>
          <div className="opd-divider"/>
          <span className="opd-page-title">Token Management</span>
        </div>
        <div className="opd-top-right">
          <span className="opd-date">{todayDate}</span>
          <span className="opd-clock">{clock}</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowDisplay(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Display Mode
          </button>
          <button className="btn btn-outline btn-sm" style={{ color: "rgba(255,255,255,.6)", borderColor: "rgba(255,255,255,.15)" }} onClick={() => router.back()}>← Back</button>
        </div>
      </div>

      <div className="opd-body">
        {/* ── LEFT: REGISTER + STATS ── */}
        <div className="opd-left">
          {/* Stats */}
          <div className="opd-stats">
            {[
              { val: tokens.length,      lbl: "Total",      color: "#0f172a" },
              { val: waiting.length,     lbl: "Waiting",    color: "#d97706" },
              { val: withDoctor.length,  lbl: "With Doctor",color: "#059669" },
              { val: done.length,        lbl: "Done",       color: "#94a3b8" },
            ].map((s, i) => (
              <div className="opd-stat" key={i}>
                <div className="opd-stat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="opd-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Current Token */}
          <div className="opd-current">
            <div className="opd-current-label">Now Calling</div>
            {calling ? (
              <>
                <div className="opd-current-num">#{String(calling.token).padStart(3, "0")}</div>
                <div className="opd-current-name">{calling.name}</div>
                <div className="opd-current-doc">{calling.doctor}</div>
                <div className="opd-current-badge">
                  <span className="opd-tag" style={{ background: TYPE_CONFIG[calling.type].bg, color: TYPE_CONFIG[calling.type].color, padding: "2px 8px" }}>{calling.type}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, position: "relative", zIndex: 1 }}>
                  <button className="opd-act-btn btn-done" onClick={() => updateStatus(calling.id, "with-doctor")} style={{ flex: 1 }}>→ With Doctor</button>
                  <button className="opd-act-btn btn-skip" onClick={() => updateStatus(calling.id, "skipped")} style={{ flex: 1 }}>Skip</button>
                </div>
              </>
            ) : (
              <div className="opd-no-current">
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🏥</div>
                No token currently being called.<br />
                <span style={{ fontSize: 12, opacity: .6 }}>Call the next patient to begin.</span>
              </div>
            )}
          </div>

          {/* Register Form */}
          <div className="opd-reg-head">
            <div className="opd-section-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Register New Patient
            </div>
            <div className="opd-form">
              <div className="opd-fg">
                <label className="opd-label">Patient Name *</label>
                <input className="opd-input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && registerToken()} />
              </div>
              <div className="opd-row2">
                <div className="opd-fg">
                  <label className="opd-label">Phone</label>
                  <input className="opd-input" placeholder="Mobile number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="opd-fg">
                  <label className="opd-label">Type</label>
                  <div className="opd-type-grid">
                    {(["General", "Emergency", "Follow-up", "Senior Citizen"] as Token["type"][]).map(t => (
                      <button key={t} className={`opd-type-btn${form.type === t ? " selected" : ""}`}
                        style={form.type === t ? { background: TYPE_CONFIG[t].bg, color: TYPE_CONFIG[t].color, borderColor: TYPE_CONFIG[t].border } : {}}
                        onClick={() => setForm(f => ({ ...f, type: t }))}>
                        {t === "Senior Citizen" ? "Senior" : t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="opd-fg">
                <label className="opd-label">Doctor</label>
                <select className="opd-input" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))}>
                  {DOCTORS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="opd-fg">
                <label className="opd-label">Note (optional)</label>
                <input className="opd-input" placeholder="e.g. Wheelchair, interpreter needed…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <button className="opd-reg-btn" onClick={registerToken}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Issue Token #{tokenCounter}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: QUEUE ── */}
        <div className="opd-right">
          <div className="opd-queue-head">
            <div className="opd-section-label" style={{ margin: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 15, height: 15, color: "#0d9488" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Patient Queue
              <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 20 }}>{waiting.length} waiting</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {waiting.length > 0 && !calling && (
                <button className="btn btn-primary btn-sm" onClick={() => {
                  const next = waiting.sort((a, b) => TYPE_CONFIG[a.type].priority - TYPE_CONFIG[b.type].priority || a.token - b.token)[0];
                  if (next) updateStatus(next.id, "calling");
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  Call Next
                </button>
              )}
              <button className="btn btn-outline btn-sm" style={{ color: "#dc2626", borderColor: "#fecdd3" }} onClick={resetDay}>Reset Day</button>
            </div>
          </div>

          {/* Filters */}
          <div className="opd-queue-filters">
            {(["all", "waiting", "calling", "with-doctor", "done", "skipped"] as const).map(f => (
              <button key={f} className={`opd-filter-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f === "with-doctor" ? "With Doctor" : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && <span style={{ marginLeft: 5, opacity: .7 }}>({tokens.filter(t => t.status === f).length})</span>}
              </button>
            ))}
          </div>

          {/* Queue List */}
          <div className="opd-queue-list">
            {filtered.length === 0 ? (
              <div className="opd-empty">
                <div className="opd-empty-ico">🏥</div>
                <h4>No patients in queue</h4>
                <p>Register a new patient to get started.</p>
              </div>
            ) : (
              filtered.map((t, i) => (
                <div key={t.id} className={`opd-token-card status-${t.status}`} style={{ animationDelay: `${i * 35}ms` }}>
                  {/* Token Number Badge */}
                  <div className={`opd-token-badge ${t.status === "done" ? "done" : t.status === "calling" ? "calling" : t.status === "with-doctor" ? "with-doctor" : t.status === "skipped" ? "skipped" : ""}`}>
                    #{String(t.token).padStart(3, "0")}
                  </div>
                  <div className="opd-token-info">
                    <div className="opd-token-name">{t.name}</div>
                    <div className="opd-token-meta">
                      {t.doctor.split("(")[0].trim()} · {t.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {t.phone && ` · ${t.phone}`}
                    </div>
                    <div className="opd-token-tags">
                      <span className="opd-tag" style={{ background: TYPE_CONFIG[t.type].bg, color: TYPE_CONFIG[t.type].color }}>{t.type}</span>
                      <span className="opd-tag" style={{ background: STATUS_CONFIG[t.status].bg, color: STATUS_CONFIG[t.status].color }}>{STATUS_CONFIG[t.status].label}</span>
                      {t.note && <span className="opd-tag" style={{ background: "#f1f5f9", color: "#64748b" }}>📝 {t.note}</span>}
                    </div>
                  </div>
                  <div className="opd-token-actions">
                    {t.status === "waiting" && <button className="opd-act-btn btn-call" onClick={() => updateStatus(t.id, "calling")}>📢 Call</button>}
                    {t.status === "calling" && <button className="opd-act-btn btn-done" onClick={() => updateStatus(t.id, "with-doctor")}>→ Dr.</button>}
                    {t.status === "with-doctor" && <button className="opd-act-btn btn-done" onClick={() => updateStatus(t.id, "done")}>✓ Done</button>}
                    {(t.status === "skipped") && <button className="opd-act-btn btn-recall" onClick={() => updateStatus(t.id, "waiting")}>↩ Recall</button>}
                    {(t.status === "waiting" || t.status === "calling") && <button className="opd-act-btn btn-skip" onClick={() => updateStatus(t.id, "skipped")}>Skip</button>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══ DISPLAY MODE (TV Screen) ══ */}
      {showDisplay && (
        <div className="opd-display">
          {/* Header */}
          <div className="opd-display-head">
            <div className="opd-display-clinic">🏥 &nbsp;OPD Token Display</div>
            <div className="opd-display-clock">{clock}</div>
          </div>

          <div className="opd-display-body">
            {/* ── Left: Now Calling ── */}
            <div className="opd-display-main">
              <div className="opd-display-label">Now Calling</div>
              {calling ? (
                <>
                  <div className="opd-display-token-wrap">
                    <div className="opd-display-token">
                      #{String(calling.token).padStart(3, "0")}
                    </div>
                  </div>
                  <div className="opd-display-pname">{calling.name}</div>
                  <div className="opd-display-pdoc">{calling.doctor}</div>
                  <div className="opd-display-type-badge" style={{ background: TYPE_CONFIG[calling.type].bg, color: TYPE_CONFIG[calling.type].color }}>
                    {calling.type}
                  </div>
                </>
              ) : (
                <div style={{ color: "rgba(255,255,255,.2)", textAlign: "center", zIndex: 1, position: "relative" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 16, opacity: .4 }}>——</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Please wait…</div>
                  <div style={{ fontSize: 12, marginTop: 6, opacity: .5 }}>No token currently being called</div>
                </div>
              )}
            </div>

            {/* ── Right: Queue Preview ── */}
            <div className="opd-display-side">
              <div className="opd-display-side-title">
                Up Next — {waiting.length} Waiting
              </div>
              {waiting.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,.18)", fontSize: 14, textAlign: "center", marginTop: 48, fontWeight: 600 }}>
                  No patients waiting
                </div>
              ) : (
                waiting.slice(0, 10).map((t, idx) => (
                  <div key={t.id} className="opd-display-queue-item">
                    <div className="opd-display-qnum">
                      #{String(t.token).padStart(3, "0")}
                    </div>
                    <div className="opd-display-qinfo">
                      <div className="opd-display-qname">{t.name}</div>
                      <div className="opd-display-qtype">{t.doctor.split("(")[0].trim()}</div>
                    </div>
                    <span style={{
                      padding: "4px 10px", borderRadius: 6,
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                      background: TYPE_CONFIG[t.type].bg,
                      color: TYPE_CONFIG[t.type].color,
                      whiteSpace: "nowrap",
                    }}>
                      {t.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Close */}
          <button className="opd-display-close" onClick={() => setShowDisplay(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`opd-toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}