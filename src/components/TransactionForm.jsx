import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import imageCompression from "browser-image-compression";
import {
  getPockets,
  getCategories,
  getDebts,
  addTransaction,
  updateTransaction,
} from "../lib/queries";
import PickerSheet from "./PickerSheet";
import "../styles/pocketmaster.css";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Credit" },
  { value: "qris", label: "QRIS" },
  { value: "cash", label: "Cash" },
];

const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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
  const [transactionTime, setTransactionTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [paymentMethod, setPaymentMethod] =
    useState("bank_transfer");

  // -------------------------------------------------------------------------
  // Proof of transaction
  // -------------------------------------------------------------------------
  const [proofUrl, setProofUrl] = useState("");
  const [proofPreview, setProofPreview] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [proofFileSize, setProofFileSize] = useState(0);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState("");

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
  const [debtAction, setDebtAction] = useState("payment");
  const [expenseKind, setExpenseKind] = useState("regular");
  const [openPicker, setOpenPicker] = useState(null);

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

        setOriginalTransaction(data);

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

        setTransactionTime(
          data.transaction_time
            ? data.transaction_time.slice(0, 5)
            : new Date().toTimeString().slice(0, 5)
        );

        setPaymentMethod(
          data.payment_method ||
            "bank_transfer"
        );

        setProofUrl(data.proof_url || "");
        setProofPreview(data.proof_url || "");

        setToPocketId(
          data.to_pocket_id || ""
        );

        setSourceText(
          data.source_text || ""
        );

        setIncomeCategoryId(
          data.category_id || ""
        );

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

        setDebtAction(
          data.debt_action || "payment"
        );

        setExpenseKind(
          data.debt_id ? "debt" : "regular"
        );

        setTransferFrom(
          data.from_pocket_id || ""
        );

        setTransferTo(
          data.to_pocket_id || ""
        );

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
  // Proof of transaction handlers
  // -------------------------------------------------------------------------
  async function handleProofSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setProofError("");

    if (file.size > MAX_PROOF_SIZE_BYTES) {
      setProofError("File is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingProof(true);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        initialQuality: 0.8,
        useWebWorker: true,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const ext = compressed.name?.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("transaction-proofs")
        .upload(path, compressed, {
          contentType: compressed.type || file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("transaction-proofs")
        .getPublicUrl(path);

      setProofUrl(publicUrl);
      setProofPreview(publicUrl);
      setProofFileName(file.name);
      setProofFileSize(compressed.size);
    } catch (error) {
      console.error("Failed uploading proof:", error);
      setProofError(
        error?.message || "Failed to upload photo."
      );
    } finally {
      setUploadingProof(false);
    }
  }

  function handleRemoveProof() {
    setProofUrl("");
    setProofPreview("");
    setProofFileName("");
    setProofFileSize(0);
    setProofError("");
  }

  // -------------------------------------------------------------------------
  // Picker sheet options
  // -------------------------------------------------------------------------
  const pocketOptions = useMemo(
    () =>
      pockets.map((p) => ({
        value: p.pocket_id,
        label: p.name,
        hint: formatRp(p.balance),
      })),
    [pockets]
  );

  const incomeCategoryOptions = useMemo(
    () =>
      incomeCategories.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [incomeCategories]
  );

  const expenseCategoryOptions = useMemo(
    () =>
      expenseCategories
        .filter((c) => c.name !== "Debt")
        .map((c) => ({
          value: c.id,
          label: c.name,
          group: c.group_name || "General",
        })),
    [expenseCategories]
  );

  const debtOptions = useMemo(
    () =>
      debts.map((d) => ({
        value: d.debt_id,
        label: d.name,
        hint:
          d.debt_type === "revolving"
            ? `credit ${formatRp(d.available_credit)}`
            : `remaining ${formatRp(d.remaining)}`,
      })),
    [debts]
  );

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

  const debtCategory = expenseCategories.find(
    (c) => c.name === "Debt"
  );

  const isDebtCategory = expenseKind === "debt";

  const selectedDebt = debts.find(
    (d) =>
      d.debt_id === debtId
  );

  const isRevolvingDebt =
    selectedDebt?.debt_type === "revolving";

  const effectiveDebtAction =
    isRevolvingDebt ? debtAction : "payment";

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
  // -------------------------------------------------------------------------
  const effectiveDebtRemaining =
    selectedDebt &&
    isEdit &&
    originalTransaction?.debt_id === debtId &&
    originalTransaction?.debt_action === "payment"
      ? Number(selectedDebt.remaining || 0) +
        originalAmount
      : Number(
          selectedDebt?.remaining || 0
        );

  const effectiveAvailableCredit =
    selectedDebt &&
    isEdit &&
    originalTransaction?.debt_id === debtId &&
    originalTransaction?.debt_action === "borrow"
      ? Number(selectedDebt.available_credit || 0) +
        originalAmount
      : Number(
          selectedDebt?.available_credit || 0
        );

  const debtExceeded =
    type === "expense" &&
    isDebtCategory &&
    selectedDebt &&
    (
      effectiveDebtAction === "borrow"
        ? numericAmount > effectiveAvailableCredit
        : numericAmount > effectiveDebtRemaining
    );

  // -------------------------------------------------------------------------
  // Balance validation
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
    !uploadingProof &&
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
      setDebtAction("payment");
      setExpenseKind("regular");
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
        transactionTime,
        paymentMethod,
        proofUrl: proofUrl || null,
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

      else if (type === "expense") {
        const payload = {
          ...base,
          fromPocketId,
          toPocketId: null,
          payee: isDebtCategory ? null : payee,
          categoryId:
            expenseCategoryId,
          debtId:
            isDebtCategory
              ? debtId
              : null,
          debtAction:
            isDebtCategory
              ? effectiveDebtAction
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

      {/* Pocket */}
      {type === "income" && (
        <Field label="To pocket">
          <button
            type="button"
            className="pm-select"
            onClick={() => setOpenPicker("toPocket")}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              textAlign: "left",
            }}
          >
            <span
              style={{
                color: toPocketId
                  ? "var(--pm-text-primary)"
                  : "var(--pm-text-muted)",
              }}
            >
              {pockets.find((p) => p.pocket_id === toPocketId)?.name ||
                "Select pocket"}
            </span>
            <i
              className="ti ti-chevron-down"
              style={{ fontSize: 16, color: "var(--pm-text-secondary)" }}
            />
          </button>
        </Field>
      )}

      {type === "expense" && (
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
          <button
            type="button"
            className="pm-select"
            onClick={() => setOpenPicker("fromPocket")}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              textAlign: "left",
            }}
          >
            <span
              style={{
                color: fromPocketId
                  ? "var(--pm-text-primary)"
                  : "var(--pm-text-muted)",
              }}
            >
              {pockets.find((p) => p.pocket_id === fromPocketId)?.name ||
                "Select pocket"}
            </span>
            <i
              className="ti ti-chevron-down"
              style={{ fontSize: 16, color: "var(--pm-text-secondary)" }}
            />
          </button>
        </Field>
      )}

      {type === "transfer" && (
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
          <button
            type="button"
            className="pm-select"
            onClick={() => setOpenPicker("transferFrom")}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              textAlign: "left",
            }}
          >
            <span
              style={{
                color: transferFrom
                  ? "var(--pm-text-primary)"
                  : "var(--pm-text-muted)",
              }}
            >
              {pockets.find((p) => p.pocket_id === transferFrom)?.name ||
                "Select pocket"}
            </span>
            <i
              className="ti ti-chevron-down"
              style={{ fontSize: 16, color: "var(--pm-text-secondary)" }}
            />
          </button>
        </Field>
      )}

      {/* Amount */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 10,
          position: "relative",
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          value={
            amount
              ? Number(amount).toLocaleString("id-ID")
              : ""
          }
          disabled={
            amountDisabled
          }
          onChange={(e) =>
            setAmount(
              e.target.value.replace(/\D/g, "")
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
        <Field label="Description">
          <input
            className="pm-input"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="e.g. Lunch at Warteg"
          />
        </Field>
      )}

      {/* Date & Time */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <p className="pm-label">Date</p>
          <div
            className="pm-input"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="ti ti-calendar"
              style={{
                fontSize: 16,
                color: "var(--pm-text-secondary)",
              }}
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--pm-text-primary)",
                fontSize: 15,
                fontFamily: "inherit",
                flex: 1,
                colorScheme: "dark",
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p className="pm-label">Time</p>
          <div
            className="pm-input"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="ti ti-clock"
              style={{
                fontSize: 16,
                color: "var(--pm-text-secondary)",
              }}
            />

            <input
              type="time"
              value={transactionTime}
              onChange={(e) =>
                setTransactionTime(e.target.value)
              }
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--pm-text-primary)",
                fontSize: 15,
                fontFamily: "inherit",
                flex: 1,
                colorScheme: "dark",
              }}
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* INCOME */}
      {/* ================================================================== */}
      {type === "income" && (
        <>
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
            <button
              type="button"
              className="pm-select"
              onClick={() => setOpenPicker("incomeCategory")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 15,
                textAlign: "left",
              }}
            >
              <span
                style={{
                  color: incomeCategoryId
                    ? "var(--pm-text-primary)"
                    : "var(--pm-text-muted)",
                }}
              >
                {incomeCategories.find((c) => c.id === incomeCategoryId)
                  ?.name || "Select category"}
              </span>
              <i
                className="ti ti-chevron-down"
                style={{ fontSize: 16, color: "var(--pm-text-secondary)" }}
              />
            </button>
          </Field>
        </>
      )}

      {/* ================================================================== */}
      {/* EXPENSE */}
      {/* ================================================================== */}
      {type === "expense" && (
        <>
          <div className="pm-segmented" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={expenseKind === "regular" ? "active-expense" : ""}
              onClick={() => {
                setExpenseKind("regular");
                setExpenseCategoryId("");
                setDebtId("");
                setDebtAction("payment");
              }}
            >
              Regular Expense
            </button>

            <button
              type="button"
              className={expenseKind === "debt" ? "active-expense" : ""}
              onClick={() => {
                setExpenseKind("debt");
                setExpenseCategoryId(debtCategory?.id || "");
                setPayee("");
              }}
            >
              Debt Payment
            </button>
          </div>

          {expenseKind === "regular" && (
            <>
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
                <button
                  type="button"
                  className="pm-select"
                  onClick={() => setOpenPicker("expenseCategory")}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 15,
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      color: expenseCategoryId
                        ? "var(--pm-text-primary)"
                        : "var(--pm-text-muted)",
                    }}
                  >
                    {expenseCategories.find((c) => c.id === expenseCategoryId)
                      ?.name || "Select category"}
                  </span>
                  <i
                    className="ti ti-chevron-down"
                    style={{ fontSize: 16, color: "var(--pm-text-secondary)" }}
                  />
                </button>
              </Field>
            </>
          )}

          {expenseKind === "debt" && (
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
                Which debt?
              </p>

              <button
                type="button"
                className="pm-select"
                onClick={() => setOpenPicker("debt")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 15,
                  textAlign: "left",
                  background: "var(--pm-surface-2)",
                }}
              >
                <span
                  style={{
                    color: debtId
                      ? "var(--pm-text-primary)"
                      : "var(--pm-text-muted)",
                  }}
                >
                  {debts.find((d) => d.debt_id === debtId)?.name ||
                    "Select debt"}
                </span>
                <i
                  className="ti ti-chevron-down"
                  style={{ fontSize: 16, color: "var(--pm-text-secondary)" }}
                />
              </button>

              {isRevolvingDebt && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setDebtAction("borrow")
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border:
                        debtAction === "borrow"
                          ? "1px solid var(--pm-accent)"
                          : "1px solid rgba(255,255,255,0.15)",
                      background:
                        debtAction === "borrow"
                          ? "rgba(34,211,238,0.12)"
                          : "transparent",
                      color:
                        debtAction === "borrow"
                          ? "var(--pm-accent)"
                          : "var(--pm-text-secondary)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Borrow
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDebtAction("payment")
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border:
                        debtAction === "payment"
                          ? "1px solid var(--pm-accent)"
                          : "1px solid rgba(255,255,255,0.15)",
                      background:
                        debtAction === "payment"
                          ? "rgba(34,211,238,0.12)"
                          : "transparent",
                      color:
                        debtAction === "payment"
                          ? "var(--pm-accent)"
                          : "var(--pm-text-secondary)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Payment
                  </button>
                </div>
              )}

              {selectedDebt && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--pm-text-muted)",
                    margin: "8px 0 0",
                  }}
                >
                  {effectiveDebtAction === "borrow"
                    ? `Available credit: ${formatRp(effectiveAvailableCredit)}`
                    : `Remaining: ${formatRp(effectiveDebtRemaining)}`}
                </p>
              )}

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
                  {effectiveDebtAction === "borrow"
                    ? "Amount cannot exceed available credit."
                    : "Amount cannot exceed the remaining debt."}
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
            <button
              type="button"
              className="pm-select"
              onClick={() => setOpenPicker("transferTo")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 15,
                textAlign: "left",
              }}
            >
              <span
                style={{
                  color: transferTo
                    ? "var(--pm-text-primary)"
                    : "var(--pm-text-muted)",
                }}
              >
                {pockets.find((p) => p.pocket_id === transferTo)?.name ||
                  "Select pocket"}
              </span>
              <i
                className="ti ti-chevron-down"
                style={{ fontSize: 16, color: "var(--pm-text-secondary)" }}
              />
            </button>
          </Field>
        </>
      )}

      {/* ================================================================== */}
      {/* PROOF OF TRANSACTION */}
      {/* ================================================================== */}
      <p className="pm-label">Proof of transaction (optional)</p>

      {!proofPreview && (
        <label
          className="pm-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            marginBottom: 16,
            border: "1px dashed rgba(34,211,238,0.35)",
            cursor: uploadingProof ? "default" : "pointer",
            textAlign: "center",
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleProofSelect}
            disabled={uploadingProof}
            style={{ display: "none" }}
          />
          <i
            className="ti ti-camera-plus"
            style={{ fontSize: 22, color: "var(--pm-accent)" }}
          />
          <p style={{ fontSize: 13, color: "var(--pm-accent)", margin: "8px 0 0" }}>
            {uploadingProof ? "Uploading..." : "Add photo"}
          </p>
          <p style={{ fontSize: 11, color: "var(--pm-text-muted)", margin: "4px 0 0" }}>
            Receipt, screenshot, or proof · max 5MB
          </p>
        </label>
      )}

      {proofPreview && (
        <div
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(34,211,238,0.25)",
            marginBottom: 16,
          }}
        >
          <img
            src={proofPreview}
            alt="Proof of transaction"
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              display: "block",
            }}
          />

          <button
            type="button"
            onClick={handleRemoveProof}
            aria-label="Remove photo"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(11,17,22,0.85)",
              border: "1px solid rgba(255,92,122,0.35)",
              color: "var(--pm-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: 14 }} />
          </button>

          {proofFileName && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "6px 10px",
                background: "rgba(11,17,22,0.85)",
                fontSize: 11,
                color: "var(--pm-text-muted)",
              }}
            >
              {proofFileName}
              {proofFileSize
                ? ` · ${Math.round(proofFileSize / 1024)} KB`
                : ""}
            </div>
          )}
        </div>
      )}

      {proofError && (
        <p
          style={{
            fontSize: 12,
            color: "var(--pm-danger)",
            margin: "-8px 0 16px",
          }}
        >
          {proofError}
        </p>
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
            type="text"
            inputMode="numeric"
            className="pm-input"
            value={
              feeAmount
                ? Number(feeAmount).toLocaleString("id-ID")
                : ""
            }
            onChange={(e) =>
              setFeeAmount(
                e.target.value.replace(/\D/g, "")
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

      <PickerSheet
        open={openPicker === "toPocket"}
        onClose={() => setOpenPicker(null)}
        title="To pocket"
        searchPlaceholder="Search pocket..."
        options={pocketOptions}
        value={toPocketId}
        onSelect={setToPocketId}
      />

      <PickerSheet
        open={openPicker === "fromPocket"}
        onClose={() => setOpenPicker(null)}
        title="From pocket"
        searchPlaceholder="Search pocket..."
        options={pocketOptions}
        value={fromPocketId}
        onSelect={handleSourcePocketChange}
      />

      <PickerSheet
        open={openPicker === "transferFrom"}
        onClose={() => setOpenPicker(null)}
        title="From pocket"
        searchPlaceholder="Search pocket..."
        options={pocketOptions}
        value={transferFrom}
        onSelect={handleSourcePocketChange}
      />

      <PickerSheet
        open={openPicker === "transferTo"}
        onClose={() => setOpenPicker(null)}
        title="To pocket"
        searchPlaceholder="Search pocket..."
        options={pocketOptions}
        value={transferTo}
        onSelect={setTransferTo}
      />

      <PickerSheet
        open={openPicker === "debt"}
        onClose={() => setOpenPicker(null)}
        title="Which debt?"
        searchPlaceholder="Search debt..."
        options={debtOptions}
        value={debtId}
        onSelect={setDebtId}
      />

      <PickerSheet
        open={openPicker === "incomeCategory"}
        onClose={() => setOpenPicker(null)}
        title="Category"
        searchPlaceholder="Search category..."
        options={incomeCategoryOptions}
        value={incomeCategoryId}
        onSelect={setIncomeCategoryId}
      />

      <PickerSheet
        open={openPicker === "expenseCategory"}
        onClose={() => setOpenPicker(null)}
        title="Category"
        searchPlaceholder="Search category..."
        options={expenseCategoryOptions}
        value={expenseCategoryId}
        onSelect={(val) => {
          setExpenseCategoryId(val);
          setDebtId("");
          setDebtAction("payment");
        }}
      />

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
