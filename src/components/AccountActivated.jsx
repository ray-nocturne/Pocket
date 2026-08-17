import "../styles/pocketmaster.css";

export default function AccountActivated({ onContinue }) {
  return (
    <div
      className="pm-app"
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "48px 20px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          boxSizing: "border-box",
          border: "1px solid rgba(34,211,238,0.45)",
          background:
            "linear-gradient(rgba(34,211,238,0.025), rgba(34,211,238,0.01))",
          padding: "48px 28px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 34,
            height: 34,
            borderTop: "2px solid var(--pm-accent)",
            borderLeft: "2px solid var(--pm-accent)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 34,
            height: 34,
            borderTop: "2px solid var(--pm-accent)",
            borderRight: "2px solid var(--pm-accent)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 34,
            height: 34,
            borderBottom: "2px solid var(--pm-accent)",
            borderLeft: "2px solid var(--pm-accent)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 34,
            height: 34,
            borderBottom: "2px solid var(--pm-accent)",
            borderRight: "2px solid var(--pm-accent)",
          }}
        />

        <div
          style={{
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: "50%",
              border: "2px solid var(--pm-accent)",
              background: "rgba(34,211,238,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              boxShadow: "0 0 0 10px rgba(34,211,238,0.025)",
            }}
          >
            <i
              className="ti ti-check"
              style={{
                fontSize: 58,
                color: "var(--pm-accent)",
              }}
            />
          </div>

          <p
            style={{
              margin: "0 0 12px",
              color: "var(--pm-accent)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 4,
            }}
          >
            ACCOUNT ACTIVATED
          </p>

          <h1
            style={{
              margin: 0,
              color: "var(--pm-text-primary)",
              fontSize: "clamp(30px, 7vw, 48px)",
              lineHeight: 1.08,
              fontWeight: 700,
            }}
          >
            Email Verified
            <br />
            Successfully!
          </h1>
        </div>

        <div
          style={{
            textAlign: "center",
            color: "var(--pm-text-secondary)",
            fontSize: 15,
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          <p style={{ margin: 0 }}>
            Your email has been verified successfully.
          </p>
          <p style={{ margin: 0 }}>
            Your Pocket Master account is now{" "}
            <span style={{ color: "var(--pm-accent)" }}>
              active
            </span>
            .
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "20px",
            marginBottom: 24,
            border: "1px solid rgba(34,211,238,0.2)",
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              flex: "0 0 54px",
              borderRadius: "50%",
              border: "1px solid rgba(34,211,238,0.45)",
              background: "rgba(34,211,238,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className="ti ti-mail-check"
              style={{
                fontSize: 26,
                color: "var(--pm-accent)",
              }}
            />
          </div>

          <p
            style={{
              margin: 0,
              color: "var(--pm-text-primary)",
              fontSize: 15,
              lineHeight: 1.65,
            }}
          >
            You can now sign in using your{" "}
            <span style={{ color: "var(--pm-accent)" }}>
              registered email and password
            </span>{" "}
            to continue.
          </p>
        </div>

        <button
          className="pm-btn-hud"
          onClick={onContinue}
          style={{
            width: "100%",
            minHeight: 54,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          CONTINUE TO LOGIN
          <i
            className="ti ti-arrow-right"
            style={{
              marginLeft: 10,
              verticalAlign: "middle",
            }}
          />
        </button>

        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid rgba(34,211,238,0.12)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--pm-text-muted)",
              fontSize: 12,
            }}
          >
            Need help?
          </p>

          <button
            type="button"
            style={{
              marginTop: 12,
              border: 0,
              background: "none",
              color: "var(--pm-text-secondary)",
              fontFamily: "inherit",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <i
              className="ti ti-help-circle"
              style={{
                marginRight: 8,
                color: "var(--pm-accent)",
                verticalAlign: "middle",
              }}
            />
            Contact Support
          </button>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 560,
          display: "flex",
          justifyContent: "center",
          gap: 28,
          marginTop: 24,
          color: "var(--pm-text-muted)",
          fontSize: 11,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        <span>
          <i
            className="ti ti-shield-check"
            style={{
              color: "var(--pm-accent)",
              marginRight: 6,
              verticalAlign: "middle",
            }}
          />
          Your data is protected
        </span>

        <span>
          <i
            className="ti ti-lock"
            style={{
              color: "var(--pm-accent)",
              marginRight: 6,
              verticalAlign: "middle",
            }}
          />
          Your information stays private
        </span>
      </div>
    </div>
  );
}
