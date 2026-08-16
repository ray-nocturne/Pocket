import currencies from "./currencies.json";

const SEPARATORS = {
  us: { thousands: ",", decimal: "." },
  eu: { thousands: ".", decimal: "," },
  space: { thousands: " ", decimal: "," },
};

export const SEPARATOR_STYLES = [
  { value: "us", example: "1,234.56" },
  { value: "eu", example: "1.234,56" },
  { value: "space", example: "1 234,56" },
];

export function getCurrencySymbol(code) {
  const found = currencies.find((c) => c.code === code);
  return found?.symbol || code || "";
}

export function formatMoney(
  amount,
  { currency = "IDR", numberFormat = "eu", showDecimals = false } = {}
) {
  const { thousands, decimal } =
    SEPARATORS[numberFormat] || SEPARATORS.eu;

  const symbol = getCurrencySymbol(currency);
  const value = Math.abs(Number(amount) || 0);

  const rounded = showDecimals
    ? value.toFixed(2)
    : Math.round(value).toString();

  const [intPart, decPart] = rounded.split(".");

  const groupedInt = intPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousands
  );

  const formattedNumber =
    showDecimals && decPart
      ? `${groupedInt}${decimal}${decPart}`
      : groupedInt;

  const prefix =
    currency === "IDR"
      ? "Rp "
      : symbol;

  return `${prefix}${formattedNumber}`;
}

export { currencies };
