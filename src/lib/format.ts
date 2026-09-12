import type { Currency } from "@/types";

const CURRENCY_SYMBOL: Record<Currency, string> = { ETB: "ETB", USD: "$" };

export function formatMoney(amount: number, currency: Currency): string {
  const rounded = Math.round(amount).toLocaleString("en-US");
  return currency === "USD" ? `$${rounded}` : `${rounded} ${CURRENCY_SYMBOL.ETB}`;
}

/** milliseconds -> "H:MM:SS", or "MM:SS" once under an hour — for a live countdown. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
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
