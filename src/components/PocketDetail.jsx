import { useEffect, useState } from "react";
import { getPocketDetail, getPocketTransactions, deletePocket } from "../lib/queries";
import "../styles/pocketmaster.css";

const fmt = (n) => "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");

const pad = (n) => n.toString().padStart(2, "0");

function formatDate(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const CATEGORY_COLORS = [
  "#FF5C7A",
  "#22D3EE",
  "#7F77DD",
  "#FFB84D",
  "#34F5A0",
  "#5B7180",
];

function pocketColor(type) {
  if (type === "bank") return "#22D3EE";
  if (type === "emoney") return "#7F77DD";
  return "#34F5A0";
}

function pocketIcon(type) {
  if (type === "bank") return "ti-building-bank";
  if (type === "emoney") return "ti-device-mobile";
  return "ti-cash";
}

function CategoryDonut({ segments, active, onActivate, onClear, size = 96 }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const activeSeg = segments.find((s) => s.name === active);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1C2830" strokeWidth="12" />
        {segments.map((s, i) => {
          const len = (s.pct / 100) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={active === s.name ? 14 : 12}
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onActivate(s.name)}
              onMouseLeave={onClear}
              onClick={() => onActivate(s.name)}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          textAlign: "center",
          padding: "0 8px",
        }}
      >
        {activeSeg ? (
          <>
            <p style={{ fontSize: 10, color: "var(--pm-text-secondary)", margin: "0 0 2px" }}>{activeSeg.name}</p>
            <p className="pm-num" style={{ fontSize: 12, fontWeight: 700, margin: 0, color: "var(--pm-text-primary)" }}>
              {fmt(activeSeg.amount)}
            </p>
          </>
        ) : (
          <i className="ti ti-chart-donut" style={{ fontSize: 20, color: "var(--pm-text-muted)" }} />
        )}
      </div>
    </div>
  );
}

function DailyBarChart({ dailyFlow }) {
  if (dailyFlow.length === 0) {
    return (
      <p style={{ fontSize: 12, color: "var(--pm-text-secondary)", textAlign: "center", padding: "20px 0" }}>
        No transactions this month
      </p>
    );
  }

  const maxVal = Math.max(
    ...dailyFlow.map((d) => Math.max(d.income, d.expense)),
    1
  );

  const width = 340;
  const height = 110;
  const baseline = 55;
  const maxBarHeight = 45;
  const barWidth = Math.max(4, Math.min(10, width / dailyFlow.length - 4));
  const gap = dailyFlow.length > 1 ? (width - barWidth) / (dailyFlow.length - 1) : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 110 }}>
      <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="#1C2830" strokeWidth="1" />
      {dailyFlow.map((d, i) => {
        const x = i * gap;
        const incomeH = (d.income / maxVal) * maxBarHeight;
        const expenseH = (d.expense / maxVal) * maxBarHeight;
        return (
          <g key={d.date}>
            {d.income > 0 && (
              <rect x={x} y={baseline - incomeH} width={barWidth} height={incomeH} fill="#34F5A0" />
            )}
            {d.expense > 0 && (
              <rect x={x} y={baseline} width={barWidth} height={expenseH} fill="#FF5C7A" />
            )}
          </g>
        );
      })}
      {dailyFlow.map((d, i) => {
        if (i !== 0 && i !== dailyFlow.length - 1 && i % Math.ceil(dailyFlow.length / 4) !== 0) {
          return null;
        }
        const x = i * gap;
        const day = new Date(d.date).getDate();
        return (
          <text key={d.date} x={x} y={height - 5} fontSize="8" fill="#5B7180">
            {day}
          </text>
        );
      })}
    </svg>
  );
}

export default function PocketDetail({ pocketId, onBack, onOpenTransaction, onDeleted }) {
  const [detail, setDetail] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getPocketDetail(pocketId),
      getPocketTransactions(pocketId, 30),
    ])
      .then(([d, tx]) => {
        if (!mounted) return;
        setDetail(d);
        setTransactions(tx);
      })
      .catch((error) => {
        console.error("Failed loading pocket detail:", error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pocketId]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePocket(pocketId);
      onDeleted?.();
    } catch (error) {
      console.error("Failed deleting pocket:", error);
      setDeleteError(
        error?.message ||
          "Failed to delete pocket. It may still have transactions attached to it."
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="pm-app">
        <p style={{ color: "var(--pm-text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (!detail || !detail.pocket) {
    return (
      <div className="pm-app">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--pm-text-primary)" }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 22 }} />
        </button>
        <p style={{ color: "var(--pm-text-secondary)" }}>Pocket not found.</p>
      </div>
    );
  }

  const { pocket, income, expense, incomeCount, expenseCount, categoryBreakdown, dailyFlow } = detail;

  const categorySlices = categoryBreakdown.map((c, i) => ({
    ...c,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="pm-app">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--pm-text-primary)", cursor: "pointer" }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 22 }} />
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--pm-bg)",
            border: `1px solid ${pocketColor(pocket.type)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: pocketColor(pocket.type),
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          <i className={`ti ${pocketIcon(pocket.type)}`} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--pm-text-primary)" }}>{pocket.name}</p>
          <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", margin: 0 }}>
            {pocket.type === "bank" ? "Bank Account" : pocket.type === "emoney" ? "E-money" : "Cash"}
          </p>
        </div>
        <button
          onClick={() => setConfirmingDelete((v) => !v)}
          style={{
            background: "none",
            border: "none",
            color: "var(--pm-danger)",
            cursor: "pointer",
            padding: 6,
          }}
        >
          <i className="ti ti-trash" style={{ fontSize: 19 }} />
        </button>
      </div>

      {confirmingDelete && (
        <div
          style={{
            background: "rgba(255,92,122,0.08)",
            border: "1px solid rgba(255,92,122,0.3)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <p style={{ fontSize: 13, margin: "0 0 4px", color: "var(--pm-text-primary)" }}>Delete this pocket?</p>
          <p style={{ fontSize: 12, color: "var(--pm-text-secondary)", margin: "0 0 12px" }}>
            This cannot be undone. Pockets with existing transactions cannot be deleted.
          </p>
          {deleteError && (
            <p style={{ fontSize: 12, color: "var(--pm-danger)", margin: "0 0 10px" }}>{deleteError}</p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              style={{
                flex: 1,
                background: "var(--pm-surface)",
                border: "1px solid var(--pm-border)",
                borderRadius: 10,
                padding: "10px",
                color: "var(--pm-text-primary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1,
                background: "rgba(255,92,122,0.15)",
                border: "1px solid var(--pm-danger)",
                borderRadius: 10,
                padding: "10px",
                color: "var(--pm-danger)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      <div className="pm-card pm-card-hud" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", margin: "0 0 4px" }}>Current balance</p>
        <p className="pm-num" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 14px", color: "var(--pm-text-primary)" }}>
          {fmt(pocket.balance)}
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: "var(--pm-bg)", border: "1px solid var(--pm-border)", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ fontSize: 10, color: "var(--pm-text-secondary)", margin: "0 0 4px" }}>Income this month</p>
            <p className="pm-num" style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--pm-success)" }}>{fmt(income)}</p>
            <p style={{ fontSize: 10, color: "var(--pm-text-secondary)", margin: "2px 0 0" }}>{incomeCount}x transactions</p>
          </div>
          <div style={{ flex: 1, background: "var(--pm-bg)", border: "1px solid var(--pm-border)", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ fontSize: 10, color: "var(--pm-text-secondary)", margin: "0 0 4px" }}>Expense this month</p>
            <p className="pm-num" style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--pm-danger)" }}>{fmt(expense)}</p>
            <p style={{ fontSize: 10, color: "var(--pm-text-secondary)", margin: "2px 0 0" }}>{expenseCount}x transactions</p>
          </div>
        </div>
      </div>

      <div className="pm-card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "var(--pm-text-primary)" }}>Expense by category</p>
          <p className="pm-num" style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--pm-text-primary)" }}>{fmt(expense)}</p>
        </div>
        {categorySlices.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--pm-text-secondary)", textAlign: "center", padding: "10px 0" }}>
            No expenses this month
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <CategoryDonut
              segments={categorySlices}
              active={activeCategory}
              onActivate={setActiveCategory}
              onClear={() => setActiveCategory(null)}
            />
            <div style={{ flex: 1 }}>
              {categorySlices.map((c) => (
                <div
                  key={c.name}
                  onMouseEnter={() => setActiveCategory(c.name)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onClick={() => setActiveCategory(c.name)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    cursor: "pointer",
                    opacity: activeCategory && activeCategory !== c.name ? 0.5 : 1,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--pm-text-primary)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                    {c.name}
                  </span>
                  <span className="pm-num" style={{ fontSize: 12, color: "var(--pm-text-secondary)" }}>{c.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pm-card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "var(--pm-text-primary)" }}>Daily cash flow</p>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--pm-text-secondary)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--pm-success)", display: "inline-block" }} />
              In
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--pm-text-secondary)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--pm-danger)", display: "inline-block" }} />
              Out
            </span>
          </div>
        </div>
        <DailyBarChart dailyFlow={dailyFlow} />
      </div>

      <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", margin: "0 0 8px", paddingLeft: 2 }}>Transaction history</p>

      {transactions.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--pm-text-secondary)", textAlign: "center", padding: "20px 0" }}>
          No transactions yet
        </p>
      )}

      {transactions.map((tx) => {
        const isIncome = tx.type === "income";
        return (
          <button
            key={tx.id}
            type="button"
            onClick={() => onOpenTransaction?.(tx)}
            className="pm-card"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
              textAlign: "left",
              border: "1px solid var(--pm-border)",
              cursor: "pointer",
              color: "inherit",
              boxSizing: "border-box",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, margin: 0, color: "var(--pm-text-primary)" }}>
                {tx.category?.name || (tx.type === "transfer" ? "Transfer" : "Lainnya")}
                {tx.description ? ` · ${tx.description}` : ""}
              </p>
              <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", margin: "2px 0 0" }}>
                {formatDate(new Date(tx.date))}
              </p>
            </div>
            <p
              className="pm-num"
              style={{
                fontSize: 14,
                fontWeight: 700,
                margin: 0,
                flexShrink: 0,
                color: isIncome ? "var(--pm-success)" : tx.type === "expense" ? "var(--pm-danger)" : "var(--pm-text-primary)",
              }}
            >
              {isIncome ? "+" : tx.type === "expense" ? "-" : ""}
              {fmt(tx.amount)}
            </p>
            <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--pm-text-secondary)", flexShrink: 0 }} />
          </button>
        );
      })}

      <div style={{ height: 40 }} />
    </div>
  );
}
