import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Providers (picker lists for bank / e-money)
// ---------------------------------------------------------------------------
export async function getProviders(type) {
  const { data, error } = await supabase.from("providers").select("*").eq("type", type).order("name");
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Pockets
// ---------------------------------------------------------------------------
export async function getPockets({ includeArchived = false } = {}) {
  let query = supabase.from("pocket_balances").select("*").order("name");
  if (!includeArchived) query = query.eq("archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addPocket({ type, providerName, name, initialBalance }) {
  const { data, error } = await supabase
    .from("pockets")
    .insert({
      type,
      provider_name: providerName ?? null,
      name: name || providerName || "Dompet Tunai",
      initial_balance: Number(initialBalance) || 0,
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
  const { data, error } = await supabase.from("categories").select("*").eq("type", type).order("name");
  if (error) throw error;
  return data;
}

export async function addCategory(type, name) {
  const { data, error } = await supabase.from("categories").insert({ type, name }).select().single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Debts
// ---------------------------------------------------------------------------
export async function getDebts({ includeArchived = false } = {}) {
  let query = supabase.from("debt_balances").select("*").order("name");
  if (!includeArchived) query = query.eq("archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addDebt({ name, totalAmount, monthlyInstallment, dueDay }) {
  const { data, error } = await supabase
    .from("debts")
    .insert({
      name,
      total_amount: Number(totalAmount),
      monthly_installment: monthlyInstallment ? Number(monthlyInstallment) : null,
      due_day: dueDay ? Number(dueDay) : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function getProfile() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id, username) {
  const { error } = await supabase.from("profiles").update({ username }).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Transactions — the core write path. One row per transaction, shape
// depends on `type`.
// ---------------------------------------------------------------------------
// payload shape:
// {
//   type: 'income' | 'expense' | 'transfer',
//   amount, description, date, paymentMethod,
//   feeAmount, feePocketId,
//   toPocketId, sourceText, categoryId,          // income
//   fromPocketId, payee, debtId,                 // expense (categoryId shared)
//   fromPocketId, toPocketId,                     // transfer
// }
export async function addTransaction(payload) {
  const row = {
    type: payload.type,
    amount: Number(payload.amount),
    description: payload.description || null,
    date: payload.date,
    payment_method: payload.paymentMethod,
    fee_amount: payload.feeAmount ? Number(payload.feeAmount) : null,
    fee_pocket_id: payload.feeAmount ? payload.feePocketId : null,
    from_pocket_id: payload.fromPocketId ?? null,
    to_pocket_id: payload.toPocketId ?? null,
    source_text: payload.sourceText ?? null,
    payee: payload.payee ?? null,
    category_id: payload.categoryId ?? null,
    debt_id: payload.debtId ?? null,
    proof_url: payload.proofUrl ?? null,
  };
  const { data, error } = await supabase.from("transactions").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function getRecentTransactions(limit = 20) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `id, type, amount, description, date, payment_method,
       from_pocket:from_pocket_id ( name ), to_pocket:to_pocket_id ( name ),
       category:category_id ( name )`
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getPocketTransactions(pocketId, limit = 30) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `id, type, amount, description, date, payment_method,
       from_pocket:from_pocket_id ( name ), to_pocket:to_pocket_id ( name ),
       category:category_id ( name )`
    )
    .or(`from_pocket_id.eq.${pocketId},to_pocket_id.eq.${pocketId}`)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------------
export async function getDashboardData(month = new Date()) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString().slice(0, 10);

  const [pockets, debts, monthTx] = await Promise.all([
    getPockets(),
    getDebts(),
    supabase
      .from("transactions")
      .select("type, amount")
      .gte("date", start)
      .lt("date", end)
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
  ]);

  const totalBalance = pockets.reduce((s, p) => s + Number(p.balance), 0);
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalDebt = debts.reduce((s, d) => s + Number(d.remaining), 0);

  return { pockets, debts, totalBalance, income, expense, totalDebt };
}
