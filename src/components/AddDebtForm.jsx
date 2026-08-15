import { useState } from "react";
import { addDebt } from "../lib/queries";
import "../styles/pocketmaster.css";

export default function AddDebtForm({ onCancel, onSaved }) {
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [monthlyInstallment, setMonthlyInstallment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = name && Number(totalAmount) > 0;

  async function handleSave() {
    setSaving(true);
    try {
      await addDebt({ name, totalAmount, monthlyInstallment, dueDay });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pm-app">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, position: "relative" }}>
        <button onClick={onCancel} style={{ position: "absolute", left: 0, background: "none", border: "none", color: "var(--pm-text-primary)" }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 22 }} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 600, margin: 0, textAlign: "center", width: "100%" }}>New Debt Account</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--pm-text-muted)", textAlign: "center", margin: "0 0 28px", lineHeight: 1.5 }}>
        This isn't a pocket — a debt account is just a record<br />of an obligation that decreases each time you pay
      </p>

      <p className="pm-label">Debt name</p>
      <input className="pm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Motorcycle Installment" style={{ marginBottom: 16, boxSizing: "border-box" }} />

      <p className="pm-label">Total principal amount</p>
      <input type="number" className="pm-input" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="Rp0" style={{ marginBottom: 16, boxSizing: "border-box" }} />

      <p className="pm-label">Monthly installment <span style={{ color: "var(--pm-text-muted)" }}>· optional</span></p>
      <input type="number" className="pm-input" value={monthlyInstallment} onChange={(e) => setMonthlyInstallment(e.target.value)} placeholder="Rp0" style={{ marginBottom: 16, boxSizing: "border-box" }} />

      <p className="pm-label">Due date (day of month) <span style={{ color: "var(--pm-text-muted)" }}>· optional</span></p>
      <input type="number" min="1" max="31" className="pm-input" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="e.g. 15" style={{ marginBottom: 32, boxSizing: "border-box" }} />

      <button className="pm-btn-primary" onClick={handleSave} disabled={!canSave || saving}>Save Debt Account</button>
    </div>
  );
}