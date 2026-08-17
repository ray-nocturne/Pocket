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
      <button className={active === "budget" ? "active" : ""} onClick={onBudget}>
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
