# Pocket Master — Currency & Number Format

## Date
17 August 2026

## Feature
Added user-level currency and number formatting settings to Pocket Master.

### User Settings
Users can configure:

- Currency
- Number format / delimiter
- Decimal display

### Supported Number Formats

| Format | Example |
|---|---|
| US | `1,234.56` |
| EU | `1.234,56` |
| Space | `1 234,56` |

### Currency Formatting

Currency formatting is centralized through:

- `src/lib/currency.js`
- `src/lib/CurrencyContext.jsx`

The selected settings are stored per user in the `profiles` table.

For Indonesian Rupiah, the display format is:

`Rp 41.112.832`

instead of:

`IDR41.112.832`

## Database

The `profiles` table uses:

- `currency`
- `number_format`
- `show_decimals`

Current defaults:

- `currency`: `IDR`
- `number_format`: `eu`
- `show_decimals`: `false`

## Code Changes

### Currency utilities

`src/lib/currency.js`

- Added currency symbol lookup.
- Added configurable thousands separator.
- Added configurable decimal separator.
- Added optional decimal display.
- Added special `IDR` display as `Rp `.

### Currency context

`src/lib/CurrencyContext.jsx`

- Loads currency settings from the current user's profile.
- Provides `formatMoney()` globally.
- Provides `refreshCurrencySettings()`.

### Profile

`src/components/Profile.jsx`

Added a Currency settings section containing:

- Currency selector
- Number format selector
- Save Currency Settings button

The settings are saved without leaving the Profile page.

The redundant gear button in the Profile header was removed.

### Queries

`src/lib/queries.js`

Added:

`updateCurrencySettings()`

This updates:

- `currency`
- `number_format`
- `show_decimals`

for the current profile.

### Dashboard

`src/components/Dashboard.jsx`

The Dashboard now uses `CurrencyContext` / `formatMoney()` for monetary display instead of hard-coded Rupiah formatting.

## Current UI Structure

Profile now contains:

1. Profile information
2. Share Pocket
3. Currency settings
   - Currency
   - Number format
   - Save
4. Account Settings
5. Change Password
6. Notifications
7. Log Out

## Notes

Currency settings are user preferences and should remain separate from Account Settings.

The existing `profiles` schema already supported the required currency fields, so no new database columns were required for this feature.

## Next Step

Continue migrating remaining hard-coded `Rp` formatters in other components to `useCurrency()` / `formatMoney()` so the selected currency applies consistently throughout the entire application.
