import { useEffect, useState } from "react";
import { getProfile, signOut } from "../lib/queries";
import TabBar from "./TabBar";
import "../styles/pocketmaster.css";

export default function Profile({ onHome, onOpenPocketsList, onOpenCategory, onOpenBudget, onOpenAccountSettings }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  return (
    <div className="pm-app">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--pm-text-primary)" }}>Profile</p>
        <button
          onClick={onOpenAccountSettings}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--pm-surface)",
            border: "1px solid var(--pm-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <i className="ti ti-settings" style={{ fontSize: 17, color: "var(--pm-text-secondary)" }} />
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--pm-surface)", margin: "0 auto 12px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-user" style={{ fontSize: 32, color: "var(--pm-text-muted)" }} />
          <span style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--pm-accent)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--pm-bg)" }}>
            <i className="ti ti-camera" style={{ fontSize: 12, color: "#fff" }} />
          </span>
        </div>
        <p style={{ fontSize: 19, fontWeight: 700, margin: "0 0 3px", color: "var(--pm-text-primary)" }}>
          {profile?.full_name || profile?.username || ""}
        </p>
        <p style={{ fontSize: 13, color: "var(--pm-text-secondary)", margin: 0 }}>
          @{profile?.username || ""}
        </p>
      </div>

      <div style={{ height: 0.5, background: "var(--pm-border)", margin: "20px 0" }} />

      <div className="pm-card" style={{ marginBottom: 16, opacity: 0.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <i className="ti ti-users" style={{ fontSize: 15, color: "var(--pm-text-secondary)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Share Pocket</p>
          <span style={{ fontSize: 10, background: "var(--pm-surface-2)", color: "var(--pm-text-secondary)", padding: "2px 8px", borderRadius: 8, marginLeft: "auto" }}>Coming soon</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--pm-text-muted)", margin: 0 }}>
          Share your pockets using your username, once this launches
        </p>
      </div>

      <div className="pm-card" style={{ padding: 0 }}>
        <button className="pm-row" onClick={onOpenAccountSettings} style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left", padding: "14px 16px" }}>
          <i className="ti ti-user-circle" style={{ fontSize: 17, color: "var(--pm-text-secondary)" }} />
          <p style={{ fontSize: 14, flex: 1, margin: 0 }}>Account Settings</p>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--pm-text-muted)" }} />
        </button>
        <div className="pm-row" style={{ padding: "14px 16px" }}>
          <i className="ti ti-lock" style={{ fontSize: 17, color: "var(--pm-text-secondary)" }} />
          <p style={{ fontSize: 14, flex: 1, margin: 0 }}>Change Password</p>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--pm-text-muted)" }} />
        </div>
        <div className="pm-row" style={{ padding: "14px 16px" }}>
          <i className="ti ti-bell" style={{ fontSize: 17, color: "var(--pm-text-secondary)" }} />
          <p style={{ fontSize: 14, flex: 1, margin: 0 }}>Notifications</p>
          <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--pm-text-muted)" }} />
        </div>
        <button className="pm-row" onClick={signOut} style={{ padding: "14px 16px", width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
          <i className="ti ti-logout" style={{ fontSize: 17, color: "var(--pm-danger)" }} />
          <p style={{ fontSize: 14, flex: 1, margin: 0, color: "var(--pm-danger)" }}>Log Out</p>
        </button>
      </div>

      <TabBar
        active="profile"
        onHome={onHome}
        onPocket={onOpenPocketsList}
        onCategory={onOpenCategory}
        onBudget={onOpenBudget}
        onProfile={() => {}}
      />
    </div>
  );
}
