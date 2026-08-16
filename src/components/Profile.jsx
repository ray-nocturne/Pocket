import { useEffect, useRef, useState } from "react";
import {
  getProfile,
  signOut,
  uploadAvatar,
  updateCurrencySettings,
} from "../lib/queries";
import TabBar from "./TabBar";
import "../styles/pocketmaster.css";
import { currencies, SEPARATOR_STYLES } from "../lib/currency";
import { useCurrency } from "../lib/CurrencyContext";

const FRAME = 220;
const OUTPUT = 400;

export default function Profile({ onHome, onOpenPocketsList, onOpenCategory, onOpenBudget, onOpenAccountSettings }) {
  const {
    currency,
    numberFormat,
    showDecimals,
    refreshCurrencySettings,
  } = useCurrency();

  const [profile, setProfile] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("IDR");
  const [selectedNumberFormat, setSelectedNumberFormat] = useState("eu");
  const [selectedShowDecimals, setSelectedShowDecimals] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const [cropSrc, setCropSrc] = useState(null);
  const [imgSize, setImgSize] = useState(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const dragRef = useRef(null);
  const imgElRef = useRef(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be smaller than 8MB.");
      return;
    }

    setUploadError("");

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const baseScale = Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight);
      const displayWidth = img.naturalWidth * baseScale;
      const displayHeight = img.naturalHeight * baseScale;

      setImgSize({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, baseScale, displayWidth, displayHeight });
      setPos({ left: (FRAME - displayWidth) / 2, top: (FRAME - displayHeight) / 2 });
      setCropSrc(url);
    };
    img.src = url;

    e.target.value = "";
  }

  function clamp(pos, size) {
    if (!size) return pos;
    const minLeft = FRAME - size.displayWidth;
    const minTop = FRAME - size.displayHeight;
    return {
      left: Math.min(0, Math.max(minLeft, pos.left)),
      top: Math.min(0, Math.max(minTop, pos.top)),
    };
  }

  function handlePointerDown(e) {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.left,
      startTop: pos.top,
    };
    e.target.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(
      clamp(
        { left: dragRef.current.startLeft + dx, top: dragRef.current.startTop + dy },
        imgSize
      )
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function cancelCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setImgSize(null);
  }

  async function saveCrop() {
    if (!imgSize || !imgElRef.current) return;

    setUploading(true);
    setUploadError("");

    try {
      const sx = -pos.left / imgSize.baseScale;
      const sy = -pos.top / imgSize.baseScale;
      const sSize = FRAME / imgSize.baseScale;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgElRef.current, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const url = await uploadAvatar(file);
      setProfile((p) => ({ ...p, avatar_url: url }));
      cancelCrop();
    } catch (error) {
      console.error("Failed uploading avatar:", error);
      setUploadError(error.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveCurrencySettings() {
    if (!profile) return;

    setSavingCurrency(true);

    try {
      await updateCurrencySettings(profile.id, {
        currency: selectedCurrency,
        numberFormat: selectedNumberFormat,
        showDecimals: selectedShowDecimals,
      });

      await refreshCurrencySettings();

      setProfile((p) => ({
        ...p,
        currency: selectedCurrency,
        number_format: selectedNumberFormat,
        show_decimals: selectedShowDecimals,
      }));
    } catch (error) {
      console.error(
        "Failed saving currency settings:",
        error
      );
    } finally {
      setSavingCurrency(false);
    }
  }

  if (cropSrc) {
    return (
      <div className="pm-app" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 20px", color: "var(--pm-text-primary)" }}>
          Drag to reposition
        </p>

        <div
          style={{
            width: FRAME,
            height: FRAME,
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto 24px",
            position: "relative",
            background: "var(--pm-surface)",
            touchAction: "none",
            cursor: "grab",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <img
            ref={imgElRef}
            src={cropSrc}
            alt="Crop preview"
            draggable={false}
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              width: imgSize?.displayWidth,
              height: imgSize?.displayHeight,
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        {uploadError && (
          <p style={{ fontSize: 12, color: "var(--pm-danger)", margin: "0 0 16px" }}>{uploadError}</p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={cancelCrop}
            disabled={uploading}
            style={{ flex: 1, background: "var(--pm-surface)", border: "1px solid var(--pm-border)", borderRadius: 12, padding: 14, color: "var(--pm-text-primary)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={saveCrop}
            disabled={uploading}
            className="pm-btn-primary"
            style={{ flex: 1 }}
          >
            {uploading ? "Saving..." : "Use photo"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-app">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--pm-text-primary)" }}>Profile</p>

      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--pm-surface)", margin: "0 auto 12px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <i className="ti ti-user" style={{ fontSize: 32, color: "var(--pm-text-muted)" }} />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--pm-accent)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--pm-bg)", cursor: "pointer" }}
          >
            <i className="ti ti-camera" style={{ fontSize: 12, color: "#fff" }} />
          </button>
        </div>

        {uploadError && (
          <p style={{ fontSize: 11, color: "var(--pm-danger)", margin: "0 0 8px" }}>{uploadError}</p>
        )}

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

      <div className="pm-card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <i
            className="ti ti-currency-dollar"
            style={{
              fontSize: 17,
              color: "var(--pm-text-secondary)",
            }}
          />
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
              flex: 1,
            }}
          >
            Currency
          </p>
        </div>

        <select
          className="pm-input"
          value={selectedCurrency}
          onChange={(e) =>
            setSelectedCurrency(e.target.value)
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 12,
          }}
        >
          {currencies.map((item) => (
            <option
              key={item.code}
              value={item.code}
            >
              {item.code} — {item.name} ({item.symbol})
            </option>
          ))}
        </select>

        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: "0 0 8px",
              color: "var(--pm-text-secondary)",
            }}
          >
            Number format
          </p>

          <select
            className="pm-input"
            value={selectedNumberFormat}
            onChange={(e) =>
              setSelectedNumberFormat(e.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {SEPARATOR_STYLES.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.example}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="pm-btn-primary"
          onClick={handleSaveCurrencySettings}
          disabled={savingCurrency}
          style={{
            width: "100%",
          }}
        >
          {savingCurrency
            ? "Saving..."
            : "Save Currency Settings"}
        </button>
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
