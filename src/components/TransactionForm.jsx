import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  getPockets,
  getCategories,
  getDebts,
  addTransaction,
  updateTransaction,
} from "../lib/queries";
import "../styles/pocketmaster.css";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Credit" },
  { value: "qris", label: "QRIS" },
  { value: "cash", label: "Cash" },
];

const formatRp = (value) =>
  "Rp" + Number(value || 0).toLocaleString("id-ID");

export default function TransactionForm({
  onCancel,
  onSaved,
  transaction = null,
}) {
  const isEdit = Boolean(transaction?.id);

  // -------------------------------------------------------------------------
  // Transaction type
  // -------------------------------------------------------------------------
  const [type, setType] = useState(
    transaction?.type || "expense"
  );

  // -------------------------------------------------------------------------
  // Loaded reference data
  // -------------------------------------------------------------------------
  const [pockets, setPockets] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [debts, setDebts] = useState([]);

  // -------------------------------------------------------------------------
  // Full original transaction
  //
  // Important:
  // Dashboard only sends a summarized transaction object.
  // When editing, we fetch the complete DB row and keep it here so that
  // balance validation can correctly "give back" the old transaction.
  // -------------------------------------------------------------------------
  const [originalTransaction, setOriginalTransaction] =
    useState(null);

  // -------------------------------------------------------------------------
  // Common fields
  // -------------------------------------------------------------------------
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] =
    useState("bank_transfer");

  // -------------------------------------------------------------------------
  // Income
  // -------------------------------------------------------------------------
  const [toPocketId, setToPocketId] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [incomeCategoryId, setIncomeCategoryId] = useState("");

  // -------------------------------------------------------------------------
  // Expense
  // -------------------------------------------------------------------------
  const [fromPocketId, setFromPocketId] = useState("");
  const [payee, setPayee] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [debtId, setDebtId] = useState("");

  // -------------------------------------------------------------------------
  // Transfer
  // -------------------------------------------------------------------------
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");

  // -------------------------------------------------------------------------
  // Fee
  // -------------------------------------------------------------------------
  const [feeEnabled, setFeeEnabled] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");
  const [feePocketId, setFeePocketId] = useState("");

  // -------------------------------------------------------------------------
  // UI state
  // -------------------------------------------------------------------------
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // -------------------------------------------------------------------------
  // Load pockets/categories/debts
  // -------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    Promise.all([
      getPockets(),
      getCategories("income"),
      getCategories("expense"),
      getDebts(),
    ])
      .then(([p, ic, ec, d]) => {
        if (!mounted) return;

        setPockets(p || []);
        setIncomeCategories(ic || []);
        setExpenseCategories(ec || []);
        setDebts(d || []);
      })
      .catch((error) => {
        console.error(
          "Failed loading transaction form data:",
          error
        );

        if (mounted) {
          setLoadError(
            error?.message ||
              "Failed to load transaction data."
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Load full transaction for edit mode
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isEdit) {
      setOriginalTransaction(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadTransaction() {
      try {
        setLoading(true);
        setLoadError("");

        const {
          data,
          error,
        } = await supabase
          .from("transactions")
          .select("*")
          .eq("id", transaction.id)
          .single();

        if (error) throw error;

        if (!mounted) return;

        // Keep the complete original row.
        setOriginalTransaction(data);

        // -------------------------------------------------------------------
        // Common
        // -------------------------------------------------------------------
        setType(data.type || "expense");

        setAmount(
          data.amount !== null &&
          data.amount !== undefined
            ? String(data.amount)
            : ""
        );

        setDescription(data.description || "");

        setDate(
          data.date ||
            new Date().toISOString().slice(0, 10)
        );

        setPaymentMethod(
          data.payment_method ||
            "bank_transfer"
        );

        // -------------------------------------------------------------------
        // Income
        // -------------------------------------------------------------------
        setToPocketId(
          data.to_pocket_id || ""
        );

        setSourceText(
          data.source_text || ""
        );

        setIncomeCategoryId(
          data.category_id || ""
        );

        // -------------------------------------------------------------------
        // Expense
        // -------------------------------------------------------------------
        setFromPocketId(
          data.from_pocket_id || ""
        );

        setPayee(
          data.payee || ""
        );

        setExpenseCategoryId(
          data.category_id || ""
        );

        setDebtId(
          data.debt_id || ""
        );

        // -------------------------------------------------------------------
        // Transfer
        // -------------------------------------------------------------------
        setTransferFrom(
          data.from_pocket_id || ""
        );

        setTransferTo(
          data.to_pocket_id || ""
        );

        // -------------------------------------------------------------------
        // Fee
        // -------------------------------------------------------------------
        if (
          data.fee_amount !== null &&
          data.fee_amount !== undefined &&
          Number(data.fee_amount) > 0
        ) {
          setFeeEnabled(true);
          setFeeAmount(
            String(data.fee_amount)
          );
          setFeePocketId(
            data.fee_pocket_id || ""
          );
        } else {
          setFeeEnabled(false);
          setFeeAmount("");
          setFeePocketId("");
        }
      } catch (error) {
        console.error(
          "Failed loading transaction:",
          error
        );

        if (mounted) {
          setLoadError(
            error?.message ||
              "Failed to load transaction."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTransaction();

    return () => {
      mounted = false;
    };
  }, [isEdit, transaction?.id]);

  // -------------------------------------------------------------------------
  // Selected pockets
  // -------------------------------------------------------------------------
  const selectedExpensePocket = useMemo(
    () =>
      pockets.find(
        (p) =>
          p.pocket_id === fromPocketId
      ),
    [pockets, fromPocketId]
  );

  const selectedTransferPocket = useMemo(
    () =>
      pockets.find(
        (p) =>
          p.pocket_id === transferFrom
      ),
    [pockets, transferFrom]
  );

  const selectedFeePocket = useMemo(
    () =>
      pockets.find(
        (p) =>
          p.pocket_id === feePocketId
      ),
    [pockets, feePocketId]
  );

  const sourcePocket =
    type === "expense"
      ? selectedExpensePocket
      : type === "transfer"
      ? selectedTransferPocket
      : null;

  const sourceBalance = Number(
    sourcePocket?.balance || 0
  );

  // -------------------------------------------------------------------------
  // Debt logic
  // -------------------------------------------------------------------------
  const selectedExpenseCategory =
    expenseCategories.find(
      (c) =>
        c.id === expenseCategoryId
    );

  const isDebtCategory =
    selectedExpenseCategory?.name ===
    "Debt";

  const selectedDebt = debts.find(
    (d) =>
      d.debt_id === debtId
  );

  const numericAmount =
    Number(amount || 0);

  const numericFee =
    feeEnabled
      ? Number(feeAmount || 0)
      : 0;

  const totalDebit =
    numericAmount + numericFee;

  // -------------------------------------------------------------------------
  // Original transaction values
  // -------------------------------------------------------------------------
  const originalAmount =
    isEdit && originalTransaction
      ? Number(
          originalTransaction.amount || 0
        )
      : 0;

  const originalFee =
    isEdit && originalTransaction
      ? Number(
          originalTransaction.fee_amount ||
            0
        )
      : 0;

  const originalFromPocketId =
    isEdit && originalTransaction
      ? originalTransaction.from_pocket_id ||
        null
      : null;

  const originalFeePocketId =
    isEdit && originalTransaction
      ? originalTransaction.fee_pocket_id ||
        null
      : null;

  // -------------------------------------------------------------------------
  // Debt validation
  //
  // Existing debt payment must be added back to the remaining balance
  // because the DB balance already reflects the old transaction.
  // -------------------------------------------------------------------------
  const effectiveDebtRemaining =
    selectedDebt &&
    isEdit &&
    originalTransaction?.debt_id === debtId
      ? Number(selectedDebt.remaining || 0) +
        originalAmount
      : Number(
          selectedDebt?.remaining || 0
        );

  const debtExceeded =
    type === "expense" &&
    isDebtCategory &&
    selectedDebt &&
    numericAmount >
      effectiveDebtRemaining;

  // -------------------------------------------------------------------------
  // Balance validation
  //
  // For edit mode:
  //
  // Current balance already contains the effect of the old transaction.
  //
  // So if we're editing the same source pocket:
  //
  // editable balance =
  // current balance
  // + old transaction amount
  // + old fee
  //
  // Then compare the new transaction against that amount.
  // -------------------------------------------------------------------------
  const requiresSourcePocket =
    type === "expense" ||
    type === "transfer";

  const sourcePocketMissing =
    requiresSourcePocket &&
    !sourcePocket;

  const originalAmountToRestore =
    isEdit &&
    originalTransaction &&
    originalFromPocketId ===
      fromPocketId &&
    (
      originalTransaction.type ===
        "expense" ||
      originalTransaction.type ===
        "transfer"
    )
      ? originalAmount
      : 0;

  const originalFeeToRestore =
    isEdit &&
    originalTransaction &&
    originalFeePocketId ===
      fromPocketId
      ? originalFee
      : 0;

  const editableSourceBalance =
    sourceBalance +
    originalAmountToRestore +
    originalFeeToRestore;

  const availableForTransaction =
    isEdit
      ? editableSourceBalance
      : sourceBalance;

  const insufficientBalance =
    requiresSourcePocket &&
    sourcePocket &&
    totalDebit >
      availableForTransaction;

  // -------------------------------------------------------------------------
  // Fee validation
  // -------------------------------------------------------------------------
  const feePocketMissing =
    feeEnabled &&
    !feePocketId;

  const feeInvalid =
    feeEnabled &&
    (
      !feeAmount ||
      numericFee <= 0
    );

  const feePocketOriginalFee =
    isEdit &&
    originalTransaction &&
    originalFeePocketId ===
      feePocketId
      ? originalFee
      : 0;

  const feePocketAvailableBalance =
    selectedFeePocket
      ? Number(
          selectedFeePocket.balance || 0
        ) +
        feePocketOriginalFee
      : 0;

  const feePocketInsufficient =
    feeEnabled &&
    selectedFeePocket &&
    numericFee >
      feePocketAvailableBalance;

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const isValid =
    numericAmount > 0 &&
    !saving &&
    !sourcePocketMissing &&
    !insufficientBalance &&
    !debtExceeded &&
    !feePocketMissing &&
    !feeInvalid &&
    !feePocketInsufficient &&
    (
      type === "income"
        ? Boolean(
            toPocketId &&
            sourceText &&
            incomeCategoryId
          )
        : type === "expense"
        ? Boolean(
            fromPocketId &&
            expenseCategoryId &&
            (
              !isDebtCategory ||
              (
                debtId &&
                !debtExceeded
              )
            )
          )
        : Boolean(
            transferFrom &&
            transferTo &&
            transferFrom !==
              transferTo
          )
    );

  // -------------------------------------------------------------------------
  // Change transaction type
  // -------------------------------------------------------------------------
  function handleTypeChange(
    nextType
  ) {
    setType(nextType);

    setAmount("");
    setDescription("");

    setFeeEnabled(false);
    setFeeAmount("");
    setFeePocketId("");

    if (nextType !== "expense") {
      setFromPocketId("");
      setExpenseCategoryId("");
      setDebtId("");
      setPayee("");
    }

    if (nextType !== "income") {
      setToPocketId("");
      setSourceText("");
      setIncomeCategoryId("");
    }

    if (nextType !== "transfer") {
      setTransferFrom("");
      setTransferTo("");
    }
  }

  // -------------------------------------------------------------------------
  // Source pocket change
  // -------------------------------------------------------------------------
  function handleSourcePocketChange(
    value
  ) {
    if (type === "expense") {
      setFromPocketId(value);
    } else if (
      type === "transfer"
    ) {
      setTransferFrom(value);
    }

    if (value) {
      setFeePocketId(value);
    } else {
      setFeePocketId("");
    }
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------
  async function handleSave() {
    if (!isValid) return;

    setSaving(true);
    setLoadError("");

    try {
      const base = {
        type,
        amount,
        description,
        date,
        paymentMethod,
        feeAmount:
          feeEnabled
            ? feeAmount
            : null,
        feePocketId:
          feeEnabled
            ? feePocketId
            : null,
      };

      let savedTransaction;

      // ---------------------------------------------------------------------
      // Income
      // ---------------------------------------------------------------------
      if (type === "income") {
        const payload = {
          ...base,
          toPocketId,
          sourceText,
          categoryId:
            incomeCategoryId,
          fromPocketId: null,
          payee: null,
          debtId: null,
        };

        if (isEdit) {
          savedTransaction =
            await updateTransaction(
              transaction.id,
              payload
            );
        } else {
          savedTransaction =
            await addTransaction(
              payload
            );
        }
      }

      // ---------------------------------------------------------------------
      // Expense
      // ---------------------------------------------------------------------
      else if (type === "expense") {
        const payload = {
          ...base,
          fromPocketId,
          toPocketId: null,
          payee,
          categoryId:
            expenseCategoryId,
          debtId:
            isDebtCategory
              ? debtId
              : null,
          sourceText: null,
        };

        if (isEdit) {
          savedTransaction =
            await updateTransaction(
              transaction.id,
              payload
            );
        } else {
          savedTransaction =
            await addTransaction(
              payload
            );
        }
      }

      // ---------------------------------------------------------------------
      // Transfer
      // ---------------------------------------------------------------------
      else {
        const payload = {
          ...base,
          fromPocketId:
            transferFrom,
          toPocketId:
            transferTo,
          categoryId: null,
          sourceText: null,
          payee: null,
          debtId: null,
        };

        if (isEdit) {
          savedTransaction =
            await updateTransaction(
              transaction.id,
              payload
            );
        } else {
          savedTransaction =
            await addTransaction(
              payload
            );
        }
      }

      onSaved?.(
        savedTransaction
      );
    } catch (error) {
      console.error(
        "Failed saving transaction:",
        error
      );

      setLoadError(
        error?.message ||
          "Failed to save transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  const typeColor = {
    income:
      "var(--pm-success)",
    expense:
      "var(--pm-danger)",
    transfer:
      "var(--pm-accent)",
  }[type];

  const amountDisabled =
    type === "expense"
      ? !fromPocketId
      : type === "transfer"
      ? !transferFrom
      : false;

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="pm-app">
        <div
          style={{
            paddingTop: 40,
            textAlign:
              "center",
          }}
        >
          <p
            style={{
              fontSize: 14,
              color:
                "var(--pm-text-secondary)",
            }}
          >
            Memuat transaksi...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="pm-app">

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom: 20,
        }}
      >
        <button
          onClick={onCancel}
          type="button"
          style={{
            background: "none",
            border: "none",
            color:
              "var(--pm-text-primary)",
            fontSize: 20,
            cursor:
              "pointer",
          }}
        >
          ×
        </button>

        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {isEdit
            ? "Edit Transaction"
            : "New Transaction"}
        </p>

        <button
          onClick={handleSave}
          disabled={
            !isValid ||
            saving
          }
          type="button"
          style={{
            background: "none",
            border: "none",
            color:
              isValid
                ? "var(--pm-accent)"
                : "var(--pm-text-muted)",
            fontWeight: 600,
            fontSize: 14,
            cursor:
              isValid
                ? "pointer"
                : "default",
          }}
        >
          {saving
            ? "Saving..."
            : "Save"}
        </button>
      </div>

      {/* Error */}
      {loadError && (
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
            {loadError}
          </p>
        </div>
      )}

      {/* Type */}
      <div
        className="pm-segmented"
        style={{
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          className={
            type === "income"
              ? "active-income"
              : ""
          }
          onClick={() =>
            handleTypeChange(
              "income"
            )
          }
        >
          Income
        </button>

        <button
          type="button"
          className={
            type === "expense"
              ? "active-expense"
              : ""
          }
          onClick={() =>
            handleTypeChange(
              "expense"
            )
          }
        >
          Expense
        </button>

        <button
          type="button"
          className={
            type === "transfer"
              ? "active-transfer"
              : ""
          }
          onClick={() =>
            handleTypeChange(
              "transfer"
            )
          }
        >
          Transfer
        </button>
      </div>

      {/* Amount */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 10,
          position: "relative",
        }}
      >
        <input
          type="number"
          value={amount}
          disabled={
            amountDisabled
          }
          onChange={(e) =>
            setAmount(
              e.target.value
            )
          }
          placeholder="Rp0"
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color:
              amountDisabled
                ? "var(--pm-text-muted)"
                : typeColor,
            fontSize: 38,
            fontWeight: 600,
            textAlign:
              "center",
            width: "100%",
            fontFamily:
              "inherit",
            opacity:
              amountDisabled
                ? 0.45
                : 1,
            cursor:
              amountDisabled
                ? "not-allowed"
                : "text",
          }}
        />

        {amountDisabled && (
          <p
            style={{
              fontSize: 12,
              color:
                "var(--pm-text-muted)",
              margin:
                "0 0 8px",
            }}
          >
            Select a pocket first
          </p>
        )}

        {requiresSourcePocket &&
          sourcePocket && (
            <p
              style={{
                fontSize: 12,
                color:
                  insufficientBalance
                    ? "var(--pm-danger)"
                    : "var(--pm-text-secondary)",
                margin:
                  "0 0 8px",
                fontWeight:
                  insufficientBalance
                    ? 600
                    : 400,
              }}
            >
              Available balance:{" "}
              {formatRp(
                availableForTransaction
              )}
            </p>
          )}

        {insufficientBalance && (
          <p
            style={{
              fontSize: 12,
              color:
                "var(--pm-danger)",
              margin:
                "0 0 12px",
              fontWeight: 600,
            }}
          >
            Insufficient balance.
            Maximum available is{" "}
            {formatRp(
              availableForTransaction
            )}
            .
          </p>
        )}
      </div>

      {/* Description */}
      {type !== "transfer" && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <input
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Transaction description"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color:
                "var(--pm-text-primary)",
              fontSize: 15,
              textAlign:
                "center",
              width: "100%",
              fontFamily:
                "inherit",
            }}
          />
        </div>
      )}

      {/* Date */}
      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          gap: 6,
          marginBottom: 24,
        }}
      >
        <i
          className="ti ti-calendar"
          style={{
            fontSize: 14,
            color:
              "var(--pm-text-muted)",
          }}
        />

        <input
          type="date"
          value={date}
          onChange={(e) =>
            setDate(
              e.target.value
            )
          }
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color:
              "var(--pm-text-muted)",
            fontSize: 13,
            fontFamily:
              "inherit",
          }}
        />
      </div>

      {/* ================================================================== */}
      {/* INCOME */}
      {/* ================================================================== */}
      {type === "income" && (
        <>
          <Field label="To pocket">
            <select
              className="pm-select"
              value={
                toPocketId
              }
              onChange={(e) =>
                setToPocketId(
                  e.target.value
                )
              }
            >
              <option value="">
                Select pocket
              </option>

              {pockets.map(
                (p) => (
                  <option
                    key={
                      p.pocket_id
                    }
                    value={
                      p.pocket_id
                    }
                  >
                    {p.name}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field
            label="Source of funds"
            hint="Free text, not from any pocket"
          >
            <input
              className="pm-input"
              value={
                sourceText
              }
              onChange={(e) =>
                setSourceText(
                  e.target.value
                )
              }
              placeholder="e.g. Salary from ABC Company"
            />
          </Field>

          <Field label="Category">
            <select
              className="pm-select"
              value={
                incomeCategoryId
              }
              onChange={(e) =>
                setIncomeCategoryId(
                  e.target.value
                )
              }
            >
              <option value="">
                Select category
              </option>

              {incomeCategories.map(
                (c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                )
              )}
            </select>
          </Field>
        </>
      )}

      {/* ================================================================== */}
      {/* EXPENSE */}
      {/* ================================================================== */}
      {type === "expense" && (
        <>
          <Field
            label="From pocket"
            hint={
              selectedExpensePocket
                ? `Available: ${formatRp(
                    availableForTransaction
                  )}`
                : "Select the pocket that will pay for this expense"
            }
          >
            <select
              className="pm-select"
              value={
                fromPocketId
              }
              onChange={(e) =>
                handleSourcePocketChange(
                  e.target.value
                )
              }
            >
              <option value="">
                Select pocket
              </option>

              {pockets.map(
                (p) => (
                  <option
                    key={
                      p.pocket_id
                    }
                    value={
                      p.pocket_id
                    }
                  >
                    {p.name} ·{" "}
                    {formatRp(
                      p.balance
                    )}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="For whom">
            <input
              className="pm-input"
              value={payee}
              onChange={(e) =>
                setPayee(
                  e.target.value
                )
              }
              placeholder="e.g. Mrs. Siti's shop"
            />
          </Field>

          <Field label="Category">
            <select
              className="pm-select"
              value={
                expenseCategoryId
              }
              onChange={(e) => {
                setExpenseCategoryId(
                  e.target.value
                );
                setDebtId("");
              }}
            >
              <option value="">
                Select category
              </option>

              {expenseCategories.map(
                (c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                )
              )}
            </select>
          </Field>

          {isDebtCategory && (
            <div
              style={{
                background:
                  "rgba(255,107,82,0.08)",
                border:
                  "1px solid rgba(255,107,82,0.3)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  margin:
                    "0 0 8px",
                }}
              >
                Which debt to pay?
              </p>

              <select
                className="pm-select"
                style={{
                  background:
                    "var(--pm-surface-2)",
                }}
                value={
                  debtId
                }
                onChange={(e) =>
                  setDebtId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select debt
                </option>

                {debts.map(
                  (d) => (
                    <option
                      key={
                        d.debt_id
                      }
                      value={
                        d.debt_id
                      }
                    >
                      {d.name} · remaining{" "}
                      {formatRp(
                        d.remaining
                      )}
                    </option>
                  )
                )}
              </select>

              {debtExceeded && (
                <p
                  style={{
                    fontSize: 11,
                    color:
                      "var(--pm-danger)",
                    margin:
                      "8px 0 0",
                  }}
                >
                  Amount cannot
                  exceed the
                  remaining debt.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ================================================================== */}
      {/* TRANSFER */}
      {/* ================================================================== */}
      {type === "transfer" && (
        <>
          <Field
            label="From pocket"
            hint={
              selectedTransferPocket
                ? `Available: ${formatRp(
                    availableForTransaction
                  )}`
                : "Select the pocket the money will come from"
            }
          >
            <select
              className="pm-select"
              value={
                transferFrom
              }
              onChange={(e) =>
                handleSourcePocketChange(
                  e.target.value
                )
              }
            >
              <option value="">
                Select pocket
              </option>

              {pockets.map(
                (p) => (
                  <option
                    key={
                      p.pocket_id
                    }
                    value={
                      p.pocket_id
                    }
                  >
                    {p.name} ·{" "}
                    {formatRp(
                      p.balance
                    )}
                  </option>
                )
              )}
            </select>
          </Field>

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              margin:
                "-6px 0 10px",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius:
                  "50%",
                background:
                  "var(--pm-surface)",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <i
                className="ti ti-arrow-down"
                style={{
                  fontSize: 16,
                  color:
                    "var(--pm-accent)",
                }}
              />
            </span>
          </div>

          <Field label="To pocket">
            <select
              className="pm-select"
              value={
                transferTo
              }
              onChange={(e) =>
                setTransferTo(
                  e.target.value
                )
              }
            >
              <option value="">
                Select pocket
              </option>

              {pockets.map(
                (p) => (
                  <option
                    key={
                      p.pocket_id
                    }
                    value={
                      p.pocket_id
                    }
                  >
                    {p.name} ·{" "}
                    {formatRp(
                      p.balance
                    )}
                  </option>
                )
              )}
            </select>
          </Field>
        </>
      )}

      {/* ================================================================== */}
      {/* FEE */}
      {/* ================================================================== */}
      <div
        className="pm-card"
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >
        <span
          style={{
            fontSize: 14,
          }}
        >
          Is there a transaction fee?
        </span>

        <button
          type="button"
          className={`pm-toggle ${
            feeEnabled
              ? "on"
              : "off"
          }`}
          onClick={() => {
            setFeeEnabled(
              (v) => !v
            );

            if (
              !feeEnabled &&
              sourcePocket
            ) {
              setFeePocketId(
                sourcePocket.pocket_id
              );
            }
          }}
        >
          <span className="knob" />
        </button>
      </div>

      {feeEnabled && (
        <div
          className="pm-card"
          style={{
            marginTop: 8,
          }}
        >
          <input
            type="number"
            className="pm-input"
            value={
              feeAmount
            }
            onChange={(e) =>
              setFeeAmount(
                e.target.value
              )
            }
            placeholder="Fee amount"
            style={{
              marginBottom: 10,
            }}
          />

          <select
            className="pm-select"
            style={{
              background:
                "var(--pm-bg)",
            }}
            value={
              feePocketId
            }
            onChange={(e) =>
              setFeePocketId(
                e.target.value
              )
            }
          >
            <option value="">
              Deducted from which pocket
            </option>

            {pockets.map(
              (p) => (
                <option
                  key={
                    p.pocket_id
                  }
                  value={
                    p.pocket_id
                  }
                >
                  {p.name} ·{" "}
                  {formatRp(
                    p.balance
                  )}
                </option>
              )
            )}
          </select>

          {feePocketInsufficient && (
            <p
              style={{
                fontSize: 11,
                color:
                  "var(--pm-danger)",
                margin:
                  "8px 0 0",
              }}
            >
              Insufficient balance
              for this fee.
              Maximum available is{" "}
              {formatRp(
                feePocketAvailableBalance
              )}
              .
            </p>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* PAYMENT METHOD */}
      {/* ================================================================== */}
      <Field
        label="Payment method"
        style={{
          marginTop: 16,
        }}
      >
        <select
          className="pm-select"
          value={
            paymentMethod
          }
          onChange={(e) =>
            setPaymentMethod(
              e.target.value
            )
          }
        >
          {PAYMENT_METHODS.map(
            (m) => (
              <option
                key={m.value}
                value={m.value}
              >
                {m.label}
              </option>
            )
          )}
        </select>
      </Field>

      {/* Bottom spacing */}
      <div
        style={{
          height: 100,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable field
// ---------------------------------------------------------------------------
function Field({
  label,
  hint,
  children,
  style,
}) {
  return (
    <div
      style={{
        marginBottom: 16,
        ...style,
      }}
    >
      <p className="pm-label">
        {label}
      </p>

      {children}

      {hint && (
        <p
          style={{
            fontSize: 12,
            color:
              "var(--pm-text-muted)",
            margin:
              "6px 0 0",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}