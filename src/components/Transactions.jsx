import { useEffect, useState } from "react";
import {
  getTransactions,
} from "../lib/queries";
import "../styles/pocketmaster.css";

const fmt = (n) =>
  "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");

const pad = (n) => n.toString().padStart(2, "0");

function formatDate(d) {
  return `${pad(d.getDate())}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}`;
}

function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function groupByDate(transactions) {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const yesterday = new Date(
    Date.now() - 86400000
  )
    .toISOString()
    .slice(0, 10);

  const groups = {};

  for (const tx of transactions) {
    const label =
      tx.date === today
        ? "Hari ini"
        : tx.date === yesterday
        ? "Kemarin"
        : new Date(tx.date).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "long",
            }
          );

    (groups[tx.date] = groups[tx.date] || {
      label,
      items: [],
    }).items.push(tx);
  }

  return Object.entries(groups)
    .sort((a, b) =>
      a[0] < b[0] ? 1 : -1
    )
    .map(([, g]) => g);
}

export default function Transactions({
  onBack,
  onOpenTransaction,
}) {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getTransactions(0, 30)
      .then(({ data, hasMore }) => {
        if (cancelled) return;

        setTransactions(data);
        setPage(0);
        setHasMore(hasMore);
      })
      .catch((err) => {
        console.error(
          "Transaction history loading error:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Failed to load transactions."
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

  async function loadMore() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;

      const result = await getTransactions(
        nextPage,
        30
      );

      setTransactions((current) => [
        ...current,
        ...result.data,
      ]);

      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error(
        "Load more transactions error:",
        err
      );

      setError(
        err.message ||
          "Failed to load more transactions."
      );
    } finally {
      setLoadingMore(false);
    }
  }

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
            Transactions
          </h1>

          <p
            style={{
              fontSize: 12,
              color: "var(--pm-text-secondary)",
              margin: "3px 0 0",
            }}
          >
            Riwayat semua transaksi
          </p>
        </div>
      </div>

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
            Loading transactions...
          </p>
        </div>
      )}

      {/* Error */}

      {!loading && error && transactions.length === 0 && (
        <div
          className="pm-card"
          style={{
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
            {error}
          </p>
        </div>
      )}

      {/* Empty */}

      {!loading &&
        !error &&
        transactions.length === 0 && (
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
                color: "var(--pm-text-muted)",
              }}
            />

            <p
              style={{
                margin: "10px 0 4px",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Belum ada transaksi
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                color:
                  "var(--pm-text-secondary)",
              }}
            >
              Transaksi yang kamu catat akan
              muncul di sini.
            </p>
          </div>
        )}

      {/* Transactions */}

      {!loading &&
        transactions.length > 0 && (
          <>
            {groupByDate(transactions).map(
              (group) => (
                <div
                  key={group.label}
                  style={{
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.5px",
                      color:
                        "var(--pm-text-muted)",
                      textTransform: "uppercase",
                      margin: "0 0 8px",
                    }}
                  >
                    {group.label}
                  </p>

                  {group.items.map((tx) => {
                    const isIncome =
                      tx.type === "income";

                    const isExpense =
                      tx.type === "expense";

                    const pocketName =
                      tx.type === "income"
                        ? tx.to_pocket?.name
                        : tx.from_pocket?.name;

                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() =>
                          onOpenTransaction?.(tx)
                        }
                        className="pm-card"
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 8,
                          textAlign: "left",
                          border: "none",
                          cursor: "pointer",
                          color: "inherit",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background:
                              isIncome
                                ? "rgba(48,209,88,0.15)"
                                : isExpense
                                ? "rgba(255,107,82,0.15)"
                                : "rgba(34,211,238,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                            flexShrink: 0,
                          }}
                        >
                          <i
                            className={
                              isIncome
                                ? "ti ti-arrow-up"
                                : isExpense
                                ? "ti ti-arrow-down"
                                : "ti ti-arrows-exchange"
                            }
                            style={{
                              fontSize: 16,
                              color:
                                isIncome
                                  ? "#30D158"
                                  : isExpense
                                  ? "#FF6B52"
                                  : "var(--pm-accent)",
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
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {tx.category?.name ||
                              (tx.type ===
                              "transfer"
                                ? "Transfer"
                                : "Lainnya")}
                            {tx.description
                              ? ` · ${tx.description}`
                              : ""}
                          </p>

                          <p
                            style={{
                              fontSize: 12,
                              color:
                                "var(--pm-text-secondary)",
                              margin:
                                "2px 0 0",
                              whiteSpace:
                                "nowrap",
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {pocketName
                              ? `${pocketName} · `
                              : ""}
                            {formatDate(
                              new Date(tx.date)
                            )}
                            {" · "}
                            {tx.transaction_time
                              ? tx.transaction_time.slice(
                                  0,
                                  5
                                )
                              : formatTime(
                                  new Date(
                                    tx.created_at
                                  )
                                )}
                          </p>
                        </div>

                        <p
                          className="pm-num"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            margin: 0,
                            color:
                              isIncome
                                ? "var(--pm-success)"
                                : isExpense
                                ? "var(--pm-danger)"
                                : "var(--pm-text-primary)",
                            flexShrink: 0,
                          }}
                        >
                          {isIncome
                            ? "+"
                            : isExpense
                            ? "-"
                            : ""}
                          {fmt(tx.amount)}
                        </p>

                        <i
                          className="ti ti-chevron-right"
                          style={{
                            fontSize: 16,
                            color:
                              "var(--pm-text-secondary)",
                            flexShrink: 0,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )
            )}

            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--pm-danger)",
                  textAlign: "center",
                  margin: "8px 0 12px",
                }}
              >
                {error}
              </p>
            )}

            {hasMore && (
              <button
                type="button"
                className="pm-btn-primary"
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  marginTop: 4,
                }}
              >
                {loadingMore
                  ? "Loading..."
                  : "Muat Lebih Banyak"}
              </button>
            )}

            {!hasMore && (
              <p
                style={{
                  fontSize: 11,
                  color:
                    "var(--pm-text-muted)",
                  textAlign: "center",
                  margin: "18px 0 10px",
                }}
              >
                Semua transaksi sudah
                ditampilkan.
              </p>
            )}
          </>
        )}
    </div>
  );
}
