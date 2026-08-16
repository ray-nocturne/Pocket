# Changelog

All notable changes to Pocket Master are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Each session's work is grouped under its date. Newest entries at the top.

## [Unreleased]

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
