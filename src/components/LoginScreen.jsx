import { useState } from "react";
import { signIn, signUp } from "../lib/queries";
import "../styles/pocketmaster.css";

export default function LoginScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const canSubmit =
    email.trim() &&
    password.length >= 6 &&
    (!isRegister || password === confirmPassword);

  async function handleSubmit() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email.trim(), password);
        setInfo("Account created. Check your email to confirm before logging in.");
      } else {
        await signIn(email.trim(), password);
        onAuthed?.();
      }
    } catch (e) {
      setError(e.message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pm-app" style={{ paddingTop: 60, minHeight: "100vh", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--pm-accent-bg)",
            border: "1px solid rgba(34,211,238,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}
        >
          <i className="ti ti-wallet" style={{ fontSize: 24, color: "var(--pm-accent)" }} />
        </div>
        <p style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: 1 }}>POCKET MASTER</p>
      </div>

      <div className="pm-segmented-hud" style={{ marginBottom: 24 }}>
        <button
          className={!isRegister ? "active" : ""}
          onClick={() => {
            setMode("login");
            setError("");
            setInfo("");
          }}
        >
          LOG IN
        </button>
        <button
          className={isRegister ? "active" : ""}
          onClick={() => {
            setMode("register");
            setError("");
            setInfo("");
          }}
        >
          SIGN UP
        </button>
      </div>

      <p className="pm-label">EMAIL</p>
      <input
        className="pm-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@email.com"
        style={{ marginBottom: 16, boxSizing: "border-box" }}
      />

      <p className="pm-label">PASSWORD</p>
      <input
        className="pm-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 6 characters"
        style={{ marginBottom: isRegister ? 16 : 8, boxSizing: "border-box" }}
      />

      {isRegister && (
        <>
          <p className="pm-label">CONFIRM PASSWORD</p>
          <input
            className="pm-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            style={{ marginBottom: 8, boxSizing: "border-box" }}
          />
        </>
      )}

      {!isRegister && (
        <p style={{ fontSize: 12, color: "var(--pm-accent)", textAlign: "right", margin: "0 0 24px", cursor: "pointer" }}>
          Forgot password?
        </p>
      )}

      {error && <p style={{ fontSize: 12, color: "var(--pm-danger)", margin: "8px 0 16px" }}>{error}</p>}
      {info && <p style={{ fontSize: 12, color: "var(--pm-success)", margin: "8px 0 16px" }}>{info}</p>}

      <button className="pm-btn-hud" onClick={handleSubmit} disabled={!canSubmit || loading}>
        {loading ? "Processing..." : isRegister ? "SIGN UP" : "LOG IN"}
      </button>
    </div>
  );
}