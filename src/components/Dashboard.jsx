import { useEffect, useRef, useState } from "react";
import {
  getDashboardData,
  getRecentTransactions,
  getProfile,
} from "../lib/queries";
import "../styles/pocketmaster.css";

const fmt = (n) =>
  "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");

const POCKET_COLORS = [
  "#0A84FF",
  "#7F77DD",
  "#30D158",
  "#F5A623",
  "#5AC8FA",
];

const DEBT_COLORS = [
  "#F5A623",
  "#5AC8FA",
  "#BF5AF2",
  "#30D158",
  "#FF6B52",
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
      bank: "Bank & Cash",
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
}) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;

  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
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
  onAddTransaction,
  onAddPocket,
  onAddDebt,
  onOpenProfile,
  onOpenTransaction,
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
    totalDebt,
  } = data;

  const hasPockets = pockets.length > 0;

  const pocketSlices = pockets.map(
    (p, i) => ({
      label: p.name,
      pct:
        totalBalance > 0
          ? (Number(p.balance) /
              totalBalance) *
            100
          : 0,
      amount: p.balance,
      color:
        POCKET_COLORS[
          i % POCKET_COLORS.length
        ],
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
          username={profile?.username}
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
          onProfile={onOpenProfile}
        />
      </div>
    );
  }

  return (
    <div className="pm-app">
      <HeaderGreeting
        username={profile?.username}
        now={now}
      />

      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          margin: "8px 0 0",
          letterSpacing: "-0.5px",
        }}
      >
        {fmt(totalBalance)}
      </h1>

      <p
        style={{
          fontSize: 12,
          color: "var(--pm-text-secondary)",
          margin: "4px 0 20px",
        }}
      >
        Total saldo dari{" "}
        {pockets.length} pocket
      </p>

      {/* Dashboard cards */}

      <div
        ref={carouselRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          marginBottom: 10,
          scrollSnapType: "x mandatory",
        }}
      >
        <div
          className="pm-card"
          style={{
            flex: "0 0 85%",
            scrollSnapAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <DonutMini
            segments={[
              {
                pct:
                  income + expense > 0
                    ? (income /
                        (income +
                          expense)) *
                      100
                    : 0,
                color: "#30D158",
              },
              {
                pct:
                  income + expense > 0
                    ? (expense /
                        (income +
                          expense)) *
                      100
                    : 0,
                color: "#FF6B52",
              },
            ]}
          />

          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 10px",
              }}
            >
              Pemasukan vs Pengeluaran
            </p>

            <LegendRow
              color="#30D158"
              label="Pemasukan"
              sub={fmt(income)}
            />

            <LegendRow
              color="#FF6B52"
              label="Pengeluaran"
              sub={fmt(expense)}
            />
          </div>
        </div>

        <div
          className="pm-card"
          style={{
            flex: "0 0 85%",
            scrollSnapAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <DonutMini
            segments={pocketSlices}
          />

          <div
            style={{
              flex: 1,
              maxHeight: 90,
              overflowY: "auto",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 10px",
              }}
            >
              Saldo per Pocket
            </p>

            {pocketSlices.map((s) => (
              <LegendRow
                key={s.label}
                color={s.color}
                label={s.label}
                sub={`${s.pct.toFixed(
                  1
                )}% · ${fmt(s.amount)}`}
              />
            ))}
          </div>
        </div>

        <div
          className="pm-card"
          style={{
            flex: "0 0 85%",
            scrollSnapAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {debts.length > 0 ? (
            <>
              <DonutMini
                segments={debtSlices}
              />

              <div
                style={{
                  flex: 1,
                  maxHeight: 90,
                  overflowY: "auto",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    margin: "0 0 10px",
                  }}
                >
                  Hutang Berjalan
                </p>

                {debtSlices.map((s) => (
                  <LegendRow
                    key={s.label}
                    color={s.color}
                    label={s.label}
                    sub={`${s.pct.toFixed(
                      1
                    )}% · ${fmt(s.amount)}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                width: "100%",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  margin: "0 0 8px",
                }}
              >
                Hutang Berjalan
              </p>

              <p
                style={{
                  fontSize: 12,
                  color:
                    "var(--pm-text-secondary)",
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
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginBottom: 24,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background:
                i === activeCard
                  ? "var(--pm-accent)"
                  : "#3A3A3C",
            }}
          />
        ))}
      </div>

      {/* Pockets */}

      {Object.entries(grouped).map(
        ([type, list]) => (
          <div
            key={type}
            style={{
              marginBottom: 16,
            }}
          >
            <p className="pm-label">
              {typeLabel(type)}
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
              }}
            >
              {list.map((p) => (
                <button
                  key={p.pocket_id}
                  onClick={() =>
                    onOpenPocket?.(
                      p.pocket_id
                    )
                  }
                  className="pm-card"
                  style={{
                    minWidth: 130,
                    flexShrink: 0,
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color:
                        "var(--pm-text-secondary)",
                      margin: "0 0 6px",
                    }}
                  >
                    {p.name}
                  </p>

                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {p.balance < 0
                      ? "-"
                      : ""}
                    {fmt(p.balance)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* Recent Transactions */}

      <p
        className="pm-label"
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--pm-text-primary)",
          marginBottom: 10,
        }}
      >
        Transaksi Terakhir
      </p>

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
                    {tx.description ||
                      (tx.type ===
                      "transfer"
                        ? "Pindah Pocket"
                        : tx.category?.name)}
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color:
                        "var(--pm-text-secondary)",
                      margin: "2px 0 0",
                    }}
                  >
                    {tx.category?.name ||
                      (tx.type ===
                      "transfer"
                        ? "Transfer"
                        : "")}

                    {pocketName
                      ? ` · ${pocketName}`
                      : ""}
                  </p>
                </div>

                <p
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
                  }}
                >
                  {isIncome
                    ? "+"
                    : tx.type === "expense"
                    ? "-"
                    : ""}
                  {fmt(tx.amount)}
                </p>
              </button>
            );
          })}
        </div>
      ))}

      {/* Add Pocket */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--pm-text-secondary)",
            margin: 0,
          }}
        >
          Punya pocket lain?
        </p>

        <button
          type="button"
          onClick={onAddPocket}
          style={{
            background: "none",
            border: "none",
            color: "var(--pm-accent)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Tambah Pocket
        </button>
      </div>

      {/* FAB */}

      <div className="pm-fab-wrap">
        <button
          type="button"
          className="pm-fab"
          onClick={onAddTransaction}
        >
          <PlusIcon />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      <TabBar
        active={activeTab}
        onHome={() => {}}
        onProfile={onOpenProfile}
      />
    </div>
  );
}

function TabBar({
  active,
  onHome,
  onProfile,
}) {
  return (
    <div className="pm-tabbar">
      <button
        className={
          active === "home"
            ? "active"
            : ""
        }
        onClick={onHome}
      >
        <i
          className="ti ti-home"
          style={{
            fontSize: 20,
          }}
        />
        Beranda
      </button>

      <button
        className={
          active === "profile"
            ? "active"
            : ""
        }
        onClick={onProfile}
      >
        <i
          className="ti ti-user"
          style={{
            fontSize: 20,
          }}
        />
        Profil
      </button>
    </div>
  );
}
