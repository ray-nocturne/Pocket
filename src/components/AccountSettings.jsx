import { useEffect, useState } from "react";
import { getProfile, updateProfileDetails, deactivateAccount } from "../lib/queries";
import { supabase } from "../lib/supabaseClient";
import "../styles/pocketmaster.css";

export default function AccountSettings({ onBack, onAccountDeleted }) {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setFullName(p.full_name || "");
      setUsername(p.username || "");
    });

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || "");
    });
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateProfileDetails(profile.id, { username, fullName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEmail() {
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
      if (updateError) throw updateError;
      setEditingEmail(false);
      setError("");
      alert("Check both your old and new email inbox to confirm this change.");
    } catch (e) {
      setError(e.message || "Failed to change email.");
    }
  }

  const canDelete = confirmText === username && !!username;

  async function handleDeleteAccount() {
    if (!canDelete || !profile) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deactivateAccount(profile.id);
      onAccountDeleted?.();
    } catch (e) {
      setDeleteError(e.message || "Failed to delete account.");
      setDeleting(false);
    }
  }

  return (
    <div className="pm-app">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--pm-text-primary)", cursor: "pointer" }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 22 }} />
        </button>
        <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--pm-text-primary)" }}>Account Settings</p>
      </div>

      <p className="pm-label">Name</p>
      <input
        className="pm-input"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Your name"
        style={{ marginBottom: 6, boxSizing: "border-box" }}
      />
      <p style={{ fontSize: 11, color: "var(--pm-text-muted)", margin: "0 0 20px" }}>
        Shown as your display name across the app
      </p>

      <p className="pm-label">Username</p>
      <input
        className="pm-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        style={{ marginBottom: 6, boxSizing: "border-box" }}
      />
      <p style={{ fontSize: 11, color: "var(--pm-text-muted)", margin: "0 0 20px" }}>
        Used to log in and to share pockets with others. Must be unique
      </p>

      <p className="pm-label">Email</p>
      {!editingEmail ? (
        <div
          className="pm-input"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            boxSizing: "border-box",
          }}
        >
          <span>{email}</span>
          <button
            onClick={() => {
              setNewEmail(email);
              setEditingEmail(true);
            }}
            style={{ background: "none", border: "none", color: "var(--pm-accent)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Change
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <input
            className="pm-input"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={{ marginBottom: 6, boxSizing: "border-box" }}
          />
          <p style={{ fontSize: 11, color: "var(--pm-text-muted)", margin: "0 0 10px" }}>
            Changing your email requires confirmation from your inbox
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setEditingEmail(false)}
              style={{ flex: 1, background: "var(--pm-surface)", border: "1px solid var(--pm-border)", borderRadius: 10, padding: "10px", color: "var(--pm-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleChangeEmail}
              style={{ flex: 1, background: "rgba(34,211,238,0.3)", border: "1px solid var(--pm-accent)", borderRadius: 10, padding: "10px", color: "var(--pm-accent)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: "var(--pm-danger)", margin: "0 0 16px" }}>{error}</p>}

      <button className="pm-btn-primary" onClick={handleSave} disabled={saving} style={{ marginBottom: 10 }}>
        {saving ? "Saving..." : "Save changes"}
      </button>

      {saved && (
        <p style={{ fontSize: 12, color: "var(--pm-success)", textAlign: "center", margin: "0 0 24px" }}>
          <i className="ti ti-check" style={{ marginRight: 4 }} />
          Saved
        </p>
      )}
      {!saved && <div style={{ marginBottom: 24 }} />}

      <div
        style={{
          border: "1px solid rgba(255,92,122,0.3)",
          borderRadius: 12,
          padding: 16,
          background: "rgba(255,92,122,0.05)",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--pm-danger)", margin: "0 0 6px" }}>Delete account</p>
        <p style={{ fontSize: 12, color: "var(--pm-text-secondary)", margin: "0 0 14px" }}>
          This deactivates your account. You won't be able to log in, and your data stays intact.
        </p>

        <p style={{ fontSize: 11, color: "var(--pm-text-secondary)", margin: "0 0 6px" }}>
          Type <span className="pm-num" style={{ color: "var(--pm-text-primary)" }}>{username}</span> to confirm
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Enter username"
          style={{
            width: "100%",
            background: "var(--pm-surface)",
            border: "1px solid rgba(255,92,122,0.3)",
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            color: "var(--pm-text-primary)",
            fontSize: 14,
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />

        {deleteError && <p style={{ fontSize: 12, color: "var(--pm-danger)", margin: "0 0 10px" }}>{deleteError}</p>}

        <button
          onClick={handleDeleteAccount}
          disabled={!canDelete || deleting}
          style={{
            width: "100%",
            background: canDelete ? "rgba(255,92,122,0.15)" : "rgba(255,92,122,0.06)",
            border: `1px solid ${canDelete ? "var(--pm-danger)" : "rgba(255,92,122,0.15)"}`,
            borderRadius: 10,
            padding: 13,
            color: canDelete ? "var(--pm-danger)" : "var(--pm-text-muted)",
            fontSize: 14,
            fontWeight: 600,
            cursor: canDelete ? "pointer" : "not-allowed",
          }}
        >
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}
