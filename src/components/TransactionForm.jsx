import { useEffect, useState } from "react";
import { getPockets, getCategories, getDebts, addTransaction } from "../lib/queries";
import "../styles/pocketmaster.css";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Credit" },
  { value: "qris", label: "QRIS" },
  { value: "cash", label: "Tunai" },
];

export default function TransactionForm({ onCancel, onSaved }) {
  const [type, setType] = useState("expense");
  const [pockets, setPockets] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [debts, setDebts] = useState([]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  // income
  const [toPocketId, setToPocketId] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [incomeCategoryId, setIncomeCategoryId] = useState("");

  // expense
  const [fromPocketId, setFromPocketId] = useState("");
  const [payee, setPayee] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [debtId, setDebtId] = useState("");

  // transfer
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const [feeEnabled, setFeeEnabled] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [feePocketId, setFeePocketId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPockets().then(setPockets);
    getCategories("income").then(setIncomeCategories);
    getCategories("expense").then(setExpenseCategories);
    getDebts().then(setDebts);
  }, []);

  const selectedExpenseCategory = expenseCategories.find((c) => c.id === expenseCategoryId);
  const isDebtCategory = selectedExpenseCategory?.name === "Hutang";
  const selectedDebt = debts.find((d) => d.debt_id === debtId);
  const debtExceeded = isDebtCategory && selectedDebt && Number(amount) > Number(selectedDebt.remaining);

  const isValid =
    Number(amount) > 0 &&
    (type === "income"
      ? toPocketId && sourceText && incomeCategoryId
      : type === "expense"
      ? fromPocketId && expenseCategoryId && !(isDebtCategory && (!debtId || debtExceeded))
      : transferFrom && transferTo && transferFrom !== transferTo);

  async function handleSave() {
    setSaving(true);
    try {
      const base = {
        type,
        amount,
        description,
        date,
        paymentMethod,
        feeAmount: feeEnabled ? feeAmount : null,
        feePocketId: feeEnabled ? feePocketId : null,
      };
      if (type === "income") {
        await addTransaction({ ...base, toPocketId, sourceText, categoryId: incomeCategoryId });
      } else if (type === "expense") {
        await addTransaction({ ...base, fromPocketId, payee, categoryId: expenseCategoryId, debtId: isDebtCategory ? debtId : null });
      } else {
        await addTransaction({ ...base, fromPocketId: transferFrom, toPocketId: transferTo });
      }
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  const typeColor = { income: "var(--pm-success)", expense: "var(--pm-danger)", transfer: "var(--pm-accent)" }[type];

  return (
    <div className="pm-app">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--pm-text-primary)", fontSize: 20 }}>×</button>
        <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Transaksi Baru</p>
        <button onClick={handleSave} disabled={!isValid || saving} style={{ background: "none", border: "none", color: isValid ? "var(--pm-accent)" : "var(--pm-text-muted)", fontWeight: 600, fontSize: 14 }}>Simpan</button>
      </div>

      <div className="pm-segmented" style={{ marginBottom: 24 }}>
        <button className={type === "income" ? "active-income" : ""} onClick={() => setType("income")}>Pemasukan</button>
        <button className={type === "expense" ? "active-expense" : ""} onClick={() => setType("expense")}>Pengeluaran</button>
        <button className={type === "transfer" ? "active-transfer" : ""} onClick={() => setType("transfer")}>Pindah Pocket</button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Rp0"
          style={{ background: "none", border: "none", outline: "none", color: typeColor, fontSize: 38, fontWeight: 600, textAlign: "center", width: "100%", fontFamily: "inherit" }}
        />
      </div>
      {type !== "transfer" && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi transaksi" style={{ background: "none", border: "none", outline: "none", color: "var(--pm-text-primary)", fontSize: 15, textAlign: "center", width: "100%", fontFamily: "inherit" }} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
        <i className="ti ti-calendar" style={{ fontSize: 14, color: "var(--pm-text-muted)" }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "var(--pm-text-muted)", fontSize: 13, fontFamily: "inherit" }} />
      </div>

      {type === "income" && (
        <>
          <Field label="Masuk ke pocket">
            <select className="pm-select" value={toPocketId} onChange={(e) => setToPocketId(e.target.value)}>
              <option value="">Pilih pocket</option>
              {pockets.map((p) => <option key={p.pocket_id} value={p.pocket_id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Sumber dana" hint="Bebas isi, bukan dari pocket manapun">
            <input className="pm-input" value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Contoh: Gaji dari Kantor ABC" />
          </Field>
          <Field label="Kategori">
            <select className="pm-select" value={incomeCategoryId} onChange={(e) => setIncomeCategoryId(e.target.value)}>
              <option value="">Pilih kategori</option>
              {incomeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </>
      )}

      {type === "expense" && (
        <>
          <Field label="Dari pocket">
            <select className="pm-select" value={fromPocketId} onChange={(e) => setFromPocketId(e.target.value)}>
              <option value="">Pilih pocket</option>
              {pockets.map((p) => <option key={p.pocket_id} value={p.pocket_id}>{p.name} · {"Rp" + Number(p.balance).toLocaleString("id-ID")}</option>)}
            </select>
          </Field>
          <Field label="Untuk siapa">
            <input className="pm-input" value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="Contoh: Warung Bu Siti" />
          </Field>
          <Field label="Kategori">
            <select className="pm-select" value={expenseCategoryId} onChange={(e) => { setExpenseCategoryId(e.target.value); setDebtId(""); }}>
              <option value="">Pilih kategori</option>
              {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          {isDebtCategory && (
            <div style={{ background: "rgba(255,107,82,0.08)", border: "1px solid rgba(255,107,82,0.3)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 13, margin: "0 0 8px" }}>Bayar hutang yang mana?</p>
              <select className="pm-select" style={{ background: "var(--pm-surface-2)" }} value={debtId} onChange={(e) => setDebtId(e.target.value)}>
                <option value="">Pilih hutang</option>
                {debts.map((d) => <option key={d.debt_id} value={d.debt_id}>{d.name} · sisa Rp{Number(d.remaining).toLocaleString("id-ID")}</option>)}
              </select>
              {debtExceeded && <p style={{ fontSize: 11, color: "var(--pm-danger)", margin: "8px 0 0" }}>⚠ Jumlah tidak boleh melebihi sisa hutang</p>}
            </div>
          )}
        </>
      )}

      {type === "transfer" && (
        <>
          <Field label="Dari pocket">
            <select className="pm-select" value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}>
              <option value="">Pilih pocket</option>
              {pockets.map((p) => <option key={p.pocket_id} value={p.pocket_id}>{p.name} · {"Rp" + Number(p.balance).toLocaleString("id-ID")}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", justifyContent: "center", margin: "-6px 0 10px" }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--pm-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-arrow-down" style={{ fontSize: 16, color: "var(--pm-accent)" }} />
            </span>
          </div>
          <Field label="Ke pocket">
            <select className="pm-select" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
              <option value="">Pilih pocket</option>
              {pockets.map((p) => <option key={p.pocket_id} value={p.pocket_id}>{p.name} · {"Rp" + Number(p.balance).toLocaleString("id-ID")}</option>)}
            </select>
          </Field>
        </>
      )}

      <div className="pm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>Ada biaya transaksi?</span>
        <button className={`pm-toggle ${feeEnabled ? "on" : "off"}`} onClick={() => setFeeEnabled((v) => !v)}>
          <span className="knob" />
        </button>
      </div>
      {feeEnabled && (
        <div className="pm-card" style={{ marginTop: 8 }}>
          <input type="number" className="pm-input" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="Jumlah biaya" style={{ marginBottom: 10 }} />
          <select className="pm-select" style={{ background: "var(--pm-bg)" }} value={feePocketId} onChange={(e) => setFeePocketId(e.target.value)}>
            <option value="">Dipotong dari pocket mana</option>
            {pockets.map((p) => <option key={p.pocket_id} value={p.pocket_id}>{p.name}</option>)}
          </select>
        </div>
      )}

      <Field label="Metode pembayaran" style={{ marginTop: 16 }}>
        <select className="pm-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, hint, children, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <p className="pm-label">{label}</p>
      {children}
      {hint && <p style={{ fontSize: 12, color: "var(--pm-text-muted)", margin: "6px 0 0" }}>{hint}</p>}
    </div>
  );
}
