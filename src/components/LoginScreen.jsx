import { useState } from "react";
import { signIn, signUp, requestPasswordReset } from "../lib/queries";
import "../styles/pocketmaster.css";

export default function LoginScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const isRegister = mode === "register";

  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

  const canSubmit =
    email.trim() &&
    (isRegister ? passwordValid && password === confirmPassword : password.length > 0);

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

  function RuleRow({ ok, label }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: ok ? "var(--pm-success)" : "var(--pm-text-muted, #7d8790)" }}>
        <i className={ok ? "ti ti-circle-check" : "ti ti-circle"} style={{ fontSize: 13 }} />
        {label}
      </div>
    );
  }

  async function handleForgotSubmit() {
    setForgotError("");
    setForgotLoading(true);
    try {
      await requestPasswordReset(forgotEmail.trim());
      setForgotSent(true);
    } catch (e) {
      setForgotError(e.message || "Something went wrong, please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  if (forgotMode) {
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

        <p
          onClick={() => {
            setForgotMode(false);
            setForgotSent(false);
            setForgotEmail("");
            setForgotError("");
          }}
          style={{
            fontSize: 12,
            color: "var(--pm-text-secondary)",
            textAlign: "center",
            margin: "0 0 20px",
            cursor: "pointer",
          }}
        >
          &larr; Back to login
        </p>

        {!forgotSent ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <i className="ti ti-key" style={{ fontSize: 26, color: "var(--pm-accent)" }} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: "10px 0 4px" }}>
                Forgot Password
              </p>
              <p style={{ fontSize: 12, color: "var(--pm-text-secondary)", margin: 0 }}>
                Enter your email and we will send you a reset link.
              </p>
            </div>

            <p className="pm-label">EMAIL</p>
            <input
              className="pm-input"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="name@email.com"
              style={{ marginBottom: 16, boxSizing: "border-box" }}
            />

            {forgotError && (
              <p style={{ fontSize: 12, color: "var(--pm-danger)", margin: "0 0 16px" }}>
                {forgotError}
              </p>
            )}

            <button
              className="pm-btn-hud"
              onClick={handleForgotSubmit}
              disabled={!forgotEmail.trim() || forgotLoading}
            >
              {forgotLoading ? "Sending..." : "SEND RESET LINK"}
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <i className="ti ti-mail-check" style={{ fontSize: 28, color: "var(--pm-success)" }} />
            <p
              style={{
                fontSize: 14,
                color: "var(--pm-success)",
                margin: "12px 0 6px",
                fontWeight: 600,
              }}
            >
              Check your email
            </p>
            <p style={{ fontSize: 12, color: "var(--pm-text-secondary)", margin: 0 }}>
              We sent a reset link to {forgotEmail}. Follow the link to set a
              new password.
            </p>
          </div>
        )}
      </div>
    );
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

      {!isRegister && (
        <p style={{ fontSize: 12, color: "var(--pm-text-muted, #7d8790)", margin: "0 0 16px", lineHeight: 1.5 }}>
          Log in with your email or username.
        </p>
      )}

      <p className="pm-label">{isRegister ? "EMAIL" : "EMAIL OR USERNAME"}</p>
      <input
        className="pm-input"
        type={isRegister ? "email" : "text"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={isRegister ? "name@email.com" : "name@email.com or username"}
        style={{ marginBottom: 16, boxSizing: "border-box" }}
      />

      <p className="pm-label">PASSWORD</p>
      <div style={{ position: "relative", marginBottom: isRegister ? 8 : 8 }}>
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

      {isRegister && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, margin: "8px 0 16px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
          <RuleRow ok={hasMinLength} label="At least 6 characters" />
          <RuleRow ok={hasLetter} label="Contains a letter" />
          <RuleRow ok={hasNumber} label="Contains a number" />
          <RuleRow ok={hasSpecial} label="Contains a special character" />
        </div>
      )}

      {isRegister && (
        <>
          <p className="pm-label">CONFIRM PASSWORD</p>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              className="pm-input"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
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
        </>
      )}

      {!isRegister && (
        <p
          onClick={() => setForgotMode(true)}
          style={{ fontSize: 12, color: "var(--pm-accent)", textAlign: "right", margin: "0 0 24px", cursor: "pointer" }}
        >
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
