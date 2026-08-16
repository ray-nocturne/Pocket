import { useEffect, useRef, useState } from "react";
import {
  getDashboardData,
  getRecentTransactions,
  getProfile,
} from "../lib/queries";
import "../styles/pocketmaster.css";
import TabBar from "./TabBar";

const fmt = (n) =>
  "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");

const POCKET_COLORS = [
  "#0A84FF",
  "#7F77DD",
  "#30D158",
  "#F5A623",
  "#5AC8FA",
  "#BF5AF2",
  "#FF6B52",
  "#64D2FF",
  "#FFD60A",
  "#AC8E68",
  "#32ADE6",
  "#FF375F",
  "#30D5C8",
  "#AF52DE",
  "#FF9F0A",
  "#64D2FF",
];



const DEBT_COLORS = [
  "#F5A623",
  "#5AC8FA",
  "#BF5AF2",
  "#30D158",
  "#FF6B52",
];

const EXPENSE_CATEGORY_COLORS = [
  "#FF5C7A",
  "#22D3EE",
  "#7F77DD",
  "#FFB84D",
  "#34F5A0",
  "#5B7180",
];

const pad = (n) => n.toString().padStart(2, "0");

function formatDate(d) {
  return `${pad(d.getDate())}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}`;
}

function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getGreeting(d) {
  const h = d.getHours();

  if (h < 10) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";

  return "Selamat Malam";
}

function PlusIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function HeaderGreeting({ username, now }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 2,
      }}
    >
      <p className="pm-label" style={{ margin: 0 }}>
        {getGreeting(now)}, {username}!
      </p>

      <div style={{ textAlign: "right" }}>
        <p
          style={{
            fontSize: 12,
            color: "var(--pm-text-secondary)",
            margin: 0,
          }}
        >
          {formatDate(now)}
        </p>

        <p
          style={{
            fontSize: 12,
            color: "var(--pm-text-secondary)",
            margin: 0,
          }}
        >
          {formatTime(now)}
        </p>
      </div>
    </div>
  );
}

function typeLabel(type) {
  return (
    {
      bank: "Bank Account",
      emoney: "E-money",
      cash: "Cash",
    }[type] ?? type
  );
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

function DonutMini({
  segments,
  size = 76,
  centerValue,
  centerLabel,
}) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2C2C2E"
          strokeWidth="12"
        />

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
              strokeWidth="12"
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${
                size / 2
              } ${size / 2})`}
            />
          );

          offset += len;

          return el;
        })}
      </svg>

      {(centerValue !== undefined || centerLabel) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {centerValue !== undefined && (
            <p
              style={{
                fontSize: size * 0.18,
                fontWeight: 700,
                margin: 0,
                color: "var(--pm-text-primary)",
              }}
            >
              {centerValue}
            </p>
          )}

          {centerLabel && (
            <p
              style={{
                fontSize: size * 0.09,
                color: "var(--pm-text-secondary)",
                margin: 0,
              }}
            >
              {centerLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LegendRow({
  color,
  label,
  sub,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />

      <div>
        <p
          style={{
            fontSize: 12,
            margin: 0,
          }}
        >
          {label}
        </p>

        {sub && (
          <p
            style={{
              fontSize: 12,
              color: "var(--pm-text-secondary)",
              margin: 0,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({
  onOpenPocket,
  onOpenPocketsList,
  onAddTransaction,
  onAddPocket,
  onAddDebt,
  onOpenProfile,
  onOpenCategory,
  onOpenBudget,
  onOpenTransaction,
  onOpenTransactions,
  activeTab = "home",
}) {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const carouselRef = useRef(null);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    Promise.all([
      getDashboardData(),
      getRecentTransactions(15),
      getProfile(),
    ])
      .then(([d, r, p]) => {
        setData(d);
        setRecent(r);
        setProfile(p);
      })
      .catch((error) => {
        console.error(
          "Dashboard loading error:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setNow(new Date()),
      30000
    );

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="pm-app">
        Memuat...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pm-app">
        <p>Gagal memuat dashboard.</p>
      </div>
    );
  }

  const {
    pockets,
    debts,
    totalBalance,
    income,
    expense,
    incomeCount,
    expenseCount,
    totalDebt,
  } = data;

  const hasPockets = pockets.length > 0;

  // Assign deterministic, unique colors to the currently
  // visible pockets. Sorting by pocket_id keeps each pocket's
  // color stable even when the display order changes.
  const pocketColorMap = new Map(
    [...pockets]
      .sort((a, b) =>
        String(a.pocket_id).localeCompare(
          String(b.pocket_id)
        )
      )
      .map((p, i) => [
        p.pocket_id,
        POCKET_COLORS[
          i % POCKET_COLORS.length
        ],
      ])
  );

  const pocketSlices = pockets.map(
    (p) => ({
      label: p.name,
      type: p.type,
      pct:
        totalBalance > 0
          ? (Number(p.balance) /
              totalBalance) *
            100
          : 0,
      amount: p.balance,
      color: pocketColorMap.get(
        p.pocket_id
      ),
    })
  );

  const debtSlices = debts.map(
    (d, i) => ({
      label: d.name,
      pct:
        totalDebt > 0
          ? (Number(d.remaining) /
              totalDebt) *
            100
          : 0,
      amount: d.remaining,
      color:
        DEBT_COLORS[
          i % DEBT_COLORS.length
        ],
    })
  );

  const grouped = pockets.reduce(
    (acc, p) => {
      (acc[p.type] =
        acc[p.type] || []).push(p);

      return acc;
    },
    {}
  );

  function handleScroll() {
    const el = carouselRef.current;

    if (!el) return;

    const firstCard = el.children[0];

    if (!firstCard) return;

    const cardWidth =
      firstCard.offsetWidth + 12;

    setActiveCard(
      Math.round(
        el.scrollLeft / cardWidth
      )
    );
  }

  if (!hasPockets) {
    return (
      <div className="pm-app">
        <HeaderGreeting
          username={profile?.full_name || profile?.username}
          now={now}
        />

        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            margin: "8px 0 0",
          }}
        >
          Rp0
        </h1>

        <div
          style={{
            textAlign: "center",
            marginTop: 100,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background:
                "var(--pm-surface)",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className="ti ti-wallet"
              style={{
                fontSize: 36,
                color:
                  "var(--pm-text-muted)",
              }}
            />
          </div>

          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              margin: "0 0 6px",
            }}
          >
            Belum ada pocket
          </p>

          <p
            style={{
              fontSize: 13,
              color:
                "var(--pm-text-secondary)",
              margin: "0 0 28px",
            }}
          >
            Tambah pocket pertamamu
            untuk mulai mencatat
          </p>

          <button
            className="pm-btn-primary"
            onClick={onAddPocket}
          >
            + Tambah Pocket
          </button>
        </div>

        <TabBar
          active={activeTab}
          onHome={() => {}}
          onPocket={onOpenPocketsList}
          onCategory={onOpenCategory}
          onBudget={onOpenBudget}
          onProfile={onOpenProfile}
        />
      </div>
    );
  }

  return (
    <div className="pm-app">
      <HeaderGreeting
        username={profile?.full_name || profile?.username}
        now={now}
      />

      <div
        className="pm-card pm-card-hud"
        style={{
          margin: "8px 0 20px",
        }}
      >
        <h1
          className="pm-num"
          style={{
            fontSize: 32,
            fontWeight: 600,
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          {fmt(totalBalance)}
        </h1>

        <p
          style={{
            fontSize: 12,
            color: "var(--pm-text-secondary)",
            margin: "4px 0 14px",
          }}
        >
          Total saldo dari{" "}
          {pockets.length} pocket
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
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "var(--pm-text-secondary)",
                margin: "0 0 4px",
              }}
            >
              Income transactions
            </p>
            <p
              className="pm-num"
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: "var(--pm-success)",
              }}
            >
              {incomeCount}x
            </p>
          </div>

          <div
            style={{
              flex: 1,
              background: "var(--pm-bg)",
              border: "1px solid var(--pm-border)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "var(--pm-text-secondary)",
                margin: "0 0 4px",
              }}
            >
              Expense transactions
            </p>
            <p
              className="pm-num"
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: "var(--pm-danger)",
              }}
            >
              {expenseCount}x
            </p>
          </div>
        </div>
      </div>

      {/* Pockets */}

      <p
        className="pm-label"
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--pm-text-primary)",
          marginBottom: 10,
        }}
      >
        Pockets
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          marginBottom: 24,
          paddingBottom: 4,
          scrollSnapType: "x mandatory",
        }}
      >
        <div
          className="pm-card pm-card-hud"
          style={{
            flex: "0 0 100%",
            scrollSnapAlign: "start",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: "0 0 16px",
            }}
          >
            Pockets breakdown
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <DonutMini
              segments={pocketSlices}
              size={110}
              centerValue={pockets.length}
              centerLabel="pockets"
            />

            <div
              style={{
                flex: 1,
                maxHeight: 150,
                overflowY: "auto",
              }}
            >
              {(() => {
                const orderedTypes = ["bank", "emoney", "cash"];
                const groups = orderedTypes
                  .map((type) => ({
                    type,
                    items: pocketSlices
                      .filter((s) => s.type === type)
                      .sort((a, b) => b.amount - a.amount),
                  }))
                  .filter((g) => g.items.length > 0);

                return groups.map((g, gi) => (
                  <div key={g.type}>
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--pm-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        margin: gi === 0 ? "0 0 4px" : "10px 0 4px",
                        paddingTop: gi === 0 ? 0 : 8,
                        borderTop:
                          gi === 0
                            ? "none"
                            : "1px solid var(--pm-border)",
                      }}
                    >
                      {typeLabel(g.type)}
                    </p>

                    {g.items.map((s) => (
                      <div
                        key={s.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 0",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: s.color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 130,
                            }}
                          >
                            {s.label}
                          </span>
                        </span>

                        <span
                          className="pm-num"
                          style={{
                            fontSize: 13,
                            color: "var(--pm-text-secondary)",
                            flexShrink: 0,
                            marginLeft: 10,
                          }}
                        >
                          {s.pct.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>

          <p
            style={{
              fontSize: 11,
              color: "var(--pm-text-secondary)",
              margin: "12px 0 0",
            }}
          >
            Swipe for detail of each pocket &rarr;
          </p>
        </div>

        {pockets.map((p) => (
          <button
            key={p.pocket_id}
            onClick={() => onOpenPocket?.(p.pocket_id)}
            className="pm-card pm-card-hud"
            style={{
              flex: "0 0 100%",
              scrollSnapAlign: "start",
              textAlign: "left",
              border: "1px solid var(--pm-border)",
              cursor: "pointer",
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
                  background: "var(--pm-bg)",
                  border: `1px solid ${
                    p.type === "bank"
                      ? "#22D3EE"
                      : p.type === "emoney"
                      ? "#7F77DD"
                      : "#34F5A0"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color:
                    p.type === "bank"
                      ? "#22D3EE"
                      : p.type === "emoney"
                      ? "#7F77DD"
                      : "#34F5A0",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                <i
                  className={`ti ti-${
                    p.type === "bank"
                      ? "building-bank"
                      : p.type === "emoney"
                      ? "device-mobile"
                      : "cash"
                  }`}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--pm-text-secondary)",
                    margin: 0,
                  }}
                >
                  {typeLabel(p.type)}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginBottom: p.categoryBreakdown?.length > 0 ? 14 : 0 }}>
              <div
                style={{
                  flex: 1,
                  background: "var(--pm-bg)",
                  border: "1px solid var(--pm-border)",
                  borderRadius: 6,
                  display: "flex",
                }}
              >
                <div style={{ flex: 1, padding: "8px 10px" }}>
                  <p style={{ fontSize: 9, color: "var(--pm-text-secondary)", margin: "0 0 2px" }}>
                    Income
                  </p>
                  <p
                    className="pm-num"
                    style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--pm-success)" }}
                  >
                    {p.incomeCount}x
                  </p>
                </div>

                <div style={{ width: 1, background: "var(--pm-border)" }} />

                <div style={{ flex: 1, padding: "8px 10px" }}>
                  <p style={{ fontSize: 9, color: "var(--pm-text-secondary)", margin: "0 0 2px" }}>
                    Expense
                  </p>
                  <p
                    className="pm-num"
                    style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--pm-danger)" }}
                  >
                    {p.expenseCount}x
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "right" }}>
                <p style={{ fontSize: 9, color: "var(--pm-text-secondary)", margin: "0 0 2px" }}>Balance</p>
                <p
                  className="pm-num"
                  style={{ fontSize: 16, fontWeight: 700, margin: 0, whiteSpace: "nowrap" }}
                >
                  {p.balance < 0 ? "-" : ""}
                  {fmt(p.balance)}
                </p>
              </div>
            </div>

            {p.categoryBreakdown?.length > 0 && (
              <div style={{ borderTop: "1px solid var(--pm-border)", paddingTop: 12 }}>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--pm-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    margin: "0 0 8px",
                  }}
                >
                  Expense by category
                </p>

                <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 10 }}>
                  {p.categoryBreakdown.map((c, i) => (
                    <div
                      key={c.name}
                      style={{
                        width: `${c.pct}%`,
                        background: EXPENSE_CATEGORY_COLORS[i % EXPENSE_CATEGORY_COLORS.length],
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                  {p.categoryBreakdown.slice(0, 4).map((c, i) => (
                    <span
                      key={c.name}
                      className="pm-num"
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--pm-text-primary)" }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: EXPENSE_CATEGORY_COLORS[i % EXPENSE_CATEGORY_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      {c.name} {c.pct.toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Debts */}

      <p
        className="pm-label"
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--pm-text-primary)",
          marginBottom: 10,
        }}
      >
        Debts
      </p>

      {debts.length > 0 ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            marginBottom: 24,
            paddingBottom: 4,
            scrollSnapType: "x mandatory",
          }}
        >
          <div
            className="pm-card pm-card-hud"
            style={{
              flex: "0 0 100%",
              scrollSnapAlign: "start",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 16px",
              }}
            >
              Debts breakdown
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <DonutMini
                segments={debtSlices}
                size={110}
                centerValue={debts.length}
                centerLabel={debts.length > 1 ? "debts" : "debt"}
              />

              <div
                style={{
                  flex: 1,
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                {debtSlices.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: s.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 130,
                        }}
                      >
                        {s.label}
                      </span>
                    </span>

                    <span
                      className="pm-num"
                      style={{
                        fontSize: 13,
                        color: "var(--pm-text-secondary)",
                        flexShrink: 0,
                        marginLeft: 10,
                      }}
                    >
                      {s.pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p
              style={{
                fontSize: 11,
                color: "var(--pm-text-secondary)",
                margin: "12px 0 0",
              }}
            >
              Swipe for detail of each debt &rarr;
            </p>
          </div>

          {debts.map((d) => (
            <div
              key={d.debt_id}
              className="pm-card pm-card-hud"
              style={{
                flex: "0 0 100%",
                scrollSnapAlign: "start",
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
                    background: "var(--pm-bg)",
                    border: "1px solid #F5A623",
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

                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {d.name}
                  </p>
                  {d.monthly_installment && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--pm-text-secondary)",
                        margin: 0,
                      }}
                    >
                      Cicilan {fmt(d.monthly_installment)}/bln
                    </p>
                  )}
                </div>
              </div>

              <p
                className="pm-num"
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  margin: "0 0 4px",
                  color: "#F5A623",
                }}
              >
                {fmt(d.remaining)}
              </p>

              <p
                style={{
                  fontSize: 10,
                  color: "var(--pm-text-secondary)",
                  margin: 0,
                }}
              >
                sisa hutang
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="pm-card"
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--pm-text-secondary)",
              margin: "0 0 10px",
            }}
          >
            Belum ada hutang tercatat
          </p>

          <button
            onClick={onAddDebt}
            style={{
              background: "none",
              border: "none",
              color: "var(--pm-accent)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Tambah Hutang
          </button>
        </div>
      )}

      {/* Recent Transactions */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <p
          className="pm-label"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--pm-text-primary)",
            margin: 0,
          }}
        >
          Transaksi Terakhir
        </p>

        <button
          type="button"
          onClick={onOpenTransactions}
          style={{
            background: "none",
            border: "none",
            color: "var(--pm-accent)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Lihat Semua
          <i
            className="ti ti-chevron-right"
            style={{
              fontSize: 13,
              marginLeft: 3,
              verticalAlign: "-1px",
            }}
          />
        </button>
      </div>

      {recent.length === 0 && (
        <p
          style={{
            fontSize: 13,
            color:
              "var(--pm-text-secondary)",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          Belum ada transaksi
        </p>
      )}

      {groupByDate(recent).map((g) => (
        <div
          key={g.label}
          style={{
            marginBottom: 8,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.5px",
              color: "var(--pm-text-muted)",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            {g.label}
          </p>

          {g.items.map((tx) => {
            const isIncome =
              tx.type === "income";

            const pocketName =
              tx.type === "income"
                ? tx.to_pocket?.name
                : tx.from_pocket?.name;

            return (
              <button
                key={tx.id}
                type="button"
                onClick={() => {
                  console.log(
                    "🔥 Dashboard transaction clicked:",
                    tx
                  );

                  onOpenTransaction?.(tx);
                }}
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
                  zIndex: 10,
                  pointerEvents: "auto",
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
                        : "rgba(255,107,82,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <i
                    className={`ti ti-arrow-${
                      isIncome
                        ? "up"
                        : "down"
                    }`}
                    style={{
                      fontSize: 16,
                      color:
                        isIncome
                          ? "#30D158"
                          : "#FF6B52",
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
                    }}
                  >
                    {tx.category?.name ||
                      (tx.type === "transfer"
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
                      margin: "2px 0 0",
                    }}
                  >
                    {pocketName
                      ? `${pocketName} · `
                      : ""}
                    {formatDate(new Date(tx.date))}
                    {" · "}
                    {tx.transaction_time
                      ? tx.transaction_time.slice(0, 5)
                      : formatTime(new Date(tx.created_at))}
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
                        : tx.type ===
                          "expense"
                        ? "var(--pm-danger)"
                        : "var(--pm-text-primary)",
                    flexShrink: 0,
                  }}
                >
                  {isIncome
                    ? "+"
                    : tx.type === "expense"
                    ? "-"
                    : ""}
                  {fmt(tx.amount)}
                </p>

                <i
                  className="ti ti-chevron-right"
                  style={{
                    fontSize: 16,
                    color: "var(--pm-text-secondary)",
                    flexShrink: 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      ))}

      {/* FAB */}

      <div className="pm-fab-wrap">
        <button
          type="button"
          className="pm-fab"
          onClick={onAddTransaction}
        >
          <PlusIcon size={24} />
        </button>
      </div>

      <TabBar
        active={activeTab}
        onHome={() => {}}
        onPocket={onOpenPocketsList}
        onCategory={onOpenCategory}
        onBudget={onOpenBudget}
        onProfile={onOpenProfile}
      />
    </div>
  );
}
