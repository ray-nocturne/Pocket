import { useEffect, useMemo, useState } from "react";
import { getDebts } from "../lib/queries";
import "../styles/pocketmaster.css";

const fmt = (n) =>
  "Rp" + Math.round(Math.abs(Number(n) || 0)).toLocaleString("id-ID");

export default function Debts({
  onBack,
  onAddDebt,
  onOpenDebt,
}) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getDebts()
      .then((data) => {
        if (!cancelled) {
          setDebts(data || []);
        }
      })
      .catch((err) => {
        console.error("Debt loading error:", err);

        if (!cancelled) {
          setError(
            err.message || "Failed to load debts."
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
  }, []);

  const totalRemaining = useMemo(
    () =>
      debts.reduce(
        (sum, debt) =>
          sum + Number(debt.remaining || 0),
        0
      ),
    [debts]
  );

  const totalPrincipal = useMemo(
    () =>
      debts.reduce(
        (sum, debt) =>
          sum + Number(debt.total_amount || 0),
        0
      ),
    [debts]
  );

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
            border: "1px solid var(--pm-border)",
            background: "var(--pm-surface)",
            color: "var(--pm-text-primary)",
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

        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Debts
          </h1>

          <p
            style={{
              fontSize: 12,
              color: "var(--pm-text-secondary)",
              margin: "3px 0 0",
            }}
          >
            Manage your debts and obligations
          </p>
        </div>
      </div>

      {/* Summary */}

      {!loading && !error && debts.length > 0 && (
        <div
          className="pm-card pm-card-hud"
          style={{
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--pm-text-secondary)",
              margin: "0 0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Total hutang tersisa
          </p>

          <p
            className="pm-num"
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: "0 0 14px",
            }}
          >
            {fmt(totalRemaining)}
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <div
              style={{
                flex: 1,
                background: "var(--pm-bg)",
                border: "1px solid var(--pm-border)",
                borderRadius: 8,
                padding: "9px 10px",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "var(--pm-text-secondary)",
                  margin: "0 0 3px",
                }}
              >
                Active debts
              </p>

              <p
                className="pm-num"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {debts.length}
              </p>
            </div>

            <div
              style={{
                flex: 1,
                background: "var(--pm-bg)",
                border: "1px solid var(--pm-border)",
                borderRadius: 8,
                padding: "9px 10px",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "var(--pm-text-secondary)",
                  margin: "0 0 3px",
                }}
              >
                Principal
              </p>

              <p
                className="pm-num"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {fmt(totalPrincipal)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}

      {loading && (
        <div
          className="pm-card"
          style={{
            textAlign: "center",
            padding: 28,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--pm-text-secondary)",
            }}
          >
            Loading debts...
          </p>
        </div>
      )}

      {/* Error */}

      {!loading && error && (
        <div
          className="pm-card"
          style={{
            borderColor: "rgba(255,92,122,0.35)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--pm-danger)",
              fontSize: 13,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Empty */}

      {!loading && !error && debts.length === 0 && (
        <div
          className="pm-card"
          style={{
            textAlign: "center",
            padding: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--pm-bg)",
              border: "1px solid var(--pm-border)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className="ti ti-credit-card"
              style={{
                fontSize: 28,
                color: "var(--pm-text-muted)",
              }}
            />
          </div>

          <p
            style={{
              margin: "0 0 6px",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            No debts yet
          </p>

          <p
            style={{
              margin: "0 0 20px",
              fontSize: 12,
              color: "var(--pm-text-secondary)",
            }}
          >
            Add your first debt to start
            tracking your obligations.
          </p>

          <button
            type="button"
            className="pm-btn-primary"
            onClick={onAddDebt}
          >
            + Add Debt
          </button>
        </div>
      )}

      {/* Debt List */}

      {!loading &&
        !error &&
        debts.length > 0 && (
          <>
            <p
              className="pm-label"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--pm-text-primary)",
                marginBottom: 10,
              }}
            >
              Hutang Aktif
            </p>

            {debts.map((debt) => {
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
                <button
                  key={debt.debt_id}
                  type="button"
                  onClick={() =>
                    onOpenDebt?.(
                      debt.debt_id
                    )
                  }
                  className="pm-card"
                  style={{
                    width: "100%",
                    display: "block",
                    textAlign: "left",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background:
                          "var(--pm-bg)",
                        border:
                          "1px solid #F5A623",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#F5A623",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      <i className="ti ti-credit-card" />
                    </div>

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
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {debt.name}
                      </p>

                      {debt.monthly_installment && (
                        <p
                          style={{
                            fontSize: 11,
                            color:
                              "var(--pm-text-secondary)",
                            margin: "2px 0 0",
                          }}
                        >
                          Installment{" "}
                          {fmt(
                            debt.monthly_installment
                          )}
                          /mo
                        </p>
                      )}
                    </div>

                    <i
                      className="ti ti-chevron-right"
                      style={{
                        fontSize: 16,
                        color:
                          "var(--pm-text-secondary)",
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  <p
                    className="pm-num"
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      margin: "0 0 3px",
                      color: "#F5A623",
                    }}
                  >
                    {fmt(remaining)}
                  </p>

                  <p
                    style={{
                      fontSize: 10,
                      color:
                        "var(--pm-text-secondary)",
                      margin: "0 0 10px",
                    }}
                  >
                    remaining debt
                  </p>

                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background:
                        "var(--pm-border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#F5A623",
                        borderRadius: 3,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color:
                          "var(--pm-text-secondary)",
                      }}
                    >
                      {progress.toFixed(0)}% terbayar
                    </span>

                    {debt.due_day && (
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            "var(--pm-text-secondary)",
                        }}
                      >
                        Jatuh tempo:{" "}
                        {debt.due_day}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onAddDebt}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "var(--pm-accent)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                padding: "8px 0 16px",
              }}
            >
              + Add Debt
            </button>
          </>
        )}

      <div style={{ height: 20 }} />
    </div>
  );
}
