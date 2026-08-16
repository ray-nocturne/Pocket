# Pocket Master — Transactions View All Hotfix

## Date
17 August 2026

## Issue

The History Transactions "View All" page stopped loading after the currency formatter migration.

## Root Cause

useCurrency() was accidentally inserted inside the toLocalDateString() helper in Transactions.jsx.

React Hooks must be called from a React component or custom hook, not from a regular helper function.

This caused the Transactions page to fail at runtime.

## Fix

Moved:

const { formatMoney } = useCurrency();

from toLocalDateString() into the Transactions component.

The date helper is now a pure utility function again.

## Result

- History → View All loads normally.
- Transaction amounts continue using formatMoney().
- Currency settings remain supported.
- No database changes were required.

## Verification

Production build completed successfully with:

npm run build

## Commit

This hotfix is committed separately from the currency migration feature.
