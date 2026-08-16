# Changelog

All notable changes to Pocket Master are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Each session's work is grouped under its date. Newest entries at the top.

## [Unreleased]

## 2026-08-16

### Added
- Show/hide password toggle (eye icon) on login and register forms.
- Live password rule checklist on register: minimum 6 characters, must contain a letter, a number, and a special character.
- Helper text on login form clarifying it accepts email or username.
- Optional "proof of transaction" photo upload on Income/Expense/Transfer forms, with client-side compression (max 1200px, ~80% quality, 5MB upload limit) before storing in a new `transaction-proofs` Supabase Storage bucket.
- Proof of transaction photo now displays on the transaction detail screen (tap to view full size) when present.
- Storage RLS policies so users can only upload/delete their own transaction proof files, while the bucket stays publicly readable.

### Fixed
- Signup failing with 500 error: `handle_new_user()` trigger now generates a unique username by appending a numeric suffix on collision (was previously crashing on duplicate `username` derived from email prefix).
- Signup failing with "Error sending confirmation email": switched Supabase Auth from custom Resend SMTP (blocked by testing-domain restriction) back to Supabase's built-in email service for development.
- App redirecting to the last-viewed screen (e.g. Profile) instead of Home/Dashboard after login: `screen` state now resets to dashboard on every auth state change (login and logout).

### Changed
- Login/register email field switches input type between `email` (register) and `text` (login) to properly support username-based login.

### Removed
- Duplicate catch-all categories "Meals" and "Transportation" that matched their own group name (0 transactions affected).
- "Food" category, merged into the Meals group; its 2 existing transactions manually reassigned (Breakfast, Snack).

### Planned (designed, not yet implemented)
- Full category taxonomy rehaul (Food/Housing/Transportation/Shopping/Health/Lifestyle/Entertainment/Family/Work & Business/Travel/Financial groups, income restructuring) — taxonomy finalized in chat, migration not yet started.
- Category management screen (Task B/C).
- Task D: savings pockets, income pass-through flag, budget screen.
