import { useEffect, useState } from "react";

/**
 * Ticks down to 0 once per second. Call `restart()` to reset back to
 * `seconds` and start counting down again — e.g. right after a resend, to
 * re-arm the same cooldown.
 */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return { remaining, restart: () => setRemaining(seconds) };
}
