import { useState } from "react";
import { updateUserPassword } from "../lib/queries";
import "../styles/pocketmaster.css";

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

  const canSubmit =
    passwordValid && password === confirmPassword && !saving;

  function RuleRow({ ok, label }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: ok ? "var(--pm-success)" : "var(--pm-text-muted, #7d8790)",
        }}
      >
        <i
          className={ok ? "ti ti-circle-check" : "ti ti-circle"}
          style={{ fontSize: 13 }}
        />
        {label}
      </div>
    );
  }

  async function handleSave() {
    if (!canSubmit) return;

    setSaving(true);
    setError("");

    try {
      await updateUserPassword(password);
      onDone?.();
    } catch (e) {
      setError(e.message || "Something went wrong, please try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="pm-app"
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(34,211,238,0.45)",
          padding: "28px 22px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 24,
            height: 24,
            borderTop: "2px solid var(--pm-accent)",
            borderLeft: "2px solid var(--pm-accent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 24,
            height: 24,
            borderBottom: "2px solid var(--pm-accent)",
            borderRight: "2px solid var(--pm-accent)",
          }}
        />

        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: "0 0 6px",
            textAlign: "center",
          }}
        >
          Set New Password
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--pm-text-secondary)",
            textAlign: "center",
            margin: "0 0 20px",
          }}
        >
          Choose a strong new password for your account.
        </p>

        <p className="pm-label">NEW PASSWORD</p>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            className="pm-input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{ boxSizing: "border-box", width: "100%", paddingRight: 40 }}
          />
          <i
            className={showPassword ? "ti ti-eye-off" : "ti ti-eye"}
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--pm-text-muted, #7d8790)",
              cursor: "pointer",
              fontSize: 17,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            margin: "8px 0 16px",
            padding: "10px 12px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 6,
          }}
        >
          <RuleRow ok={hasMinLength} label="At least 6 characters" />
          <RuleRow ok={hasLetter} label="Contains a letter" />
          <RuleRow ok={hasNumber} label="Contains a number" />
          <RuleRow ok={hasSpecial} label="Contains a special character" />
        </div>

        <p className="pm-label">CONFIRM PASSWORD</p>
        <div style={{ position: "relative", marginBottom: 18 }}>
          <input
            className="pm-input"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            style={{ boxSizing: "border-box", width: "100%", paddingRight: 40 }}
          />
          <i
            className={showConfirmPassword ? "ti ti-eye-off" : "ti ti-eye"}
            onClick={() => setShowConfirmPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--pm-text-muted, #7d8790)",
              cursor: "pointer",
              fontSize: 17,
            }}
          />
        </div>

        {confirmPassword && password !== confirmPassword && (
          <p
            style={{
              fontSize: 12,
              color: "var(--pm-danger)",
              margin: "-10px 0 14px",
            }}
          >
            Passwords do not match.
          </p>
        )}

        {error && (
          <p
            style={{
              fontSize: 12,
              color: "var(--pm-danger)",
              margin: "-10px 0 14px",
            }}
          >
            {error}
          </p>
        )}

        <button
          className="pm-btn-hud"
          onClick={handleSave}
          disabled={!canSubmit}
        >
          {saving ? "Saving..." : "SAVE NEW PASSWORD"}
        </button>
      </div>
    </div>
  );
}
