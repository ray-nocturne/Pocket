import { useEffect, useState } from "react";
import {
  getDebtDetail,
} from "../lib/queries";
import "../styles/pocketmaster.css";

const fmt = (n) =>
  "Rp" +
  Math.round(
    Math.abs(Number(n) || 0)
  ).toLocaleString("id-ID");

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function groupByDate(transactions) {
  const groups = {};

  for (const tx of transactions) {
    const key = tx.date || "unknown";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(tx);
  }

  return Object.entries(groups).sort(
    ([a], [b]) =>
      a < b ? 1 : a > b ? -1 : 0
  );
}

export default function DebtDetail({
  debtId,
  onBack,
  onOpenTransaction,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!debtId) {
      setError("Debt tidak ditemukan.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getDebtDetail(debtId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        console.error(
          "Debt detail loading error:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Failed to load debt detail."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debtId]);

  if (loading) {
    return (
      <div className="pm-app">
        <p
          style={{
            color:
              "var(--pm-text-secondary)",
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Loading...
        </p>
      </div>
    );
  }

  if (error || !data?.debt) {
    return (
      <div className="pm-app">
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border:
              "1px solid var(--pm-border)",
            background:
              "var(--pm-surface)",
            color:
              "var(--pm-text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <i
            className="ti ti-chevron-left"
            style={{ fontSize: 20 }}
          />
        </button>

        <div
          className="pm-card"
          style={{
            marginTop: 20,
            borderColor:
              "rgba(255,92,122,0.35)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--pm-danger)",
              fontSize: 13,
            }}
          >
            {error ||
              "Debt tidak ditemukan."}
          </p>
        </div>
      </div>
    );
  }

  const {
    debt,
    transactions,
  } = data;

  const paymentTotal = transactions.reduce(
    (sum, tx) =>
      sum + Number(tx.amount || 0),
    0
  );

  const total =
    Number(debt.total_amount) || 0;

  const remaining =
    Number(debt.remaining) || 0;

  const paid = Math.max(
    0,
    total - remaining
  );

  const progress =
    total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (paid / total) * 100
          )
        )
      : 0;

  return (
    <div className="pm-app">
      {/* Header */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border:
              "1px solid var(--pm-border)",
            background:
              "var(--pm-surface)",
            color:
              "var(--pm-text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <i
            className="ti ti-chevron-left"
            style={{ fontSize: 20 }}
          />
        </button>

        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              letterSpacing:
                "-0.3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow:
                "ellipsis",
            }}
          >
            {debt.name}
          </h1>

          <p
            style={{
              fontSize: 12,
              color:
                "var(--pm-text-secondary)",
              margin: "3px 0 0",
            }}
          >
            Debt detail
          </p>
        </div>
      </div>

      {/* Main Summary */}

      <div
        className="pm-card pm-card-hud"
        style={{
          marginBottom: 12,
        }}
      >
        <p
          style={{
            fontSize: 11,
            color:
              "var(--pm-text-secondary)",
            margin: "0 0 5px",
            textTransform:
              "uppercase",
            letterSpacing:
              "0.5px",
          }}
        >
          Remaining debt
        </p>

        <p
          className="pm-num"
          style={{
            fontSize: 30,
            fontWeight: 700,
            margin: 0,
            color: "#F5A623",
          }}
        >
          {fmt(remaining)}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color:
                "var(--pm-text-secondary)",
            }}
          >
            dari {fmt(total)}
          </span>

          <span
            style={{
              fontSize: 11,
              color:
                "var(--pm-text-secondary)",
            }}
          >
            {progress.toFixed(0)}%
            terbayar
          </span>
        </div>

        <div
          style={{
            height: 7,
            borderRadius: 4,
            background:
              "var(--pm-border)",
            overflow: "hidden",
            marginTop: 12,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#F5A623",
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Debt Info */}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div
          className="pm-card"
          style={{
            flex: 1,
            padding: 12,
          }}
        >
          <p
            style={{
              fontSize: 10,
              color:
                "var(--pm-text-secondary)",
              margin: "0 0 4px",
            }}
          >
            Installment
          </p>

          <p
            className="pm-num"
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {debt.monthly_installment
              ? `${fmt(
                  debt.monthly_installment
                )}/mo`
              : "-"}
          </p>
        </div>

        <div
          className="pm-card"
          style={{
            flex: 1,
            padding: 12,
          }}
        >
          <p
            style={{
              fontSize: 10,
              color:
                "var(--pm-text-secondary)",
              margin: "0 0 4px",
            }}
          >
            Jatuh tempo
          </p>

          <p
            className="pm-num"
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {debt.due_day
              ? `Tanggal ${debt.due_day}`
              : "-"}
          </p>
        </div>
      </div>

      {/* Payment History */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          marginBottom: 10,
        }}
      >
        <p
          className="pm-label"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color:
              "var(--pm-text-primary)",
            margin: 0,
          }}
        >
          Riwayat Pembayaran
        </p>

        <span
          style={{
            fontSize: 11,
            color:
              "var(--pm-text-secondary)",
          }}
        >
          {transactions.length} transaksi
        </span>
      </div>

      {transactions.length === 0 ? (
        <div
          className="pm-card"
          style={{
            textAlign: "center",
            padding: 28,
          }}
        >
          <i
            className="ti ti-receipt"
            style={{
              fontSize: 28,
              color:
                "var(--pm-text-muted)",
            }}
          />

          <p
            style={{
              margin:
                "10px 0 4px",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            No payments yet
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color:
                "var(--pm-text-secondary)",
            }}
          >
            Transaksi yang dikaitkan
            dengan hutang ini akan
            muncul di sini.
          </p>
        </div>
      ) : (
        groupByDate(
          transactions
        ).map(
          ([date, items]) => (
            <div
              key={date}
              style={{
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  letterSpacing:
                    "0.5px",
                  color:
                    "var(--pm-text-muted)",
                  textTransform:
                    "uppercase",
                  margin:
                    "0 0 8px",
                }}
              >
                {formatDate(date)}
              </p>

              {items.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() =>
                    onOpenTransaction?.(
                      tx
                    )
                  }
                  className="pm-card"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 12,
                    marginBottom: 8,
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius:
                        "50%",
                      background:
                        "rgba(255,107,82,0.15)",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className="ti ti-arrow-down"
                      style={{
                        fontSize: 16,
                        color:
                          "#FF6B52",
                      }}
                    />
                  </span>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        margin: 0,
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {tx.category
                        ?.name ||
                        "Pembayaran hutang"}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color:
                          "var(--pm-text-secondary)",
                        margin:
                          "3px 0 0",
                      }}
                    >
                      {tx.description ||
                        tx.payee ||
                        "Expense"}
                    </p>
                  </div>

                  <div
                    style={{
                      textAlign:
                        "right",
                      flexShrink: 0,
                    }}
                  >
                    <p
                      className="pm-num"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        margin: 0,
                        color:
                          "#FF6B52",
                      }}
                    >
                      -{fmt(tx.amount)}
                    </p>

                    <i
                      className="ti ti-chevron-right"
                      style={{
                        fontSize: 14,
                        color:
                          "var(--pm-text-secondary)",
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )
        )
      )}

      {transactions.length > 0 && (
        <p
          style={{
            fontSize: 11,
            color:
              "var(--pm-text-secondary)",
            margin:
              "4px 0 20px",
          }}
        >
          Total transaksi:{" "}
          {fmt(paymentTotal)}
        </p>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}
