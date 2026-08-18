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

export async function deletePocket(pocketId) {
  const userId = await getCurrentUserId();

  const {
    error,
  } = await supabase
    .from("pockets")
    .delete()
    .eq("id", pocketId)
    .eq("owner_id", userId);

  if (error) throw error;
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
    .order("group_name")
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

export async function getDebtDetail(debtId) {
  const userId = await getCurrentUserId();

  const [debtResult, transactionResult] =
    await Promise.all([
      supabase
        .from("debt_balances")
        .select("*")
        .eq("debt_id", debtId)
        .eq("owner_id", userId)
        .single(),

      supabase
        .from("transactions")
        .select(TRANSACTION_SELECT)
        .eq("debt_id", debtId)
        .eq("owner_id", userId)
        .order("date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        }),
    ]);

  if (debtResult.error) throw debtResult.error;
  if (transactionResult.error) {
    throw transactionResult.error;
  }

  return {
    debt: debtResult.data,
    transactions: transactionResult.data || [],
  };
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
  emailOrUsername,
  password
) {
  let email = emailOrUsername;

  if (!emailOrUsername.includes("@")) {
    const {
      data: resolvedEmail,
      error: lookupError,
    } = await supabase.rpc(
      "get_email_by_username",
      { input_username: emailOrUsername }
    );

    if (lookupError) throw lookupError;

    if (!resolvedEmail) {
      throw new Error("Invalid login credentials");
    }

    email = resolvedEmail;
  }

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

  const isActive = await checkAccountActive(
    data.user.id
  );

  if (!isActive) {
    throw new Error(
      "This account has been deactivated."
    );
  }

  return data;
}

export async function signInWithGoogle() {
  const {
    data,
    error,
  } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

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

export async function uploadAvatar(file) {
  const userId = await getCurrentUserId();

  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data,
  } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  const {
    error: updateError,
  } = await supabase
    .from("profiles")
    .update({
      avatar_url: data.publicUrl,
    })
    .eq("id", userId);

  if (updateError) throw updateError;

  return data.publicUrl;
}

export async function updateProfileDetails(
  id,
  { username, fullName, currency, numberFormat, showDecimals }
) {
  const {
    error,
  } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      currency,
      number_format: numberFormat,
      show_decimals: showDecimals,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function updateCurrencySettings(
  id,
  { currency, numberFormat, showDecimals }
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      currency,
      number_format: numberFormat,
      show_decimals: showDecimals,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function checkAccountActive(userId) {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("deactivated_at")
    .eq("id", userId)
    .single();

  if (error) throw error;

  if (data?.deactivated_at) {
    await supabase.auth.signOut();
    return false;
  }

  return true;
}

export async function deactivateAccount(id) {
  const {
    error,
  } = await supabase
    .from("profiles")
    .update({
      deactivated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;

  await signOut();
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

    transaction_time:
      payload.transactionTime ??
      null,

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

    debt_action:
      payload.debtAction ??
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
  transaction_time,
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
  debt_action,
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
// Transaction History
// ---------------------------------------------------------------------------

export async function getTransactions(
  page = 0,
  pageSize = 30
) {
  const userId = await getCurrentUserId();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const {
    data,
    error,
  } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("owner_id", userId)
    .order("date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .range(from, to);

  if (error) throw error;

  return {
    data: data || [],
    hasMore: (data || []).length === pageSize,
  };
}

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

    transaction_time:
      payload.transactionTime ??
      null,

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

    debt_action:
      payload.debtAction ??
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
// Pocket Detail Aggregates
// ---------------------------------------------------------------------------

export async function getPocketDetail(
  pocketId,
  month = new Date()
) {
  const userId = await getCurrentUserId();

  const start = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);

  const end = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    1
  )
    .toISOString()
    .slice(0, 10);

  const [pockets, monthTx] = await Promise.all([
    getPockets(),
    supabase
      .from("transactions")
      .select(
        "type, amount, date, from_pocket_id, to_pocket_id, category:category_id (name)"
      )
      .eq("owner_id", userId)
      .gte("date", start)
      .lt("date", end)
      .or(
        `from_pocket_id.eq.${pocketId},to_pocket_id.eq.${pocketId}`
      )
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
  ]);

  const pocket = pockets.find(
    (p) => p.pocket_id === pocketId
  );

  const incomeTx = monthTx.filter(
    (tx) =>
      tx.type === "income" &&
      tx.to_pocket_id === pocketId
  );

  const expenseTx = monthTx.filter(
    (tx) =>
      tx.type === "expense" &&
      tx.from_pocket_id === pocketId
  );

  const income = incomeTx.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const expense = expenseTx.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const incomeCount = incomeTx.length;
  const expenseCount = expenseTx.length;

  // Expense by category
  const categoryMap = {};

  for (const tx of expenseTx) {
    const name = tx.category?.name || "Other";
    categoryMap[name] =
      (categoryMap[name] || 0) + Number(tx.amount);
  }

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      pct: expense > 0 ? (amount / expense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Daily cash flow
  const dailyMap = {};

  for (const tx of incomeTx) {
    if (!dailyMap[tx.date]) {
      dailyMap[tx.date] = { date: tx.date, income: 0, expense: 0 };
    }
    dailyMap[tx.date].income += Number(tx.amount);
  }

  for (const tx of expenseTx) {
    if (!dailyMap[tx.date]) {
      dailyMap[tx.date] = { date: tx.date, income: 0, expense: 0 };
    }
    dailyMap[tx.date].expense += Number(tx.amount);
  }

  const dailyFlow = Object.values(dailyMap).sort(
    (a, b) => (a.date < b.date ? -1 : 1)
  );

  return {
    pocket,
    income,
    expense,
    incomeCount,
    expenseCount,
    categoryBreakdown,
    dailyFlow,
  };
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
        "type, amount, from_pocket_id, to_pocket_id, category:category_id (name, group_name)"
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

  const incomeTx = monthTx.filter(
    (tx) => tx.type === "income"
  );

  const expenseTx = monthTx.filter(
    (tx) => tx.type === "expense"
  );

  const income = incomeTx.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const expense = expenseTx.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const incomeCount = incomeTx.length;
  const expenseCount = expenseTx.length;

  const pocketsWithCounts = pockets.map(
    (pocket) => {
      const incomeCountForPocket =
        monthTx.filter(
          (tx) =>
            tx.type === "income" &&
            tx.to_pocket_id === pocket.pocket_id
        ).length;

      const expenseCountForPocket =
        monthTx.filter(
          (tx) =>
            tx.type === "expense" &&
            tx.from_pocket_id === pocket.pocket_id
        ).length;

      const expenseTxForPocket = monthTx.filter(
        (tx) =>
          tx.type === "expense" &&
          tx.from_pocket_id === pocket.pocket_id
      );

      const expenseForPocket = expenseTxForPocket.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0
      );

      const categoryMap = {};

      for (const tx of expenseTxForPocket) {
        const name = tx.category?.name || "Other";
        categoryMap[name] =
          (categoryMap[name] || 0) + Number(tx.amount);
      }

      const categoryBreakdown = Object.entries(categoryMap)
        .map(([name, amount]) => ({
          name,
          amount,
          pct:
            expenseForPocket > 0
              ? (amount / expenseForPocket) * 100
              : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        ...pocket,
        incomeCount: incomeCountForPocket,
        expenseCount: expenseCountForPocket,
        categoryBreakdown,
      };
    }
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

  const expenseGroupMap = {};

  for (const tx of expenseTx) {
    const group = tx.category?.group_name || "Other";
    const catName = tx.category?.name || "Other";

    if (!expenseGroupMap[group]) {
      expenseGroupMap[group] = { amount: 0, categories: {} };
    }

    expenseGroupMap[group].amount += Number(tx.amount);
    expenseGroupMap[group].categories[catName] =
      (expenseGroupMap[group].categories[catName] || 0) +
      Number(tx.amount);
  }

  const categoryGroupBreakdown = Object.entries(expenseGroupMap)
    .map(([group, groupData]) => ({
      group,
      amount: groupData.amount,
      pct: expense > 0 ? (groupData.amount / expense) * 100 : 0,
      categories: Object.entries(groupData.categories)
        .map(([name, amount]) => ({
          name,
          amount,
          pct:
            groupData.amount > 0
              ? (amount / groupData.amount) * 100
              : 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    pockets: pocketsWithCounts,
    debts,
    totalBalance,
    income,
    expense,
    incomeCount,
    expenseCount,
    totalDebt,
    categoryGroupBreakdown,
  };
}
// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getPeriodBounds(referenceDate, periodType) {
  const d = new Date(referenceDate);

  if (periodType === "weekly") {
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return {
      start: toLocalDateStr(start),
      end: toLocalDateStr(end),
    };
  }

  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

  return {
    start: toLocalDateStr(start),
    end: toLocalDateStr(end),
  };
}

export function shiftPeriod(periodStart, periodType, direction) {
  const d = new Date(`${periodStart}T00:00:00`);

  if (periodType === "weekly") {
    d.setDate(d.getDate() + direction * 7);
  } else {
    d.setMonth(d.getMonth() + direction);
  }

  return getPeriodBounds(d, periodType);
}

export async function getBudgetPeriodSetting() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("profiles")
    .select("budget_period")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data?.budget_period || "monthly";
}

export async function updateBudgetPeriodSetting(period) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("profiles")
    .update({ budget_period: period })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getIncomeSuggestion(periodStart, periodEnd) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("transactions")
    .select("id, date, amount, source_text, description")
    .eq("owner_id", userId)
    .eq("type", "income")
    .gte("date", periodStart)
    .lt("date", periodEnd)
    .order("date", { ascending: false });

  if (error) throw error;

  const total = (data || []).reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  return { total, transactions: data || [] };
}

export async function getBudgetPeriod(periodStart) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("budget_periods")
    .select("*")
    .eq("owner_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function setBudgetPeriodBase({
  periodStart,
  periodEnd,
  amount,
  source,
}) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("budget_periods")
    .upsert(
      {
        owner_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        base_amount: amount,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,period_start" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBudgetAllocations(periodStart) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("budget_allocations")
    .select(
      "id, group_name, category_id, amount, category:category_id (name, group_name)"
    )
    .eq("owner_id", userId)
    .eq("period_start", periodStart);

  if (error) throw error;
  return data || [];
}

export async function setBudgetAllocation({
  periodStart,
  groupName,
  categoryId,
  amount,
}) {
  const userId = await getCurrentUserId();

  let query = supabase
    .from("budget_allocations")
    .select("id")
    .eq("owner_id", userId)
    .eq("period_start", periodStart)
    .eq("group_name", groupName);

  query = categoryId
    ? query.eq("category_id", categoryId)
    : query.is("category_id", null);

  const { data: existing, error: findError } = await query.maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { data, error } = await supabase
      .from("budget_allocations")
      .update({
        amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("budget_allocations")
    .insert({
      owner_id: userId,
      period_start: periodStart,
      group_name: groupName,
      category_id: categoryId || null,
      amount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBudgetAllocation(id) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("budget_allocations")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);

  if (error) throw error;
}

export async function copyBudgetForward(periodStart) {
  const userId = await getCurrentUserId();

  const { data: existingRows, error: existingError } = await supabase
    .from("budget_allocations")
    .select("id")
    .eq("owner_id", userId)
    .eq("period_start", periodStart)
    .limit(1);

  if (existingError) throw existingError;
  if (existingRows && existingRows.length > 0) return [];

  const { data: priorRows, error: priorError } = await supabase
    .from("budget_allocations")
    .select("period_start")
    .eq("owner_id", userId)
    .lt("period_start", periodStart)
    .order("period_start", { ascending: false })
    .limit(1);

  if (priorError) throw priorError;
  if (!priorRows || priorRows.length === 0) return [];

  const priorPeriodStart = priorRows[0].period_start;

  const { data: priorAllocations, error: allocError } = await supabase
    .from("budget_allocations")
    .select("group_name, category_id, amount")
    .eq("owner_id", userId)
    .eq("period_start", priorPeriodStart);

  if (allocError) throw allocError;
  if (!priorAllocations || priorAllocations.length === 0) return [];

  const rowsToInsert = priorAllocations.map((row) => ({
    owner_id: userId,
    period_start: periodStart,
    group_name: row.group_name,
    category_id: row.category_id,
    amount: row.amount,
  }));

  const { data, error } = await supabase
    .from("budget_allocations")
    .insert(rowsToInsert)
    .select();

  if (error) throw error;
  return data;
}

export async function getBudgetSpending(periodStart, periodEnd) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "amount, category:category_id (id, name, group_name)"
    )
    .eq("owner_id", userId)
    .eq("type", "expense")
    .gte("date", periodStart)
    .lt("date", periodEnd);

  if (error) throw error;

  const groupSpend = {};
  const categorySpend = {};

  for (const tx of data) {
    const group = tx.category?.group_name || "Other";
    const catId = tx.category?.id;
    const amount = Number(tx.amount);

    groupSpend[group] = (groupSpend[group] || 0) + amount;

    if (catId) {
      categorySpend[catId] = (categorySpend[catId] || 0) + amount;
    }
  }

  return { groupSpend, categorySpend };
}

export async function getBudgetSpendingHistory(
  beforeDate,
  daysBack = 60
) {
  const userId = await getCurrentUserId();

  const since = new Date(`${beforeDate}T00:00:00`);
  since.setDate(since.getDate() - daysBack);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, category:category_id (name, group_name)")
    .eq("owner_id", userId)
    .eq("type", "expense")
    .gte("date", toLocalDateStr(since))
    .lt("date", beforeDate);

  if (error) throw error;

  const groupTotals = {};

  for (const tx of data) {
    const group = tx.category?.group_name || "Other";
    groupTotals[group] = (groupTotals[group] || 0) + Number(tx.amount);
  }

  return Object.entries(groupTotals)
    .map(([group, amount]) => ({ group, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    { redirectTo: window.location.origin }
  );

  if (error) throw error;
}

export async function updateUserPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}
