import { useEffect, useState } from "react";
import { getProviders, addPocket } from "../lib/queries";
import "../styles/pocketmaster.css";

export default function AddPocketFlow({ onCancel, onSaved }) {
  const [step, setStep] = useState("type"); // type | bank | emoney | cash

  if (step === "type") return <ChooseType onBack={onCancel} onSelect={setStep} />;
  if (step === "bank") return <ChooseBank onBack={() => setStep("type")} onSaved={onSaved} />;
  if (step === "emoney") return <ChooseEmoney onBack={() => setStep("type")} onSaved={onSaved} />;
  if (step === "cash") return <CashForm onBack={() => setStep("type")} onSaved={onSaved} />;
  return null;
}

function Header({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 20, position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", left: 0, background: "none", border: "none", color: "var(--pm-text-primary)" }}>
        <i className="ti ti-chevron-left" style={{ fontSize: 22 }} />
      </button>
      <p style={{ fontSize: 15, fontWeight: 600, margin: 0, textAlign: "center", width: "100%" }}>{title}</p>
    </div>
  );
}

function ChooseType({ onBack, onSelect }) {
  const options = [
    { key: "bank", icon: "ti-building-bank", color: "#0A84FF", title: "Bank Account", sub: "Any bank account" },
    { key: "emoney", icon: "ti-wallet", color: "#7F77DD", title: "E-money", sub: "GoPay, OVO, Dana, ShopeePay" },
    { key: "cash", icon: "ti-cash", color: "#30D158", title: "Cash / Wallet", sub: "Cash" },
  ];
  return (
    <div className="pm-app">
      <Header title="Pocket Type" onBack={onBack} />
      {options.map((o) => (
        <button key={o.key} onClick={() => onSelect(o.key)} className="pm-card" style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, marginBottom: 12, border: "none", cursor: "pointer", boxSizing: "border-box" }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: `${o.color}26`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className={`ti ${o.icon}`} style={{ fontSize: 20, color: o.color }} />
          </span>
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>{o.title}</p>
            <p style={{ fontSize: 13, color: "var(--pm-text-secondary)", margin: 0 }}>{o.sub}</p>
          </div>
          <i className="ti ti-chevron-right" style={{ fontSize: 18, color: "var(--pm-text-muted)" }} />
        </button>
      ))}
    </div>
  );
}

function ChooseBank({ onBack, onSaved }) {
  const [banks, setBanks] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [manual, setManual] = useState("");
  const [nickname, setNickname] = useState("");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { getProviders("bank").then(setBanks); }, []);

  const filtered = banks.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));
  const providerName = selected === "manual" ? manual : selected;
  const canSave = !!providerName;

  async function handleSave() {
    setSaving(true);
    try {
      await addPocket({ type: "bank", providerName, name: nickname, initialBalance: balance });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pm-app">
      <Header title="Choose Bank" onBack={onBack} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--pm-surface)", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
        <i className="ti ti-search" style={{ fontSize: 16, color: "var(--pm-text-muted)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bank..." style={{ background: "none", border: "none", outline: "none", color: "var(--pm-text-primary)", fontSize: 14, flex: 1 }} />
      </div>

      <div className="pm-card" style={{ padding: 0, marginBottom: 20 }}>
        {filtered.map((b) => (
          <button key={b.id} onClick={() => setSelected(b.name)} className="pm-row" style={{ width: "100%", border: "none", background: selected === b.name ? "var(--pm-accent-bg)" : "none", cursor: "pointer", padding: "13px 14px", boxSizing: "border-box" }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pm-surface-2)", flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 14, color: selected === b.name ? "var(--pm-accent)" : "var(--pm-text-primary)" }}>{b.name}</span>
            {selected === b.name && <i className="ti ti-check" style={{ color: "var(--pm-accent)" }} />}
          </button>
        ))}
        <button onClick={() => setSelected("manual")} className="pm-row" style={{ width: "100%", border: "none", background: selected === "manual" ? "var(--pm-accent-bg)" : "none", cursor: "pointer", padding: "13px 14px", boxSizing: "border-box" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--pm-accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-plus" style={{ fontSize: 14, color: "var(--pm-accent)" }} />
          </span>
          <span style={{ flex: 1, textAlign: "left", fontSize: 14, color: "var(--pm-accent)" }}>Other bank</span>
        </button>
      </div>

      {selected === "manual" && (
        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Bank name" className="pm-input" style={{ marginBottom: 16, boxSizing: "border-box" }} />
      )}

      <p className="pm-label">Pocket name <span style={{ color: "var(--pm-text-muted)" }}>· optional</span></p>
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. BCA Savings" className="pm-input" style={{ marginBottom: 16, boxSizing: "border-box" }} />

      <p className="pm-label">Initial balance</p>
      <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Rp0" className="pm-input" style={{ marginBottom: 6, boxSizing: "border-box" }} />
      <p style={{ fontSize: 12, color: "var(--pm-text-muted)", margin: "0 0 24px" }}>Can be left blank, defaults to 0</p>

      <button className="pm-btn-primary" onClick={handleSave} disabled={!canSave || saving}>Save Pocket</button>
    </div>
  );
}

function ChooseEmoney({ onBack, onSaved }) {
  const options = [
    { name: "GoPay", color: "#00AED6" },
    { name: "OVO", color: "#4C3494" },
    { name: "Dana", color: "#118EEA" },
    { name: "ShopeePay", color: "#EE4D2D" },
  ];
  const [selected, setSelected] = useState(null);
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await addPocket({ type: "emoney", providerName: selected, name: selected, initialBalance: balance });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pm-app">
      <Header title="Choose E-money" onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {options.map((o) => (
          <button key={o.name} onClick={() => setSelected(o.name)} className="pm-card" style={{ textAlign: "center", padding: "20px 14px", border: selected === o.name ? "1.5px solid var(--pm-accent)" : "1.5px solid transparent", cursor: "pointer" }}>
            <span style={{ width: 48, height: 48, borderRadius: 14, background: o.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <i className="ti ti-wallet" style={{ fontSize: 22, color: "#fff" }} />
            </span>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{o.name}</p>
          </button>
        ))}
      </div>
      <p className="pm-label">Initial balance</p>
      <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Rp0" className="pm-input" style={{ marginBottom: 24, boxSizing: "border-box" }} />
      <button className="pm-btn-primary" onClick={handleSave} disabled={!selected || saving}>Save Pocket</button>
    </div>
  );
}

function CashForm({ onBack, onSaved }) {
  const [name, setName] = useState("Cash Wallet");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await addPocket({ type: "cash", providerName: null, name, initialBalance: balance });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pm-app">
      <Header title="Cash / Wallet" onBack={onBack} />
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(48,209,88,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
          <i className="ti ti-cash" style={{ fontSize: 28, color: "var(--pm-success)" }} />
        </span>
      </div>
      <p className="pm-label">Pocket name</p>
      <input value={name} onChange={(e) => setName(e.target.value)} className="pm-input" style={{ marginBottom: 16, boxSizing: "border-box" }} />
      <p className="pm-label">Initial balance</p>
      <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Rp0" className="pm-input" style={{ marginBottom: 32, boxSizing: "border-box" }} />
      <button className="pm-btn-primary" onClick={handleSave} disabled={saving}>Save Pocket</button>
    </div>
  );
}