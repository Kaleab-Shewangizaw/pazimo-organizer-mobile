import { CinemaScanner } from "@/components/CinemaScanner";
import { EventCashierGate } from "@/components/EventCashierGate";
import { VenueScanner } from "@/components/VenueScanner";
import { useAuthStore } from "@/store/authStore";

/**
 * Branches on who actually signed in: a cinema account (role "cinema") or a
 * cashier scoped to a cinema admits tickets and redeems concessions; a
 * cashier scoped to a venue only ever hands over drinks (a venue sells
 * nothing else); a cashier scoped to NEITHER (an event cashier — see the
 * User model's role comment) has to redeem an event's code first, so it
 * goes through EventCashierGate instead of straight to a camera like the
 * other two.
 */
export default function CashierScanTabScreen() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === "cashier" && user.venue) {
    return <VenueScanner venueId={user.venue} />;
  }
  if (user?.role === "cashier" && !user.cinema && !user.venue) {
    return <EventCashierGate />;
  }
  return <CinemaScanner />;
}
