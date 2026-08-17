import { useEffect, useState } from "react";
import {
  getPeriodBounds,
  shiftPeriod,
  getBudgetPeriodSetting,
  getIncomeSuggestion,
  getBudgetPeriod,
  setBudgetPeriodBase,
  getBudgetAllocations,
  setBudgetAllocation,
  deleteBudgetAllocation,
  copyBudgetForward,
  getBudgetSpending,
  getCategories,
} from "../lib/queries";
import { useCurrency } from "../lib/CurrencyContext";
import TabBar from "./TabBar";
import "../styles/pocketmaster.css";

function categoryGroupIcon(group) {
  const icons = {
    Entertainment: "ti-device-gamepad-2",
    Family: "ti-users",
    Financial: "ti-receipt-2",
    Food: "ti-tools-kitchen-2",
    General: "ti-category",
    Health: "ti-stethoscope",
    Housing: "ti-home",
    Lifestyle: "ti-sparkles",
    Shopping: "ti-shopping-bag",
    "Subscription \u00b7 AI": "ti-robot",
    "Subscription \u00b7 Music": "ti-music",
    "Subscription \u00b7 OTT": "ti-device-tv",
    Transportation: "ti-car",
    Travel: "ti-plane",
    Wellness: "ti-yoga",
    "Work & Business": "ti-briefcase",
    Other: "ti-dots",
  };

  return icons[group] || "ti-category";
}

function periodLabel(periodStart, periodType) {
  const d = new Date(`${periodStart}T00:00:00`);

  if (periodType === "weekly") {
    const end = new Date(d);
    end.setDate(d.getDate() + 6);

    const f = (x) =>
      x.toLocaleDateString("en-US", { day: "numeric", month: "short" });

    return `${f(d)} - ${f(end)}`;
  }

  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function Budget({
  onHome,
  onOpenPocketsList,
  onOpenCategory,
  onOpenProfile,
}) {
  const { formatMoney } = useCurrency();
  const fmt = (n) => formatMoney(n);

  const [periodType, setPeriodType] = useState("monthly");
  const [periodStart, setPeriodStart] = useState(
    () => getPeriodBounds(new Date(), "monthly").start
  );
  const [periodEnd, setPeriodEnd] = useState(
    () => getPeriodBounds(new Date(), "monthly").end
  );

  const [loading, setLoading] = useState(true);
  const [budgetPeriod, setBudgetPeriodState] = useState(null);
  const [incomeSuggestion, setIncomeSuggestion] = useState({
    total: 0,
    transactions: [],
  });
  const [allocations, setAllocations] = useState([]);
  const [spending, setSpending] = useState({
    groupSpend: {},
    categorySpend: {},
  });
  const [expenseCategories, setExpenseCategories] = useState([]);

  const [baseInputMode, setBaseInputMode] = useState(false);
  const [baseInputValue, setBaseInputValue] = useState("");

  const [expandedGroup, setExpandedGroup] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    let mounted = true;

    getBudgetPeriodSetting().then((p) => {
      if (!mounted) return;
      setPeriodType(p);
      const bounds = getPeriodBounds(new Date(), p);
      setPeriodStart(bounds.start);
      setPeriodEnd(bounds.end);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function load() {
      const [period, income, cats] = await Promise.all([
        getBudgetPeriod(periodStart),
        getIncomeSuggestion(periodStart, periodEnd),
        getCategories("expense"),
      ]);

      if (!mounted) return;

      setBudgetPeriodState(period);
      setIncomeSuggestion(income);
      setExpenseCategories(cats || []);
      setBaseInputMode(false);
      setExpandedGroup(null);
      setEditingRow(null);

      if (period) {
        await copyBudgetForward(periodStart);

        const [allocs, spend] = await Promise.all([
          getBudgetAllocations(periodStart),
          getBudgetSpending(periodStart, periodEnd),
        ]);

        if (!mounted) return;
        setAllocations(allocs);
        setSpending(spend);
      } else {
        setAllocations([]);
        setSpending({ groupSpend: {}, categorySpend: {} });
      }

      setLoading(false);
    }

    load().catch((err) => {
      console.error("Failed loading budget:", err);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [periodStart, periodEnd]);

  function navigate(direction) {
    const bounds = shiftPeriod(periodStart, periodType, direction);
    setPeriodStart(bounds.start);
    setPeriodEnd(bounds.end);
  }

  async function confirmBaseAmount(amount, source) {
    const saved = await setBudgetPeriodBase({
      periodStart,
      periodEnd,
      amount,
      source,
    });
    setBudgetPeriodState(saved);
    await copyBudgetForward(periodStart);

    const [allocs, spend] = await Promise.all([
      getBudgetAllocations(periodStart),
      getBudgetSpending(periodStart, periodEnd),
    ]);
    setAllocations(allocs);
    setSpending(spend);
  }

  const groupBudgets = {};
  for (const a of allocations) {
    const group = a.category_id
      ? a.category?.group_name
      : a.group_name;
    if (!group) continue;

    if (!groupBudgets[group]) {
      groupBudgets[group] = { amount: 0, mode: "group" };
    }
    groupBudgets[group].amount += Number(a.amount);
    if (a.category_id) groupBudgets[group].mode = "category";
  }

  const totalAllocated = Object.values(groupBudgets).reduce(
    (sum, g) => sum + g.amount,
    0
  );
  const baseAmount = budgetPeriod ? Number(budgetPeriod.base_amount) : 0;
  const unallocated = baseAmount - totalAllocated;

  const allGroupNames = Array.from(
    new Set([
      ...Object.keys(groupBudgets),
      ...Object.keys(spending.groupSpend),
    ])
  ).sort((a, b) => {
    const spendA = spending.groupSpend[a] || 0;
    const spendB = spending.groupSpend[b] || 0;
    return spendB - spendA;
  });

  async function handleSaveGroupBudget(group) {
    const amount = Number(editingValue) || 0;
    if (amount <= 0) return;

    await setBudgetAllocation({
      periodStart,
      groupName: group,
      categoryId: null,
      amount,
    });
    const allocs = await getBudgetAllocations(periodStart);
    setAllocations(allocs);
    setEditingRow(null);
    setEditingValue("");
  }

  async function handleSaveCategoryBudget(group, categoryId) {
    const amount = Number(editingValue) || 0;

    const groupRow = allocations.find(
      (a) => a.group_name === group && !a.category_id
    );
    if (groupRow) {
      await deleteBudgetAllocation(groupRow.id);
    }

    const existing = allocations.find(
      (a) => a.category_id === categoryId
    );

    if (amount > 0) {
      await setBudgetAllocation({
        periodStart,
        groupName: group,
        categoryId,
        amount,
      });
    } else if (existing) {
      await deleteBudgetAllocation(existing.id);
    }

    const allocs = await getBudgetAllocations(periodStart);
    setAllocations(allocs);
    setEditingRow(null);
    setEditingValue("");
  }

  if (loading) {
    return (
      <div className="pm-app">
        <p
          style={{
            fontSize: 14,
            color: "var(--pm-text-secondary)",
            textAlign: "center",
            paddingTop: 40,
          }}
        >
          Loading budget...
        </p>
      </div>
    );
  }

  return (
    <div className="pm-app">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={onHome}
          style={{
            background: "none",
            border: "none",
            color: "var(--pm-text-primary)",
            cursor: "pointer",
          }}
        >
          <i
            className="ti ti-chevron-left"
            style={{ fontSize: 22 }}
          />
        </button>
        <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          Budget
        </p>
        <div style={{ width: 22 }} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <i
            className="ti ti-chevron-left"
            style={{ fontSize: 18, color: "var(--pm-text-secondary)" }}
          />
        </button>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
            minWidth: 140,
            textAlign: "center",
          }}
        >
          {periodLabel(periodStart, periodType)}
        </p>
        <button
          type="button"
          onClick={() => navigate(1)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <i
            className="ti ti-chevron-right"
            style={{ fontSize: 18, color: "var(--pm-text-secondary)" }}
          />
        </button>
      </div>

      {!budgetPeriod ? (
        <div className="pm-card" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
            Set your base amount
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--pm-text-secondary)",
              margin: "0 0 14px",
            }}
          >
            This is the amount you will allocate across categories for
            this {periodType === "weekly" ? "week" : "month"}.
          </p>

          <div
            style={{
              background: "var(--pm-bg)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--pm-text-secondary)",
                margin: "0 0 4px",
              }}
            >
              Suggested (from income transactions this period)
            </p>
            <p
              className="pm-num"
              style={{
                fontSize: 20,
                fontWeight: 600,
                margin: "0 0 8px",
                color: "var(--pm-success)",
              }}
            >
              {fmt(incomeSuggestion.total)}
            </p>

            {incomeSuggestion.transactions.length > 0 ? (
              incomeSuggestion.transactions.map((tx) => (
                <p
                  key={tx.id}
                  style={{
                    fontSize: 11,
                    color: "var(--pm-text-secondary)",
                    margin: "2px 0",
                  }}
                >
                  {tx.source_text || tx.description || "Income"} &middot;{" "}
                  {fmt(tx.amount)}
                </p>
              ))
            ) : (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--pm-text-secondary)",
                  margin: 0,
                }}
              >
                No income transactions found for this period.
              </p>
            )}
          </div>

          {!baseInputMode ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="pm-btn-primary"
                style={{ flex: 1 }}
                onClick={() =>
                  confirmBaseAmount(incomeSuggestion.total, "auto")
                }
              >
                Use this amount
              </button>
              <button
                type="button"
                onClick={() => {
                  setBaseInputMode(true);
                  setBaseInputValue(
                    incomeSuggestion.total
                      ? String(incomeSuggestion.total)
                      : ""
                  );
                }}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--pm-border)",
                  background: "none",
                  color: "var(--pm-text-primary)",
                  cursor: "pointer",
                }}
              >
                Enter manually
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                inputMode="numeric"
                className="pm-input"
                value={
                  baseInputValue
                    ? Number(baseInputValue).toLocaleString("id-ID")
                    : ""
                }
                onChange={(e) =>
                  setBaseInputValue(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter amount"
                style={{
                  marginBottom: 10,
                  boxSizing: "border-box",
                  width: "100%",
                }}
              />
              <button
                type="button"
                className="pm-btn-primary"
                style={{ width: "100%" }}
                onClick={() =>
                  confirmBaseAmount(Number(baseInputValue) || 0, "manual")
                }
              >
                Confirm base amount
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              border: "1px solid var(--pm-accent)",
              borderRadius: 14,
              padding: 16,
              position: "relative",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: 10,
                height: 10,
                borderTop: "1px solid var(--pm-accent)",
                borderLeft: "1px solid var(--pm-accent)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderBottom: "1px solid var(--pm-accent)",
                borderRight: "1px solid var(--pm-accent)",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--pm-text-secondary)",
                    margin: "0 0 4px",
                  }}
                >
                  Base amount
                </p>
                <p
                  className="pm-num"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--pm-success)",
                    margin: 0,
                  }}
                >
                  {fmt(baseAmount)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--pm-text-secondary)",
                    margin: "0 0 4px",
                  }}
                >
                  Allocated
                </p>
                <p
                  className="pm-num"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--pm-text-primary)",
                    margin: 0,
                  }}
                >
                  {fmt(totalAllocated)}
                </p>
              </div>
            </div>

            <div
              style={{
                height: 1,
                background: "var(--pm-border)",
                marginBottom: 12,
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--pm-text-secondary)",
                  margin: 0,
                }}
              >
                Unallocated
              </p>
              <p
                className="pm-num"
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--pm-accent)",
                  margin: 0,
                }}
              >
                {fmt(unallocated)}
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>
            Category budgets
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {allGroupNames.map((group) => {
              const budget = groupBudgets[group];
              const spent = spending.groupSpend[group] || 0;
              const hasBudget = budget && budget.amount > 0;
              const pct = hasBudget
                ? Math.min(100, (spent / budget.amount) * 100)
                : 0;
              const barColor =
                pct >= 100
                  ? "var(--pm-danger)"
                  : pct >= 90
                  ? "#FFB84D"
                  : "var(--pm-success)";
              const isExpanded = expandedGroup === group;
              const groupCategories = expenseCategories.filter(
                (c) => c.group_name === group
              );

              return (
                <div key={group} className="pm-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: hasBudget ? 8 : 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <i
                        className={`ti ${categoryGroupIcon(group)}`}
                        style={{ fontSize: 15, color: "var(--pm-accent)" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {group}
                      </span>
                    </div>

                    {hasBudget ? (
                      <span
                        className="pm-num"
                        style={{
                          fontSize: 12,
                          color: "var(--pm-text-secondary)",
                        }}
                      >
                        {fmt(spent)} / {fmt(budget.amount)}
                      </span>
                    ) : (
                      !(
                        editingRow?.type === "group" &&
                        editingRow.group === group
                      ) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRow({ type: "group", group });
                            setEditingValue("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--pm-accent)",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          + Set budget
                        </button>
                      )
                    )}
                  </div>

                  {hasBudget && (
                    <div
                      style={{
                        height: 6,
                        background: "var(--pm-border)",
                        borderRadius: 4,
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: barColor,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  )}

                  {editingRow?.type === "group" &&
                    editingRow.group === group && (
                      <div
                        style={{ display: "flex", gap: 8, marginTop: 8 }}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          className="pm-input"
                          autoFocus
                          value={
                            editingValue
                              ? Number(editingValue).toLocaleString(
                                  "id-ID"
                                )
                              : ""
                          }
                          onChange={(e) =>
                            setEditingValue(
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="Amount"
                          style={{ flex: 1, boxSizing: "border-box" }}
                        />
                        <button
                          type="button"
                          className="pm-btn-primary"
                          onClick={() => handleSaveGroupBudget(group)}
                        >
                          Save
                        </button>
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : group)
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--pm-text-secondary)",
                      fontSize: 11,
                      cursor: "pointer",
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <i
                      className={`ti ${
                        isExpanded ? "ti-chevron-up" : "ti-chevron-down"
                      }`}
                      style={{ fontSize: 12 }}
                    />
                    {budget?.mode === "category"
                      ? "Manage categories"
                      : "Break down by category"}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: "1px solid var(--pm-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {groupCategories.map((cat) => {
                        const catAlloc = allocations.find(
                          (a) => a.category_id === cat.id
                        );
                        const catSpent =
                          spending.categorySpend[cat.id] || 0;
                        const isEditingThis =
                          editingRow?.type === "category" &&
                          editingRow.categoryId === cat.id;

                        return (
                          <div key={cat.id}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontSize: 12 }}>
                                {cat.name}
                              </span>
                              {catAlloc ? (
                                <span
                                  className="pm-num"
                                  style={{
                                    fontSize: 11,
                                    color: "var(--pm-text-secondary)",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => {
                                    setEditingRow({
                                      type: "category",
                                      group,
                                      categoryId: cat.id,
                                    });
                                    setEditingValue(
                                      String(catAlloc.amount)
                                    );
                                  }}
                                >
                                  {fmt(catSpent)} / {fmt(catAlloc.amount)}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRow({
                                      type: "category",
                                      group,
                                      categoryId: cat.id,
                                    });
                                    setEditingValue("");
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--pm-accent)",
                                    fontSize: 11,
                                    cursor: "pointer",
                                  }}
                                >
                                  + Set
                                </button>
                              )}
                            </div>

                            {isEditingThis && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginTop: 6,
                                }}
                              >
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="pm-input"
                                  autoFocus
                                  value={
                                    editingValue
                                      ? Number(
                                          editingValue
                                        ).toLocaleString("id-ID")
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setEditingValue(
                                      e.target.value.replace(/\D/g, "")
                                    )
                                  }
                                  placeholder="Amount"
                                  style={{
                                    flex: 1,
                                    boxSizing: "border-box",
                                    fontSize: 13,
                                  }}
                                />
                                <button
                                  type="button"
                                  className="pm-btn-primary"
                                  style={{
                                    fontSize: 12,
                                    padding: "6px 12px",
                                  }}
                                  onClick={() =>
                                    handleSaveCategoryBudget(
                                      group,
                                      cat.id
                                    )
                                  }
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {allGroupNames.length === 0 && (
              <div className="pm-card" style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--pm-text-secondary)",
                    margin: 0,
                  }}
                >
                  No spending history yet for this period.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ height: 90 }} />

      <TabBar
        active="budget"
        onHome={onHome}
        onPocket={onOpenPocketsList}
        onCategory={onOpenCategory}
        onBudget={() => {}}
        onProfile={onOpenProfile}
      />
    </div>
  );
}
