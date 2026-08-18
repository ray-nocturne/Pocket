# Changelog

All notable changes to Pocket Master are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Each session's work is grouped under its date. Newest entries at the top.

## [Unreleased]

## 2026-08-18 (cont'd 2)

### Added
- Google Sign-In on the Login screen: new "SIGN IN WITH GOOGLE" button (HUD outline style, below the existing Log In/Sign Up button) using Supabase's `signInWithOAuth`. New `signInWithGoogle()` helper added in `queries.js`. New users via Google get the same auto-seeded profile + default categories as email signups. Required a new Google Cloud OAuth Client ID (project `pocketmaster-505913`) and enabling the Google provider in Supabase Auth, plus adding `localhost:5175` and `app.pocketmaster.id` to Supabase's allowed redirect URLs.

Note: Google sign-in doesn't yet call `checkAccountActive()` like the password flow does - a deactivated account could still sign in via Google until that check is added to the `onAuthStateChange` listener in `App.jsx`.

## 2026-08-18 (cont'd)

### Added
- Domain-scoped redirect: `pocketmaster.id` and `www.pocketmaster.id` now 301-redirect to `app.pocketmaster.id` via `public/_redirects`. `pocketmaster1.netlify.app` (and `app.pocketmaster.id` itself) are unaffected and continue serving the app directly. Interim step for Task 6 (marketing landing page + domain restructuring) - once the landing page replaces the root domain, this redirect will already have visitors flowing correctly to the app subdomain.

## 2026-08-18

### Fixed
- Mobile browsers (especially iOS Safari/WebKit) aggressively evict backgrounded tabs from memory, causing a full reload back to Home whenever the user switched apps (e.g. to Gallery to pick a proof photo) and returned - losing their place and any in-progress form data. Added session-scoped state persistence:
  - `App.jsx` now persists which screen the user is on (plus the selected pocket/debt for detail screens) to `sessionStorage`, and restores it on reload instead of defaulting to Dashboard. Screens that need un-serializable context (e.g. Transaction Detail, Edit Transaction) safely fall back to Dashboard rather than restoring in a broken state.
  - `TransactionForm.jsx` now persists the entire in-progress draft (type, amount, description, pocket/category selections, fee, proof photo, etc.) to `sessionStorage` while creating a new transaction, and restores it automatically if the page reloads mid-entry. The draft is cleared on successful save or explicit cancel.
- Native app packaging (PWA manifest) noted as a complementary follow-up to reduce how often this eviction happens in the first place - not yet implemented.

## 2026-08-17 (cont'd 16)

### Fixed
- Swept the app for remaining `type="number"` inputs that were missed during the earlier Amount/Fee delimiter migration: pocket initial balance (3 form variants in AddPocketFlow.jsx) and debt total amount / monthly installment (AddDebtForm.jsx) now use the same `type="text" inputMode="numeric"` + thousand-separator display pattern already used for transaction amounts. This also fixes an inconsistent mobile keyboard issue where `type="number"` sometimes brought up a full letter keyboard instead of a numeric keypad on iOS. Debt due-day input also switched to the same numeric-keyboard-reliable pattern (digits only, no delimiter needed for a 1-31 day value).

## 2026-08-17 (cont'd 15)

### Fixed
- `CurrencyContext.jsx` used `.single()` when loading a user's currency preferences from `profiles`, which throws a 406 error if the query momentarily returns 0 rows (e.g. right after a fresh login/email-confirmation, before the session is fully settled) - visible as a console error even though the app already gracefully fell back to IDR defaults with no visible impact. Switched to `.maybeSingle()`, which returns null instead of erroring, silencing the false-alarm console noise with no behavior change.

## 2026-08-17 (cont'd 14)

### Added
- Implemented the "Forgot password?" flow end-to-end, previously just placeholder text on the login screen. Clicking it now shows an inline email-entry view (reusing the login screen's HUD styling) that calls `supabase.auth.resetPasswordForEmail()`. New `ResetPassword.jsx` screen (reusing the same password-rules checklist and show/hide toggle pattern from Sign Up) is shown when the user follows the reset link from their email, detected via `type=recovery` in the URL hash in `App.jsx` (same pattern as the existing `type=signup` email-confirmation detection, but keeps the session active since Supabase's recovery link grants a temporary session needed to call `updateUser({password})`). On success, signs the user out and returns them to Login to sign in with the new password.
- `requestPasswordReset()` and `updateUserPassword()` added to `queries.js`.
- Verified custom SMTP (Resend, domain `pocketmaster.id`, sender `noreply@pocketmaster.id`) is already configured and domain-verified in Resend - this appears to have been completed in an earlier session. Live email delivery not yet re-tested end-to-end since the forgot-password feature didn't exist until now.

## 2026-08-17 (cont'd 13)

### Added
- New `AccountActivated.jsx` screen shown after a user clicks the email confirmation link. Previously, confirming email silently auto-signed the user in and dropped them straight into the Dashboard with no explicit "your account is confirmed" moment. Now `App.jsx` detects the `type=signup` verification hash in the URL, shows a styled confirmation screen (HUD corner brackets, matching the rest of the app), explicitly signs the user out, and cleans up the URL - clicking "Continue" takes them to the Login screen to sign in properly with their credentials.
- NOTE: This was built in a separate session (uncommitted at the time) and got swept into commit e3351be alongside an unrelated bug fix via a routine `git add .` - not authored in this session, documented here after the fact for changelog accuracy. Worth a quick manual test of the full signup -> email confirmation -> "Continue" -> login flow to confirm it behaves as intended in practice.

## 2026-08-17 (cont'd 12)

### Fixed
- **Production-breaking bug**: Pocket Detail and Debt Detail screens crashed with a blank page in production (`Uncaught ReferenceError: formatMoney is not defined`). Root cause: during the earlier currency-formatter migration, both `PocketDetail.jsx` and `DebtDetail.jsx` imported `useCurrency` but never actually called the hook inside their main component (`const { formatMoney } = useCurrency();` was missing), so every `fmt(value, formatMoney)` call site referenced an undefined variable. Additionally, `PocketDetail.jsx`'s `CategoryDonut` sub-component (defined outside the main component) called `formatMoney` without receiving it as a prop at all. Fixed both: added the missing hook call to each main component, and passed `formatMoney` as a prop into `CategoryDonut`. Swept all other currency-migrated files (Dashboard, Transactions, AllPockets, TransactionDetail, TransactionForm, Debts) to confirm none have the same missing-hook-call pattern.

## 2026-08-17 (cont'd 11)

### Added
- Task D: Budget feature, activating the "Budget" footer tab (previously showing a "SOON" badge).
- New `budget_periods` and `budget_allocations` tables, plus `profiles.budget_period` (global weekly/monthly setting). Base amount per period is transparently suggested from income transactions in that period (with the contributing transactions listed), can be accepted as-is or overridden manually, and locks once confirmed so it doesn't shift mid-period as new transactions come in.
- Zero-based allocation model: Base amount minus Allocated equals Unallocated, shown at the top of the Budget screen with the same HUD panel styling used elsewhere.
- Budgets can be set per category group (quick, one number) or drilled down to individual categories within a group (e.g. Breakfast/Lunch/Dinner separately) — group total is automatically derived from its category-level budgets when set that way, avoiding double-counting.
- Category rows show progress bars (green/amber/red based on percentage spent) comparing actual spending this period against budget, computed from real transaction data.
- New month/week periods with no budget yet automatically copy forward the previous period's allocations (editable afterward) via `copyBudgetForward()`, so users aren't starting from scratch every period.
- Period navigation (previous/next arrows) respects the user's chosen period type (weekly shows date ranges like "11 Aug - 17 Aug", monthly shows "August 2026").

## 2026-08-17 (cont'd 10)

### Fixed
- Transaction description was silently dropped from the Transaction Detail screen during the earlier redesign (subtitle switched from description to payee, but description itself was never given a new home). Added back as a "Description" row between Category and Payment method, shown only when the transaction has one.

## 2026-08-17 (cont'd 9)

### Added
- New "Category" breakdown section on the Dashboard, positioned between Pockets and Debts, matching their existing swipeable card pattern. Card 1 shows this month's expense spending grouped by category group (Food, Transportation, Financial, etc. — top 5 groups + "Other" bucket), donut + legend with percentages, consistent with the Pockets/Debts breakdown cards above and below it. Swiping reveals one card per group showing that group's individual categories (e.g. Breakfast/Lunch/Dinner/Coffee within Food) with nominal amounts, top 4 + "Others" bucket. Cards are informational only (not tappable) and pocket-of-payment info was deliberately left out to keep the focus on category composition.
- `getDashboardData()` now also returns `categoryGroupBreakdown`, computed server-round-trip-free from the same month's transaction data already being fetched (added `group_name` to the category select).

## 2026-08-17 (cont'd 8)

### Fixed
- Balance show/hide toggle on the Dashboard reset to visible every time the screen remounted (navigating away and back), instead of remembering the last state. Now persisted to `localStorage` (`pm_balance_visible`), device-level since it's a display preference rather than account data.
- The masked balance placeholder (shown when hidden) displayed the raw currency code ("IDR••••••••") instead of the proper symbol ("Rp ••••••••"), because `getCurrencySymbol()` lacked the IDR special-case that `formatMoney()` already had. Centralized the special-casing into `getCurrencySymbol()` (single source of truth) and had `formatMoney()` reuse it, removing the duplicated logic.

## 2026-08-17 (cont'd 7)

### Changed
- Redesigned Transaction Detail screen layout: subtitle under the amount now shows the payee ("For whom") value directly instead of the description, with the standalone "For whom" row removed from the details section since it's now the subtitle. Details section reordered to Type, Transaction ID (moved up from the page footer), Date, Time (new), Pocket, Category, Payment method. Transaction ID now displays in full (wraps instead of truncating). "View full size" link under the attached photo is now center-aligned instead of left-aligned.

### Fixed
- Transaction Detail's date was still rendering in Indonesian ("17 Agustus 2026") — `formatDate` was hardcoded to the `id-ID` locale, missed by the earlier language sweeps since it lives in this file specifically. Switched to `en-US`.

## 2026-08-17 (cont'd 6)

### Added
- Multi-currency support: users can now pick any of 162 world currencies plus a number-format style (`1,234.56` US / `1.234,56` EU / `1 234,56` space-separated) and a decimal-display toggle, all configurable from the Profile screen (Currency settings section, saved without leaving the page). Settings stored per-user in `profiles.currency` / `profiles.number_format` / `profiles.show_decimals`.
- Centralized currency formatting via `src/lib/currency.js` (symbol lookup + configurable separators, with a special-cased `Rp ` display for IDR) and `src/lib/CurrencyContext.jsx` (loads the user's preferences once, exposes `formatMoney()` and `refreshCurrencySettings()` app-wide via a React Context wrapping the app in `main.jsx`).
- `updateCurrencySettings()` added to `queries.js` for saving the 3 preference fields.

### Changed
- Migrated all hardcoded `"Rp" + ...toLocaleString("id-ID")` formatting to the shared `formatMoney()` across Dashboard, Transactions, AllPockets, PocketDetail, TransactionDetail, TransactionForm, Debts, and DebtDetail — every monetary display in the app now respects the user's chosen currency, delimiter style, and decimal preference instead of being hardcoded to Rupiah.
- Removed the redundant gear/settings icon button from the Profile header now that Currency settings live inline on the Profile page.

### Fixed
- Transactions "View All" screen broke after the currency migration: `useCurrency()` (a React Hook) was accidentally called inside `toLocalDateString()`, a plain helper function outside any component, which is invalid — Hooks may only be called from a component or another Hook. Moved the hook call back into the `Transactions` component itself; the date helper is a pure function again.

## 2026-08-17 (cont'd 5)

### Fixed
- **Timezone bug**: date grouping/labeling ("Today"/"Yesterday") and the default date in new transactions were computed via `new Date().toISOString().slice(0, 10)`, which returns the UTC date rather than the local device date. For users ahead of UTC (e.g. WIB, UTC+7), this caused the wrong day to be labeled "Today" during early morning hours (roughly midnight-7am local time), and could default new transactions to the previous day's date during that window. Replaced with a `toLocalDateString()` helper using `getFullYear()/getMonth()/getDate()` (local timezone) across Dashboard.jsx, Transactions.jsx, and TransactionForm.jsx.
- Restructured the "View All" Transactions screen's row layout and date-group labels to match the Dashboard's earlier fix (English "Today, August 17" / "Yesterday, August 16" style labels, category/pocket/description/amount/time in the same left-right 3-line layout, proof-photo icon added). Previously this screen still showed the old single-column layout and Indonesian "Riwayat semua transaksi" subtitle.

## 2026-08-17 (cont'd 4)

### Changed
- Restructured transaction row cards to a clearer left/right layout across 3 lines: line 1 is category (left) + pocket name (right), line 2 is description (left) + amount (right), line 3 is time only. Replaces the previous single-column stack where category/description/pocket were all crammed onto 2 lines.

## 2026-08-17 (cont'd 3)

### Changed
- Simplified transaction row cards (Dashboard recent transactions list) to 3 fixed lines: category, description + pocket name, and time. Removed the date from each row entirely since transactions are already grouped under date headers, and removed the fallback "Lainnya" text (now "Other"). This fixes rows rendering at inconsistent heights when descriptions were long.

### Fixed
- Swept and fixed 16 more leftover Indonesian strings across Category.jsx, Dashboard.jsx, DebtDetail.jsx, Debts.jsx, and Transactions.jsx: empty-state messages ("Belum ada kategori/pocket/hutang/transaksi/pembayaran" -> "No .../ yet"), installment labels ("Cicilan .../bln" -> "Installment .../mo"), "sisa hutang" -> "remaining debt", and a page subtitle ("Kelola kategori transaksi" -> "Manage your transaction categories").

## 2026-08-17 (cont'd)

### Fixed
- Caught 3 more leftover Indonesian strings on Dashboard.jsx missed by the earlier sweep: "Lihat Semua" (2 occurrences, Pockets and Debts breakdown sections) -> "View All", "Transaksi Terakhir" -> "Transaction History".

## 2026-08-17

### Added
- Redesigned Dashboard header (section 1): now shows the user's actual profile photo (falls back to initial letter avatar), a settings gear icon linking to Profile, right-aligned Total Balance with a show/hide toggle (masks the amount as dots), and a trend indicator showing this month's net change (income minus expense, colored green/red with a trending icon).
- Entire header wrapped in a single HUD panel: cyan corner brackets, a monospace "ACCOUNT OVERVIEW / LIVE" label row with a status dot, a thin divider, and a flat network/constellation pattern (small connected nodes, no blur or animation) as a subtle background texture — purely decorative, runs client-side only, no server cost.
- In/Out (income/expense this month) mini-card simplified to sit inside the same panel rather than as its own bordered box.

### Fixed
- Replaced remaining hardcoded Indonesian strings in Dashboard.jsx: greeting function (`getGreeting`) now returns "Good morning/afternoon/evening/night" instead of "Selamat Pagi/Siang/Sore/Malam"; transaction list date-group labels now read "Today, 17 August" / "Yesterday, 16 August" (previously "Hari ini"/"Kemarin" with no date, or bare date for older days) instead of Indonesian text, and the locale used to format those dates switched from `id-ID` to `en-US` so month names render in English; "Total saldo dari X pocket" replaced by the new header design entirely.

## 2026-08-16 (cont'd 8)

### Changed
- Renamed the "Dompet Tunai" cash pocket to "Cash" (Indonesian leftover, this one was original sample data rather than a deliberate user-chosen name).
- Replaced all remaining hardcoded Indonesian UI strings across 7 files (loading states, error messages, empty-state copy, button labels in Category, Dashboard, DebtDetail, Debts, TransactionForm, Transactions, and App) with English equivalents, completing the earlier UI language migration. User-chosen data (pocket names like "BCA Pribadi", debt names like "Cicil Retno" and "Rupiah Cepat") is intentionally left untouched since it's user customization, not app interface text.

## 2026-08-16 (cont'd 7)

### Added
- Thousand-separator formatting (e.g. `1.000.000`) on the Amount and Fee amount fields in TransactionForm while typing, making large nominal values easier to read and verify. Underlying stored value remains a plain number — only the input display is formatted, so validation, balance checks, and the saved transaction amount are unaffected.

## 2026-08-16 (cont'd 6)

### Fixed
- Pocket carousel cards on the Dashboard were in unsorted/random order, inconsistent with the donut chart legend right above them. Now sorted the same way: grouped by pocket type (bank, then emoney, then cash), and within each type ordered by balance descending.

## 2026-08-16 (cont'd 5)

### Changed
- Completed the category taxonomy migration (designed earlier this session). Cleaned up 13 leftover duplicate categories still sitting under the old "General" group in both expense (Bills, Groceries, Health, Housing/Rent, Personal Care, Shopping) and income (Bonus, Freelance, Gift, Investment Return, Other, Refund, Salary) after the new grouped taxonomy had already been built alongside them. One income transaction using the old "Other" category was reassigned to "Other Income > Other" before deletion. Final taxonomy also includes additional groups/categories beyond the original plan (Wellness group, Alcohol/Tobacco under Lifestyle, Credit Card Payment under Financial) added intentionally for more granularity. Final count: 95 expense categories, 23 income categories.
- Updated `handle_new_user()` trigger so new signups now get seeded with the current 118-category taxonomy (with correct `group_name` on every row) instead of the old 12-category default set.

## 2026-08-16 (cont'd 4)

### Added
- Small photo icon indicator next to transaction rows in Dashboard and Pocket Detail transaction lists when a proof-of-transaction photo is attached, so it's visible at a glance without opening each transaction's detail screen.

## 2026-08-16 (cont'd 3)

### Fixed
- "Category" footer tab did nothing when navigating from the Pocket screen (worked fine from Home/Profile). `AllPockets.jsx` destructured the prop as `onCategory` while `App.jsx` passed it as `onOpenCategory` (inconsistent with every other screen's naming), so the handler was `undefined`. Renamed to `onOpenCategory` in `AllPockets.jsx` to match the naming convention used everywhere else.

## 2026-08-16 (cont'd 2)

### Added
- Debt payments split into their own dedicated flow in TransactionForm: a "Regular Expense" / "Debt Payment" toggle replaces having "Debt" buried as one of 40+ categories. Selecting "Debt Payment" auto-assigns the Debt category behind the scenes, hides the "For whom" field, and shows a searchable debt picker (via PickerSheet) plus the Borrow/Payment toggle for revolving debts.
- "Debt" category removed from the regular category picker list (it's only reachable via the new Debt Payment toggle now).

## 2026-08-16 (cont'd)

### Added
- New reusable `PickerSheet.jsx` component: a searchable bottom-sheet picker replacing native `<select>` for pocket and category fields in TransactionForm. Fixes unreliable scrolling on iOS WebKit (Safari/Brave) with long option lists, and adds a search box so categories (40+ items across groups) don't require manual scrolling.
- Applied to all 6 relevant fields in TransactionForm: income to-pocket, expense from-pocket, transfer from/to-pocket, income category, expense category.

### Known limitations
- Debt picker (in the "Which debt to pay?" section) still uses a native `<select>` — a different approach for that field was intentionally deferred.

## 2026-08-16

### Added
- Category management screen: displays expense and income categories grouped, with transaction counts per category. Activated the "Category" footer tab.
- Debt system expanded to support two debt types: `fixed` (payment only) and `revolving` (borrow + payment, with a credit limit and available credit). Added `debts.debt_type` and `transactions.debt_action` ('borrow' | 'payment') columns, and updated the `debt_balances` view to compute borrowed/paid/remaining/available_credit per debt type.
- Debt Detail screen: summary, principal, remaining, paid, progress, installment, due date, payment history, with navigation to Transaction Detail.
- Borrow/Payment selector in TransactionForm for revolving debts (fixed debts are payment-only and hide the selector). Shows available credit or remaining balance depending on the selected action.
- Show/hide password toggle (eye icon) on login and register forms.
- Live password rule checklist on register: minimum 6 characters, must contain a letter, a number, and a special character.
- Helper text on login form clarifying it accepts email or username.
- Optional "proof of transaction" photo upload on Income/Expense/Transfer forms, with client-side compression (max 1200px, ~80% quality, 5MB upload limit) before storing in a new `transaction-proofs` Supabase Storage bucket.
- Proof of transaction photo now displays on the transaction detail screen (tap to view full size) when present.
- Storage RLS policies so users can only upload/delete their own transaction proof files, while the bucket stays publicly readable.

### Fixed
- Debt payments/borrows were completely broken: `validate_transaction_balance()` trigger required `debt_action` on any transaction linked to a debt, but `queries.js` (addTransaction/updateTransaction/TRANSACTION_SELECT) and `TransactionForm.jsx` never sent it — every debt-category transaction was rejected. Added `debt_action` end-to-end (data layer + form UI + payload), verified working for fixed-debt payment.
- Signup failing with 500 error: `handle_new_user()` trigger now generates a unique username by appending a numeric suffix on collision (was previously crashing on duplicate `username` derived from email prefix).
- Signup failing with "Error sending confirmation email": switched Supabase Auth from custom Resend SMTP (blocked by testing-domain restriction) back to Supabase's built-in email service for development.
- App redirecting to the last-viewed screen (e.g. Profile) instead of Home/Dashboard after login: `screen` state now resets to dashboard on every auth state change (login and logout).
- Initial Debt Detail dark/blank screen bug caused by React Hook ordering — fixed.

### Changed
- Login/register email field switches input type between `email` (register) and `text` (login) to properly support username-based login.

### Removed
- Duplicate catch-all categories "Meals" and "Transportation" that matched their own group name (0 transactions affected).
- "Food" category, merged into the Meals group; its 2 existing transactions manually reassigned (Breakfast, Snack).

### Known limitations
- Revolving debt borrow/payment flow implemented but not yet end-to-end tested in production (no revolving debt exists in the account yet). Fixed-debt payment confirmed working.
- No visual indicator yet in transaction list views (Dashboard/PocketDetail) showing which transactions have a proof photo attached.

### Planned (designed, not yet implemented)
- Full category taxonomy rehaul (Food/Housing/Transportation/Shopping/Health/Lifestyle/Entertainment/Family/Work & Business/Travel/Financial groups, income restructuring) — taxonomy finalized in chat, migration not yet started.
- Task D: savings pockets, income pass-through flag, budget screen.
