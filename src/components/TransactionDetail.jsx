import { useState } from "react";
import { deleteTransaction } from "../lib/queries";
import { useCurrency } from "../lib/CurrencyContext";
import "../styles/pocketmaster.css";

const formatIDR = (value, formatMoney) =>
  formatMoney(value);

function formatDate(date) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function paymentMethodLabel(value) {
  const labels = {
    bank_transfer: "Bank Transfer",
    debit: "Debit",
    credit: "Credit",
    qris: "QRIS",
    cash: "Cash",
  };

  return labels[value] || value || "-";
}

export default function TransactionDetail({
  transaction,
  onBack,
  onEdit,
  onDeleted,
}) {
  const { formatMoney } = useCurrency();

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!transaction) {
    return (
      <div className="pm-app">
        <p>No transaction selected.</p>

        <button
          className="pm-btn-primary"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    );
  }

  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const isTransfer = transaction.type === "transfer";

  const amountColor = isIncome
    ? "var(--pm-success)"
    : isExpense
    ? "var(--pm-danger)"
    : "var(--pm-accent)";

  const amountPrefix = isIncome
    ? "+"
    : isExpense
    ? "-"
    : "";

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this transaction?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteTransaction(transaction.id);

      onDeleted?.();
    } catch (err) {
      console.error(
        "Failed deleting transaction:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete transaction."
      );

      setDeleting(false);
    }
  }

  return (
    <div className="pm-app">

      {/* ================================================================ */}
      {/* Header */}
      {/* ================================================================ */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          disabled={deleting}
          style={{
            background: "none",
            border: "none",
            color: "var(--pm-text-primary)",
            cursor: deleting
              ? "default"
              : "pointer",
            padding: 0,
            opacity: deleting ? 0.4 : 1,
          }}
        >
          <i
            className="ti ti-chevron-left"
            style={{
              fontSize: 24,
            }}
          />
        </button>

        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Transaction
        </p>

        <button
          type="button"
          onClick={() =>
            onEdit?.(transaction)
          }
          disabled={deleting}
          style={{
            background: "none",
            border: "none",
            color: deleting
              ? "var(--pm-text-muted)"
              : "var(--pm-accent)",
            fontWeight: 600,
            fontSize: 14,
            cursor: deleting
              ? "default"
              : "pointer",
          }}
        >
          Edit
        </button>
      </div>

      {/* ================================================================ */}
      {/* Amount */}
      {/* ================================================================ */}

      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <p
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: amountColor,
            margin: "0 0 8px",
            letterSpacing: "-1px",
          }}
        >
          {amountPrefix}
          {formatIDR(transaction.amount, formatMoney)}
        </p>

        <p
          style={{
            fontSize: 15,
            color:
              "var(--pm-text-secondary)",
            margin: 0,
          }}
        >
          {transaction.description ||
            transaction.category?.name ||
            (isTransfer
              ? "Transfer"
              : "Transaction")}
        </p>
      </div>

      {/* ================================================================ */}
      {/* Error */}
      {/* ================================================================ */}

      {error && (
        <div
          style={{
            background:
              "rgba(255,107,82,0.1)",
            border:
              "1px solid rgba(255,107,82,0.3)",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color:
                "var(--pm-danger)",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* Details */}
      {/* ================================================================ */}

      <div
        className="pm-card"
        style={{
          padding: 18,
        }}
      >

        <DetailRow
          label="Type"
          value={
            isIncome
              ? "Income"
              : isExpense
              ? "Expense"
              : "Transfer"
          }
        />

        <DetailRow
          label="Date"
          value={formatDate(
            transaction.date
          )}
        />

        {isIncome && (
          <>
            <DetailRow
              label="To pocket"
              value={
                transaction.to_pocket
                  ?.name || "-"
              }
            />

            {transaction.source_text && (
              <DetailRow
                label="Source"
                value={
                  transaction.source_text
                }
              />
            )}
          </>
        )}

        {isExpense && (
          <>
            <DetailRow
              label="From pocket"
              value={
                transaction
                  .from_pocket
                  ?.name || "-"
              }
            />

            {transaction.payee && (
              <DetailRow
                label="For whom"
                value={
                  transaction.payee
                }
              />
            )}
          </>
        )}

        {isTransfer && (
          <>
            <DetailRow
              label="From"
              value={
                transaction
                  .from_pocket
                  ?.name || "-"
              }
            />

            <DetailRow
              label="To"
              value={
                transaction
                  .to_pocket
                  ?.name || "-"
              }
            />
          </>
        )}

        {transaction.category?.name && (
          <DetailRow
            label="Category"
            value={
              transaction.category.name
            }
          />
        )}

        {transaction.payment_method && (
          <DetailRow
            label="Payment method"
            value={paymentMethodLabel(
              transaction.payment_method
            )}
          />
        )}

        {transaction.fee_amount &&
          Number(
            transaction.fee_amount
          ) > 0 && (
            <DetailRow
              label="Transaction fee"
              value={formatIDR(
                transaction.fee_amount,
                formatMoney
              )}
            />
          )}
      </div>

      {/* ================================================================ */}
      {/* Proof of transaction */}
      {/* ================================================================ */}

      {transaction.proof_url && (
        <a
        
          href={transaction.proof_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            marginTop: 16,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(34,211,238,0.25)",
          }}
        >
          <img
            src={transaction.proof_url}
            alt="Proof of transaction"
            style={{
              width: "100%",
              maxHeight: 260,
              objectFit: "cover",
              display: "block",
            }}
          />

          <div
            style={{
              padding: "8px 12px",
              fontSize: 12,
              color: "var(--pm-accent)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className="ti ti-photo" style={{ fontSize: 14 }} />
            View full size
          </div>
        </a>
      )}

      {/* ================================================================ */}
      {/* Delete */}
      {/* ================================================================ */}

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "14px 16px",
          background:
            "rgba(255,107,82,0.10)",
          border:
            "1px solid rgba(255,107,82,0.25)",
          borderRadius: 14,
          color: "var(--pm-danger)",
          fontSize: 14,
          fontWeight: 600,
          cursor: deleting
            ? "default"
            : "pointer",
          opacity: deleting ? 0.6 : 1,
        }}
      >
        {deleting
          ? "Deleting..."
          : "Delete Transaction"}
      </button>

      {/* ================================================================ */}
      {/* Transaction ID */}
      {/* ================================================================ */}

      <p
        style={{
          fontSize: 10,
          color:
            "var(--pm-text-muted)",
          textAlign: "center",
          marginTop: 24,
          wordBreak: "break-all",
        }}
      >
        Transaction ID:{" "}
        {transaction.id}
      </p>
    </div>
  );
}

/* ====================================================================== */
/* Detail Row */
/* ====================================================================== */

function DetailRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "flex-start",
        gap: 20,
        padding: "12px 0",
        borderBottom:
          "1px solid var(--pm-border, #2C2C2E)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color:
            "var(--pm-text-secondary)",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color:
            "var(--pm-text-primary)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
