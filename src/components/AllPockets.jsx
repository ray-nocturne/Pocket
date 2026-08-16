import { useEffect, useState } from "react";
import { getDashboardData } from "../lib/queries";
import { useCurrency } from "../lib/CurrencyContext";
import TabBar from "./TabBar";
import "../styles/pocketmaster.css";

const fmt = (n, formatMoney) => formatMoney(n);

function typeLabel(type) {
  return { bank: "Bank Account", emoney: "E-money", cash: "Cash" }[type] ?? type;
}

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

const TYPE_ORDER = ["bank", "emoney", "cash"];

export default function AllPockets({ onOpenPocket, onAddPocket, onHome, onOpenCategory, onBudget, onOpenProfile }) {
  const { formatMoney } = useCurrency();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getDashboardData()
      .then((d) => {
        if (mounted) setData(d);
      })
      .catch((error) => {
        console.error("Failed loading pockets:", error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="pm-app">
        <p style={{ color: "var(--pm-text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  const pockets = data?.pockets || [];
  const totalBalance = data?.totalBalance || 0;

  const grouped = TYPE_ORDER
    .map((type) => ({
      type,
      items: pockets.filter((p) => p.type === type),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="pm-app">
      <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px", color: "var(--pm-text-primary)" }}>
        All Pockets
      </p>

      <div className="pm-card pm-card-hud" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", margin: "0 0 4px" }}>Total across all pockets</p>
        <p className="pm-num" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--pm-text-primary)", textAlign: "right" }}>
          {fmt(totalBalance, formatMoney)}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button
          onClick={onAddPocket}
          style={{
            background: "rgba(34,211,238,0.15)",
            border: "1px solid var(--pm-accent)",
            borderRadius: 8,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "var(--pm-accent)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Add pocket
        </button>
      </div>

      {pockets.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--pm-text-secondary)", textAlign: "center", padding: "20px 0" }}>
          No pockets yet
        </p>
      )}

      {grouped.map((g) => (
        <div key={g.type} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>
            {typeLabel(g.type)}
          </p>

          {g.items.map((p) => (
            <button
              key={p.pocket_id}
              onClick={() => onOpenPocket?.(p.pocket_id)}
              className="pm-card"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
                textAlign: "left",
                border: "1px solid var(--pm-border)",
                cursor: "pointer",
                color: "inherit",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--pm-bg)",
                  border: `1px solid ${pocketColor(p.type)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: pocketColor(p.type),
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                <i className={`ti ${pocketIcon(p.type)}`} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, margin: 0, color: "var(--pm-text-primary)" }}>{p.name}</p>
                <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", margin: "2px 0 0" }}>
                  {(p.incomeCount || 0) + (p.expenseCount || 0)} transactions this month
                </p>
              </div>

              <p className="pm-num" style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--pm-text-primary)", whiteSpace: "nowrap" }}>
                {p.balance < 0 ? "-" : ""}
                {fmt(p.balance, formatMoney)}
              </p>

              <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--pm-text-secondary)", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      ))}

      <div style={{ height: 20 }} />

      <TabBar
        active="pocket"
        onHome={onHome}
        onPocket={() => {}}
        onCategory={onOpenCategory}
        onBudget={onBudget}
        onProfile={onOpenProfile}
      />
    </div>
  );
}
