import { useEffect, useState } from "react";

/**
 * Milliseconds remaining until `targetIso`, ticking down once per second.
 * 0 while there's no target, and clamps at 0 once it's passed (never goes
 * negative) — a happy-hour campaign's status is derived from wall-clock
 * time (see backend/src/utils/happyHour.js), so the caller re-checks
 * `status` rather than this hook deciding when the phase changes.
 */
export function useCountdownTo(targetIso: string | null | undefined): number {
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const [remaining, setRemaining] = useState(() => (target ? Math.max(target - Date.now(), 0) : 0));

  useEffect(() => {
    if (!target) {
      setRemaining(0);
      return;
    }
    setRemaining(Math.max(target - Date.now(), 0));
    const id = setInterval(() => {
      setRemaining(Math.max(target - Date.now(), 0));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return remaining;
}
