# Pocket Master

A personal finance tracker built for real life — multiple accounts, real debts, real budgets, and real currencies, without forcing you into a rigid double-entry ledger you'll never actually maintain.

Built by Ray as a personal project, with production-ready ambitions.

---

## Why Pocket Master

Most budgeting apps either force you into a full accounting model that's overkill for personal use, or oversimplify to the point where they can't represent how money actually moves in real life — bills paid partly from savings, debts with revolving credit, income that isn't really "income" (pass-through money), or a household running on more than one currency.

Pocket Master is built around a simple but flexible core idea: **Pockets** (where your money physically lives) and **Categories** (why it moved) are two independent taxonomies, connected only through transactions. That single design decision is what lets the rest of the app stay simple while still handling real edge cases well.

## Core Features

### Multi-Pocket Money Tracking
Track balances across unlimited real-world accounts — bank accounts, e-wallets, and cash — each with its own provider (BCA, GoPay, Dana, etc.) and running balance computed automatically from your transaction history.

### Flexible Transaction Model
A single, flat transaction table handles income, expense, and transfers — no split-entry ledger complexity. Every transaction supports:
- An optional transaction fee, deducted from any pocket (not necessarily the same one as the transaction itself)
- An optional photo attachment (compressed client-side before upload, so a folder of receipts doesn't eat your storage quota)
- Exact date and time, always computed from your device's local timezone (not UTC), so "today" and "yesterday" labels are always correct no matter where you are

### Deep, Grouped Category Taxonomy
95 expense categories and 23 income categories, organized into 22 logical groups (Food, Transportation, Housing, Subscriptions split by type, Health, Travel, Wellness, and more) — granular enough for real insight, grouped enough to stay readable. Fully editable: rename, regroup, or add your own categories at any time.

### Debt Tracking — Fixed and Revolving
Not all debt behaves the same way. Pocket Master models both:
- **Fixed debt** (installment loans, BNPL/paylater) — track what's left to pay, due dates, and monthly installment amounts.
- **Revolving debt** (credit-card-style facilities) — track borrows and payments independently, with a live available-credit calculation, all validated server-side so you can never accidentally borrow past your limit.

Recording a debt payment or a new borrow is a dedicated flow in the transaction form — not something buried inside a long category list.

### Zero-Based Budgeting, On Your Terms
Set a "base amount" for each budgeting period (weekly or monthly) — Pocket Master transparently suggests one from your actual income transactions for that period (showing you exactly which transactions it's based on), but you're always free to override it manually. Once confirmed, it locks for that period so your budget doesn't silently shift as more transactions come in.

From there, allocate the base amount across category groups, or drill into any group to budget individual categories instead — the group total is derived automatically, so you're never double-counting. Progress bars turn amber and red as you approach and exceed budget. New periods automatically carry forward your last allocations, so you're never starting from a blank slate.

### Multi-Currency, Genuinely Localized
Pick from 162 world currencies, choose your preferred number-formatting convention (`1,234.56`, `1.234,56`, or `1 234,56`), and decide whether to show decimal places at all — all from your profile, applied consistently across every screen in the app.

### Visual Insight Without the Clutter
The dashboard surfaces spending broken down by category group with a donut chart and legend, drillable into a per-category view for any group — all computed live from your actual transaction data, not a stale monthly snapshot.

### Built for Real Devices
- A custom searchable bottom-sheet picker replaces native dropdowns for long lists (pockets, categories, debts) — sidesteps a known iOS Safari/WebKit scrolling bug and adds search on top.
- Thousand-separator formatting while typing amounts, so a stray extra zero is obvious before you save.
- Show/hide toggle for your total balance (with the setting remembered across sessions), for when you're checking your finances somewhere less private.

## Security

- Email/password authentication via Supabase Auth, with login by either email or username, plus a full forgot-password flow.
- Row Level Security enforced on every table — your data is never visible to any other user, even at the database level.
- Server-side validation (Postgres triggers) double-checks every transaction's balance math, fee logic, and debt limits — client-side bugs can't corrupt your data.
- Soft account deletion, so you're always in control of your own data.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Supabase (Postgres + Auth + Storage) |
| Hosting | Netlify |
| Email | Resend (custom domain SMTP) |

## Project Status

Pocket Master is actively developed and used daily by its creator. Core functionality — transactions, pockets, categories, fixed-debt tracking, budgeting, and multi-currency support — is stable and battle-tested through real personal use.

Still ahead before any wider release: revolving-debt end-to-end testing with real data, native app packaging for the App Store / Play Store, and a Privacy Policy / Terms of Service.

## License

Personal project. Not currently licensed for redistribution.
