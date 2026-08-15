import { useEffect, useState } from "react";
import { getProfile, updateProfile, signOut } from "../lib/queries";
import "../styles/pocketmaster.css";

export default function Profile({ onHome }) {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setUsername(p.username);
    });
  }, []);

  function handleBlur() {
    if (profile && username !== profile.username) updateProfile(profile.id, username);
  }

  return (
    <div className="pm-app">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <p style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Profile</p>
        <i className="ti ti-settings" style={{ fontSize: 20, color: "var(--pm-text-secondary)" }} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--pm-surface)", margin: "0 auto 14px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-user" style={{ fontSize: 36, color: "var(--pm-text-muted)" }} />
          <span style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--pm-accent)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #000" }}>
            <i className="ti ti-camera" style={{ fontSize: 13, color: "#fff" }} />
          </span>
        </div>
        <input value={username} onChange={(e) => setUsername(e.target.value)} onBlur={handleBlur} style={{ background: "none", border: "none", outline: "none", color: "var(--pm-text-primary)", fontSize: 20, fontWeight: 600, textAlign: "center", width: "100%", fontFamily: "inherit" }} />
      </div>

      <div style={{ height: 0.5, background: "var(--pm-border)", margin: "20px 0" }} />

      <div className="pm-card" style={{ marginBottom: 24, opacity: 0.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <i className="ti ti-users" style={{ fontSize: 15, color: "var(--pm-text-secondary)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Share Pocket</p>
          <span style={{ fontSize: 10, background: "var(--pm-surface-2)", color: "var(--pm-text-secondary)", padding: "2px 8px", borderRadius: 8, marginLeft: "auto" }}>Coming soon</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--pm-text-muted)", margin: 0 }}>You'll be able to share pockets with others here soon</p>
      </div>

      <div className="pm-card" style={{ padding: 0 }}>
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

      <div className="pm-tabbar">
        <button onClick={onHome}><i className="ti ti-home" style={{ fontSize: 20 }} />Home</button>
        <button className="active"><i className="ti ti-user" style={{ fontSize: 20 }} />Profile</button>
      </div>
    </div>
  );
}