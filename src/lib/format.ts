import type { Currency } from "@/types";

const CURRENCY_SYMBOL: Record<Currency, string> = { ETB: "ETB", USD: "$" };

export function formatMoney(amount: number, currency: Currency): string {
  const rounded = Math.round(amount).toLocaleString("en-US");
  return currency === "USD" ? `$${rounded}` : `${rounded} ${CURRENCY_SYMBOL.ETB}`;
}

export function formatEventDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startLabel = start.toLocaleDateString("en-US", opts);
  if (start.toDateString() === end.toDateString()) return startLabel;
  const endLabel = end.toLocaleDateString("en-US", opts);
  return `${startLabel} – ${endLabel}`;
}
