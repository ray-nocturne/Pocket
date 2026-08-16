import "../styles/pocketmaster.css";

export default function TabBar({
  active,
  onHome,
  onPocket,
  onCategory,
  onBudget,
  onProfile,
}) {
  return (
    <div className="pm-tabbar">
      <button className={active === "home" ? "active" : ""} onClick={onHome}>
        <i className="ti ti-home" style={{ fontSize: 20 }} />
        Home
      </button>
      <button className={active === "pocket" ? "active" : ""} onClick={onPocket}>
        <i className="ti ti-wallet" style={{ fontSize: 20 }} />
        Pocket
      </button>
      <button
        className={active === "category" ? "active" : ""}
        onClick={onCategory}
      >
        <i className="ti ti-tag" style={{ fontSize: 20 }} />
        Category
      </button>
      <button disabled style={{ opacity: 0.35, cursor: "not-allowed", position: "relative" }}>
        <span
          style={{
            position: "absolute",
            top: -2,
            right: "18%",
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: "0.3px",
            color: "var(--pm-accent)",
            background: "var(--pm-accent-bg)",
            padding: "1px 4px",
            borderRadius: 6,
          }}
        >
          SOON
        </span>
        <i className="ti ti-chart-pie" style={{ fontSize: 20 }} />
        Budget
      </button>
      <button className={active === "profile" ? "active" : ""} onClick={onProfile}>
        <i className="ti ti-user" style={{ fontSize: 20 }} />
        Profile
      </button>
    </div>
  );
}
