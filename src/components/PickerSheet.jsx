import { useMemo, useState } from "react";

/**
 * Generic searchable bottom-sheet picker.
 * Replaces native <select> for long option lists (pockets, categories)
 * to avoid iOS WebKit scroll quirks and add search/filter.
 *
 * options: [{ value, label, hint?, group? }]
 */
export default function PickerSheet({
  open,
  onClose,
  title,
  options,
  value,
  onSelect,
  searchPlaceholder = "Search...",
}) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(q)
    );

    const groups = {};
    filtered.forEach((o) => {
      const key = o.group || "";
      (groups[key] = groups[key] || []).push(o);
    });

    return groups;
  }, [options, query]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxHeight: "75vh",
          background: "var(--pm-bg)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          border: "1px solid rgba(34,211,238,0.25)",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--pm-text-secondary)",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 12 }}>
          <input
            autoFocus
            type="text"
            className="pm-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            style={{ boxSizing: "border-box", width: "100%" }}
          />
        </div>

        <div style={{ overflowY: "auto", paddingBottom: 8 }}>
          {Object.entries(grouped).length === 0 && (
            <p
              style={{
                fontSize: 13,
                color: "var(--pm-text-muted)",
                textAlign: "center",
                padding: 24,
              }}
            >
              No matches found
            </p>
          )}

          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName || "_"}>
              {groupName && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--pm-text-muted)",
                    padding: "10px 16px 4px",
                    margin: 0,
                  }}
                >
                  {groupName}
                </p>
              )}

              {items.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    textAlign: "left",
                    background:
                      item.value === value
                        ? "rgba(34,211,238,0.08)"
                        : "none",
                    border: "none",
                    color: "var(--pm-text-primary)",
                    fontSize: 14,
                    padding: "12px 16px",
                    cursor: "pointer",
                  }}
                >
                  <span>{item.label}</span>
                  {item.hint && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--pm-text-secondary)",
                      }}
                    >
                      {item.hint}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
