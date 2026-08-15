import { supabase } from "./supabaseClient";

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user.id;
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export async function getProviders(type) {
  const {
    data,
    error,
  } = await supabase
    .from("providers")
    .select("*")
    .eq("type", type)
    .order("name");

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Pockets
// ---------------------------------------------------------------------------

export async function getPockets({
  includeArchived = false,
} = {}) {
  const userId = await getCurrentUserId();

  let query = supabase
    .from("pocket_balances")
    .select("*")
    .eq("owner_id", userId)
    .order("name");

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const {
    data,
    error,
  } = await query;

  if (error) throw error;

  return data;
}

export async function addPocket({
  type,
  providerName,
  name,
  initialBalance,
}) {
  const userId = await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("pockets")
    .insert({
      owner_id: userId,
      type,
      provider_name: providerName ?? null,
      name:
        name ||
        providerName ||
        "Cash Wallet",
      initial_balance:
        Number(initialBalance) || 0,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(type) {
  const userId = await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("categories")
    .select("*")
    .eq("type", type)
    .eq("owner_id", userId)
    .order("name");

  if (error) throw error;

  return data;
}

export async function addCategory(
  type,
  name
) {
  const userId = await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("categories")
    .insert({
      type,
      name,
      owner_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Debts
// ---------------------------------------------------------------------------

export async function getDebts({
  includeArchived = false,
} = {}) {
  const userId = await getCurrentUserId();

  let query = supabase
    .from("debt_balances")
    .select("*")
    .eq("owner_id", userId)
    .order("name");

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const {
    data,
    error,
  } = await query;

  if (error) throw error;

  return data;
}

export async function addDebt({
  name,
  totalAmount,
  monthlyInstallment,
  dueDay,
}) {
  const userId = await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("debts")
    .insert({
      owner_id: userId,
      name,
      total_amount:
        Number(totalAmount),
      monthly_installment:
        monthlyInstallment
          ? Number(
              monthlyInstallment
            )
          : null,
      due_day: dueDay
        ? Number(dueDay)
        : null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signUp(
  email,
  password
) {
  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signIn(
  email,
  password
) {
  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

  if (error) throw error;

  return data;
}

export async function signOut() {
  const {
    error,
  } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getSession() {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  return data.session;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getProfile() {
  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function updateProfile(
  id,
  username
) {
  const {
    error,
  } = await supabase
    .from("profiles")
    .update({
      username,
    })
    .eq("id", id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
//
// Supported transaction types:
//
// income
// expense
// transfer
//
// Common fields:
// - type
// - amount
// - description
// - date
// - payment_method
// - fee_amount
// - fee_pocket_id
// - from_pocket_id
// - to_pocket_id
// - source_text
// - payee
// - category_id
// - debt_id
// - proof_url
//
// ---------------------------------------------------------------------------

export async function addTransaction(
  payload
) {
  const userId =
    await getCurrentUserId();

  const row = {
    owner_id: userId,

    type: payload.type,

    amount:
      Number(payload.amount),

    description:
      payload.description ||
      null,

    date:
      payload.date,

    payment_method:
      payload.paymentMethod,

    fee_amount:
      payload.feeAmount
        ? Number(
            payload.feeAmount
          )
        : null,

    fee_pocket_id:
      payload.feeAmount
        ? payload.feePocketId
        : null,

    from_pocket_id:
      payload.fromPocketId ??
      null,

    to_pocket_id:
      payload.toPocketId ??
      null,

    source_text:
      payload.sourceText ??
      null,

    payee:
      payload.payee ??
      null,

    category_id:
      payload.categoryId ??
      null,

    debt_id:
      payload.debtId ??
      null,

    proof_url:
      payload.proofUrl ??
      null,
  };

  const {
    data,
    error,
  } = await supabase
    .from("transactions")
    .insert(row)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Transaction select
// ---------------------------------------------------------------------------
//
// This is the complete transaction shape used by:
// - Dashboard
// - Transaction Detail
// - Edit Transaction
//
// ---------------------------------------------------------------------------

const TRANSACTION_SELECT = `
  id,
  owner_id,
  type,
  amount,
  description,
  date,
  created_at,
  payment_method,
  fee_amount,
  fee_pocket_id,
  from_pocket_id,
  to_pocket_id,
  source_text,
  payee,
  category_id,
  debt_id,
  proof_url,

  from_pocket:from_pocket_id (
    id,
    name,
    type,
    provider_name
  ),

  to_pocket:to_pocket_id (
    id,
    name,
    type,
    provider_name
  ),

  fee_pocket:fee_pocket_id (
    id,
    name,
    type,
    provider_name
  ),

  category:category_id (
    id,
    name,
    type
  )
`;

// ---------------------------------------------------------------------------
// Recent Transactions
// ---------------------------------------------------------------------------

export async function getRecentTransactions(
  limit = 20
) {
  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("transactions")
    .select(
      TRANSACTION_SELECT
    )
    .eq(
      "owner_id",
      userId
    )
    .order(
      "date",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(limit);

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Single Transaction
// ---------------------------------------------------------------------------

export async function getTransactionById(
  transactionId
) {
  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("transactions")
    .select(
      TRANSACTION_SELECT
    )
    .eq(
      "id",
      transactionId
    )
    .eq(
      "owner_id",
      userId
    )
    .single();

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Update Transaction
// ---------------------------------------------------------------------------

export async function updateTransaction(
  transactionId,
  payload
) {
  const userId =
    await getCurrentUserId();

  const row = {
    type:
      payload.type,

    amount:
      Number(payload.amount),

    description:
      payload.description ||
      null,

    date:
      payload.date,

    payment_method:
      payload.paymentMethod,

    fee_amount:
      payload.feeAmount
        ? Number(
            payload.feeAmount
          )
        : null,

    fee_pocket_id:
      payload.feeAmount
        ? payload.feePocketId
        : null,

    from_pocket_id:
      payload.fromPocketId ??
      null,

    to_pocket_id:
      payload.toPocketId ??
      null,

    source_text:
      payload.sourceText ??
      null,

    payee:
      payload.payee ??
      null,

    category_id:
      payload.categoryId ??
      null,

    debt_id:
      payload.debtId ??
      null,

    proof_url:
      payload.proofUrl ??
      null,
  };

  const {
    data,
    error,
  } = await supabase
    .from("transactions")
    .update(row)
    .eq(
      "id",
      transactionId
    )
    .eq(
      "owner_id",
      userId
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Delete Transaction
// ---------------------------------------------------------------------------

export async function deleteTransaction(
  transactionId
) {
  const userId =
    await getCurrentUserId();

  const {
    error,
  } = await supabase
    .from("transactions")
    .delete()
    .eq(
      "id",
      transactionId
    )
    .eq(
      "owner_id",
      userId
    );

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Pocket Transactions
// ---------------------------------------------------------------------------

export async function getPocketTransactions(
  pocketId,
  limit = 30
) {
  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } = await supabase
    .from("transactions")
    .select(
      TRANSACTION_SELECT
    )
    .eq(
      "owner_id",
      userId
    )
    .or(
      `from_pocket_id.eq.${pocketId},to_pocket_id.eq.${pocketId}`
    )
    .order(
      "date",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(limit);

  if (error) throw error;

  return data;
}

// ---------------------------------------------------------------------------
// Dashboard Aggregates
// ---------------------------------------------------------------------------

export async function getDashboardData(
  month = new Date()
) {
  const userId =
    await getCurrentUserId();

  const start =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    )
      .toISOString()
      .slice(0, 10);

  const end =
    new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      1
    )
      .toISOString()
      .slice(0, 10);

  const [
    pockets,
    debts,
    monthTx,
  ] = await Promise.all([
    getPockets(),

    getDebts(),

    supabase
      .from("transactions")
      .select(
        "type, amount"
      )
      .eq(
        "owner_id",
        userId
      )
      .gte(
        "date",
        start
      )
      .lt(
        "date",
        end
      )
      .then(
        ({
          data,
          error,
        }) => {
          if (error)
            throw error;

          return data;
        }
      ),
  ]);

  const totalBalance =
    pockets.reduce(
      (sum, pocket) =>
        sum +
        Number(
          pocket.balance
        ),
      0
    );

  const income =
    monthTx
      .filter(
        (tx) =>
          tx.type ===
          "income"
      )
      .reduce(
        (sum, tx) =>
          sum +
          Number(
            tx.amount
          ),
        0
      );

  const expense =
    monthTx
      .filter(
        (tx) =>
          tx.type ===
          "expense"
      )
      .reduce(
        (sum, tx) =>
          sum +
          Number(
            tx.amount
          ),
        0
      );

  const totalDebt =
    debts.reduce(
      (sum, debt) =>
        sum +
        Number(
          debt.remaining
        ),
      0
    );

  return {
    pockets,
    debts,
    totalBalance,
    income,
    expense,
    totalDebt,
  };
}