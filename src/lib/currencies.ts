export const currencies = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "United States Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "GBP", name: "British Pound Sterling", symbol: "£" },
];

export function getCurrencySymbol(code: string | undefined): string {
  if (!code) return "";
  const currency = currencies.find((c) => c.code === code);
  return currency ? currency.symbol : code;
}
