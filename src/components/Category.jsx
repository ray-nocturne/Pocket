import { useEffect, useMemo, useState } from "react";
import { getCategories } from "../lib/queries";
import "../styles/pocketmaster.css";
import TabBar from "./TabBar";

const fmtCount = (count) => {
  if (!count) return "0";
  return count.toLocaleString("id-ID");
};

export default function Category({
  onHome,
  onPocket,
  onBudget,
  onProfile,
  onBack,
  activeTab = "category",
}) {
  const [type, setType] = useState("expense");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getCategories(type)
      .then((data) => {
        if (!cancelled) {
          setCategories(data || []);
        }
      })
      .catch((err) => {
        console.error("Category loading error:", err);

        if (!cancelled) {
          setError(err.message || "Failed to load categories.");
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
  }, [type]);

  const groups = useMemo(() => {
    const map = {};

    for (const category of categories) {
      const group = category.group_name || "General";

      if (!map[group]) {
        map[group] = [];
      }

      map[group].push(category);
    }

    return Object.entries(map).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [categories]);

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
        {onBack && (
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
        )}

        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Categories
          </h1>

          <p
            style={{
              fontSize: 12,
              color: "var(--pm-text-secondary)",
              margin: "3px 0 0",
            }}
          >
            Kelola kategori transaksi
          </p>
        </div>
      </div>

      {/* Income / Expense */}

      <div
        className="pm-segmented"
        style={{
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          className={
            type === "expense"
              ? "active-expense"
              : ""
          }
          style={
            type === "expense"
              ? {
                  background: "rgba(255, 92, 122, 0.30)",
                  color: "#FF5C7A",
                  border: "1px solid rgba(255, 92, 122, 0.65)",
                  fontWeight: 600,
                }
              : undefined
          }
          onClick={() => setType("expense")}
        >
          Expense
        </button>

        <button
          type="button"
          className={
            type === "income"
              ? "active-income"
              : ""
          }
          style={
            type === "income"
              ? {
                  background: "rgba(52, 245, 160, 0.30)",
                  color: "#34F5A0",
                  border: "1px solid rgba(52, 245, 160, 0.65)",
                  fontWeight: 600,
                }
              : undefined
          }
          onClick={() => setType("income")}
        >
          Income
        </button>
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
            Loading categories...
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

      {!loading && !error && groups.length === 0 && (
        <div
          className="pm-card"
          style={{
            textAlign: "center",
            padding: 28,
          }}
        >
          <i
            className="ti ti-tag"
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
            Belum ada kategori
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--pm-text-secondary)",
            }}
          >
            Kategori transaksi akan muncul di sini.
          </p>
        </div>
      )}

      {/* Category Groups */}

      {!loading &&
        !error &&
        groups.map(([groupName, items]) => (
          <div
            key={groupName}
            style={{
              marginBottom: 20,
            }}
          >
            <p
              className="pm-label"
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "0 0 8px",
                color: "var(--pm-text-secondary)",
              }}
            >
              {groupName}
            </p>

            <div className="pm-card">
              {items.map((category, index) => (
                <div
                  key={category.id}
                  className="pm-row"
                  style={{
                    minHeight: 48,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background:
                        "var(--pm-bg)",
                      border:
                        "1px solid var(--pm-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color:
                        type === "expense"
                          ? "var(--pm-danger)"
                          : "var(--pm-success)",
                    }}
                  >
                    <i
                      className={
                        category.is_locked
                          ? "ti ti-lock"
                          : "ti ti-tag"
                      }
                      style={{ fontSize: 16 }}
                    />
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
                      {category.name}
                    </p>

                    {category.is_system && (
                      <p
                        style={{
                          fontSize: 10,
                          color:
                            "var(--pm-text-muted)",
                          margin: "2px 0 0",
                        }}
                      >
                        System category
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="pm-num"
                      style={{
                        fontSize: 11,
                        color:
                          "var(--pm-text-secondary)",
                      }}
                    >
                      {fmtCount(
                        category.transaction_count || 0
                      )}
                    </span>

                    {category.is_locked ? (
                      <i
                        className="ti ti-lock"
                        style={{
                          fontSize: 14,
                          color:
                            "var(--pm-text-muted)",
                        }}
                      />
                    ) : (
                      <i
                        className="ti ti-chevron-right"
                        style={{
                          fontSize: 16,
                          color:
                            "var(--pm-text-secondary)",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Bottom spacing */}

      <div style={{ height: 20 }} />

      {/* Existing footer */}

      <TabBar
        active={activeTab}
        onHome={onHome}
        onPocket={onPocket}
        onCategory={() => {}}
        onBudget={onBudget}
        onProfile={onProfile}
      />
    </div>
  );
}
