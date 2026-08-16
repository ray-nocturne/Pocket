# Pocket Master — Currency Format Migration

## Date
17 August 2026

## Objective

Migrated monetary displays from hard-coded Indonesian Rupiah formatting to the centralized `CurrencyContext`.

The application now supports user-selected:

- Currency
- Number format / delimiter
- Decimal display

## Components Migrated

- `Dashboard.jsx`
- `Transactions.jsx`
- `AllPockets.jsx`
- `PocketDetail.jsx`
- `TransactionDetail.jsx`
- `TransactionForm.jsx`
- `Debts.jsx`
- `DebtDetail.jsx`

## Result

Monetary displays now use:

```js
const { formatMoney } = useCurrency();
