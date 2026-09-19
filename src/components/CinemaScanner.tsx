import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  checkInCinemaOrder,
  checkInCinemaTicket,
  getCinemaStaffOrder,
  getCinemaStaffTicket,
  redeemCinemaConcession,
} from "@/api/cinema";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { ApiError } from "@/types";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { darkColors } from "@/lib/theme";
import type { CinemaOutstandingConcessionItem, CinemaStaffTicket } from "@/types";

/**
 * A scan or typed code, looked up but not yet acted on — the "here's what
 * this is" step, so staff confirm with a tap instead of the door admitting
 * the instant a camera decodes a frame. `tickets` holds one row for a
 * single-seat code, or every seat on the order for a whole-order code.
 *
 * Mirrors the already-shipped web dashboard's components/cinema/cinema-
 * scanner.tsx exactly — same two endpoints, same lookup-then-confirm shape.
 */
type Pending = {
  kind: "ticket" | "order";
  code: string;
  tickets: CinemaStaffTicket[];
  owed: CinemaOutstandingConcessionItem[];
  /** The screening has already ended (now is past showtime.endsAt), per the
   * same gate the backend's checkIn/checkInOrder enforce — admitting is
   * blocked, so the confirm button never even offers it. */
  isExpired: boolean;
  /** Doors aren't open yet (now is more than the early-admission window
   * before showtime.startsAt) — the other half of the same gate. Mutually
   * exclusive with isExpired; neither true means it's playing right now. */
  isTooEarly: boolean;
} | null;

type Outcome = {
  kind: "ok" | "error";
  title: string;
  detail: string;
  owed?: CinemaOutstandingConcessionItem[];
} | null;

const colors = darkColors;
const CHROME_GRADIENT = ["#242424", "#050505"] as const;
const CHROME_BORDER = "#404040";

/**
 * Pulls the code — and what KIND of code it is — out of whatever the camera
 * decoded. Two kinds of cinema QR exist: a whole-ORDER code
 * (`{ctx:"CINEMA_ORDER", ref}`, shown once on the order confirmation page)
 * and a single-SEAT code (`{ctx:"CINEMA", tid}`). Current codes are printed
 * bare (no JSON envelope — see buildCinemaQrPayload on the backend) so this
 * also has to handle a bare string with no tag at all: the caller tries it
 * as a ticket id first and falls back to an order reference.
 *
 * An EVENT ticket is rejected here, before any request goes out — admitting
 * one at a cinema would be meaningless, since check-in only ever reads the
 * CinemaTicket collection.
 */
function extractCode(raw: string): { kind?: "ticket" | "order"; code?: string; wrongKind?: boolean } {
  const text = raw.trim();
  if (!text) return {};

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      if (parsed.ctx === "CINEMA_ORDER" && parsed.ref) {
        return { kind: "order", code: String(parsed.ref) };
      }
      if (parsed.ctx === "CINEMA" && parsed.tid) return { kind: "ticket", code: String(parsed.tid) };
      if (parsed.tid) return { wrongKind: true };
      return {};
    }
  } catch {
    // Not JSON — fall through and treat it as a bare code.
  }

  return { code: text };
}

const seatLabel = (t: CinemaStaffTicket) =>
  t.seats?.length
    ? t.seats.length === 1
      ? `Row ${t.seats[0].row} · Seat ${t.seats[0].number}`
      : `Seats ${t.seats.map((s) => `${s.row}${s.number}`).join(", ")}`
    : `${t.ticketType} × ${t.quantity}`;

/** Seat keys on this ticket not yet admitted — what a fresh lookup pre-selects,
 * and what "select all" means once someone starts unchecking a few. */
const outstandingSeatKeys = (t: CinemaStaffTicket) =>
  (t.seats || []).filter((s) => !s.admittedAt).map((s) => s.seatKey!);

// Usable at all — not fully admitted, paid, not cancelled/refunded.
const eligibleFor = (t: CinemaStaffTicket) =>
  !t.checkedIn && t.paymentStatus === "completed" && !["cancelled", "refunded"].includes(t.status);

/** Every seat across a set of ticket documents, each tagged with which
 * ticket (and tier) it came from — a group of 4 does not have to share one
 * ticket type for the door to admit them seat by seat. */
type FlatSeat = {
  key: string;
  row?: string;
  number?: string;
  categoryLabel?: string;
  ticketType: string;
  admittedAt?: string | null;
};
const flattenSeats = (tickets: CinemaStaffTicket[]): FlatSeat[] =>
  tickets.flatMap((t) =>
    (t.seats || []).map((s) => ({
      key: s.seatKey!,
      row: s.row,
      number: s.number,
      categoryLabel: s.categoryLabel,
      ticketType: t.ticketType,
      admittedAt: s.admittedAt,
    })),
  );

function errorMessage(error: unknown, fallback: string): string {
  return bannerMessageFor(error) ?? fallback;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "Today · 7:30 PM" / "Tomorrow · 7:30 PM" / "Fri, Mar 12 · 7:30 PM" — a
 * bare time is ambiguous once a showtime isn't for right now, so this always
 * carries the day too. */
const formatShowtime = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dayDiff = Math.round(
    (startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86_400_000,
  );
  const day =
    dayDiff === 0
      ? "Today"
      : dayDiff === 1
        ? "Tomorrow"
        : dayDiff === -1
          ? "Yesterday"
          : date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `${day} · ${time}`;
};

/**
 * Camera-driven QR/barcode scanner for a cinema's own door and concession
 * counter. Handles both kinds of code a ticket can carry (a single seat, or a
 * whole multi-seat order), lets staff admit some or all of the outstanding
 * seats on it, and surfaces anything paid for online but not yet collected so
 * it can be handed over in the same motion.
 *
 * The camera only mounts while this screen is actually focused, matching
 * TicketScanner: only one CameraView may be active at a time, and a tab
 * screen stays mounted (just unfocused) when staff switch tabs.
 */
export function CinemaScanner({ onBack }: { onBack?: () => void }) {
  const isFocused = useIsFocused();
  const tabBarHeight = useTabBarHeight();
  // request: true fires the native OS permission dialog itself the moment
  // this screen mounts (a no-op if already granted/permanently denied) —
  // staff get the system popup instantly instead of tapping through our
  // own "Grant access" screen first.
  const [permission, requestPermission] = useCameraPermissions({ request: true });

  const [pending, setPending] = useState<Pending>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [looking, setLooking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [collectError, setCollectError] = useState<string | null>(null);
  // A ref rather than state: the camera fires many frames per second and
  // state would not have committed before the next one arrived, so the same
  // code would be looked up several times over.
  const busyRef = useRef(false);

  const resetSoon = () => {
    setTimeout(() => {
      busyRef.current = false;
    }, 2000);
  };

  /** Hand one pre-bought item over. Works whether it's shown on the pending
   * (pre-confirm) card or the outcome (post-confirm) card. */
  const collect = async (item: CinemaOutstandingConcessionItem) => {
    setCollectingId(item._id);
    setCollectError(null);
    try {
      await redeemCinemaConcession(item._id);
      setPending((prev) => (prev ? { ...prev, owed: prev.owed.filter((o) => o._id !== item._id) } : prev));
      setOutcome((prev) =>
        prev ? { ...prev, owed: (prev.owed || []).filter((o) => o._id !== item._id) } : prev,
      );
    } catch (error) {
      // The server's message is specific on purpose ("Already collected at
      // 19:42"), which is what settles a dispute at the counter.
      setCollectError(errorMessage(error, "Could not mark that collected."));
    } finally {
      setCollectingId(null);
    }
  };

  /** Read-only: look a code up and show what it is, without admitting anyone. */
  const lookup = async (kindHint: "ticket" | "order" | undefined, code: string) => {
    setOutcome(null);
    setCollectError(null);
    setLooking(true);

    const applyFound = (
      kind: "ticket" | "order",
      tickets: CinemaStaffTicket[],
      owed: CinemaOutstandingConcessionItem[],
      isExpired: boolean,
      isTooEarly: boolean,
    ) => {
      setPending({ kind, code, tickets, owed, isExpired, isTooEarly });
      setSelectedSeats(
        isExpired || isTooEarly
          ? new Set()
          : new Set(tickets.filter(eligibleFor).flatMap(outstandingSeatKeys)),
      );
    };

    try {
      if (kindHint === "order") {
        const response = await getCinemaStaffOrder(code);
        applyFound(
          "order",
          response.data,
          response.outstandingConcessions || [],
          response.isExpired,
          response.isTooEarly,
        );
        return;
      }

      try {
        const response = await getCinemaStaffTicket(code);
        applyFound(
          "ticket",
          [response.data],
          response.outstandingConcessions || [],
          response.isExpired,
          response.isTooEarly,
        );
      } catch (ticketError) {
        if (kindHint !== undefined) throw ticketError;
        // A bare typed/scanned code — try it as a ticket first, then as an order.
        try {
          const asOrder = await getCinemaStaffOrder(code);
          applyFound(
            "order",
            asOrder.data,
            asOrder.outstandingConcessions || [],
            asOrder.isExpired,
            asOrder.isTooEarly,
          );
        } catch {
          throw ticketError;
        }
      }
    } catch (error) {
      setOutcome({
        kind: "error",
        title: error instanceof ApiError && error.httpStatus === 404 ? "Not found" : "Network problem",
        detail: errorMessage(error, "Could not reach Pazimo. Check the connection and try again."),
      });
      resetSoon();
    } finally {
      setLooking(false);
    }
  };

  const dismiss = () => {
    setPending(null);
    setSelectedSeats(new Set());
    setCollectError(null);
    busyRef.current = false;
  };

  /** The mutating step — fired only from an explicit "Mark as used" tap. */
  const confirmAdmit = async () => {
    if (!pending) return;
    const eligibleTickets = pending.tickets.filter(eligibleFor);
    const hasNamedSeats = eligibleTickets.some((t) => (t.seats?.length ?? 0) > 0);
    const seatPick = hasNamedSeats ? [...selectedSeats] : undefined;

    setConfirming(true);
    try {
      if (pending.kind === "order") {
        const data = await checkInCinemaOrder(pending.code, seatPick);
        const updatedTickets = data.data?.tickets || [];
        const admittedCount = data.data?.admittedCount ?? pending.tickets.length;
        const stillOut = flattenSeats(updatedTickets).filter((s) => !s.admittedAt).length;
        const first = pending.tickets[0];
        setOutcome({
          kind: "ok",
          title: "Admitted",
          detail:
            hasNamedSeats && stillOut > 0
              ? `${first.movieTitle} · admitted ${admittedCount} seat${admittedCount === 1 ? "" : "s"}${
                  first.hallName ? ` · ${first.hallName}` : ""
                } — ${stillOut} more can come in later on the same order.`
              : `${first.movieTitle} · ${admittedCount} seat${admittedCount === 1 ? "" : "s"}${
                  first.hallName ? ` · ${first.hallName}` : ""
                }`,
          owed: data.outstandingConcessions || [],
        });
      } else {
        const data = await checkInCinemaTicket(pending.code, seatPick);
        const t = data.data;
        const admittedSeats = data.admittedSeats || [];
        const fullyAdmitted = !!data.fullyAdmitted;
        const stillOut = outstandingSeatKeys(t).length;
        setOutcome({
          kind: "ok",
          title: "Admitted",
          detail: fullyAdmitted
            ? `${t.movieTitle} · ${seatLabel(t)}${t.hallName ? ` · ${t.hallName}` : ""}`
            : `${t.movieTitle} · admitted ${admittedSeats.length} seat${admittedSeats.length === 1 ? "" : "s"}${
                t.hallName ? ` · ${t.hallName}` : ""
              } — ${stillOut} more can come in later on the same ticket.`,
          owed: data.outstandingConcessions || [],
        });
      }
    } catch (error) {
      setOutcome({
        kind: "error",
        title: "Not admitted",
        detail: errorMessage(error, "That ticket could not be validated."),
      });
    } finally {
      setConfirming(false);
      setPending(null);
      setSelectedSeats(new Set());
      resetSoon();
    }
  };

  const beginLookup = (raw: string) => {
    if (!raw || busyRef.current || pending) return;

    const { kind, code, wrongKind } = extractCode(raw);
    if (wrongKind) {
      busyRef.current = true;
      setOutcome({
        kind: "error",
        title: "Wrong kind of ticket",
        detail: "That is an event ticket, not a cinema ticket. Cinemas can only admit their own screenings.",
      });
      resetSoon();
      return;
    }
    if (!code) return;

    busyRef.current = true;
    lookup(kind, code);
  };

  const handleScan = ({ data }: { data: string }) => {
    beginLookup(data);
  };

  // What the pending card's action area should say — dynamic to whatever is
  // still eligible, so a re-scan of a partially-admitted order reads
  // correctly rather than repeating "Mark as used" for seats already in.
  // Nothing is eligible once the screening itself has ended, regardless of
  // any individual ticket's own status.
  const outOfWindow = !!pending && (pending.isExpired || pending.isTooEarly);
  const remaining = pending && !outOfWindow ? pending.tickets.filter(eligibleFor) : [];
  const ineligible = pending
    ? outOfWindow
      ? pending.tickets
      : pending.tickets.filter((t) => !eligibleFor(t))
    : [];
  const eligibleSeats = flattenSeats(remaining);
  const showSeatPicker = eligibleSeats.length > 0;
  const outstandingEligibleSeats = eligibleSeats.filter((s) => !s.admittedAt);
  const distinctTicketTypes = new Set(eligibleSeats.map((s) => s.ticketType));

  if (!permission) {
    return <View style={styles.fill} />;
  }

  if (!permission.granted) {
    // See TicketScanner: once the OS stops offering the permission dialog
    // (canAskAgain: false), "Grant access" would silently do nothing.
    return (
      <SafeAreaView style={styles.permissionSafeArea}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={40} color={colors.ink} />
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionBody}>
            {permission.canAskAgain
              ? "Pazimo needs your camera to scan ticket, order and pickup codes at the counter."
              : "Camera access was denied. Enable it for Pazimo in your device Settings to scan codes."}
          </Text>
          {permission.canAskAgain ? (
            <ScannerButton label="Grant access" onPress={requestPermission} />
          ) : (
            <ScannerButton label="Open Settings" onPress={() => Linking.openSettings()} />
          )}
          {onBack ? (
            <Text style={styles.back} onPress={onBack} accessibilityRole="link">
              ‹ Back
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fill}>
      {isFocused ? (
        <CameraView
          style={styles.fill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr", "code128"] }}
          onBarcodeScanned={!pending && !looking ? handleScan : undefined}
        />
      ) : (
        <View style={styles.fill} />
      )}

      <View style={styles.overlay} pointerEvents="box-none">
      <SafeAreaView
        style={[styles.overlayInner, tabBarHeight > 0 && { paddingBottom: 20 + tabBarHeight }]}
        pointerEvents="box-none"
      >
        <LinearGradient colors={CHROME_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Cinema admission
          </Text>
        </LinearGradient>

        {!pending && !outcome ? <View style={styles.frame} pointerEvents="none" /> : null}

        <View style={styles.bottomStack}>
          {pending ? (
            <PendingCard
              pending={pending}
              remaining={remaining}
              ineligible={ineligible}
              showSeatPicker={showSeatPicker}
              eligibleSeats={eligibleSeats}
              outstandingEligibleSeats={outstandingEligibleSeats}
              distinctTicketTypes={distinctTicketTypes}
              selectedSeats={selectedSeats}
              onToggleSeat={(key) =>
                setSelectedSeats((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
              confirming={confirming}
              onConfirm={confirmAdmit}
              onCancel={dismiss}
              collectingId={collectingId}
              collectError={collectError}
              onCollect={collect}
            />
          ) : outcome ? (
            <OutcomeCard state={outcome} onScanNext={() => setOutcome(null)} collectingId={collectingId} collectError={collectError} onCollect={collect} />
          ) : (
            <HintBubble>{looking ? "Checking code…" : "Point the camera at a ticket or order code"}</HintBubble>
          )}
        </View>
      </SafeAreaView>
      </View>
    </View>
  );
}

function HintBubble({ children }: { children: string }) {
  return (
    <View style={styles.hint}>
      <LinearGradient colors={CHROME_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hintBubble}>
        <Text style={styles.hintText}>{children}</Text>
      </LinearGradient>
    </View>
  );
}

function ScannerButton({
  label,
  onPress,
  loading,
  muted,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  muted?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.scannerButton, muted && styles.scannerButtonMuted, pressed && { opacity: 0.85 }]}
    >
      {loading ? (
        <ActivityIndicator color={muted ? colors.ink : colors.background} />
      ) : (
        <Text style={[styles.scannerButtonText, muted && styles.scannerButtonTextMuted]}>{label}</Text>
      )}
    </Pressable>
  );
}

/** The amber "paid for, not collected" block — shared between the pending
 * (pre-confirm) and outcome (post-confirm) cards, since a customer may
 * collect a drink while staff are still confirming their identity. */
function OwedList({
  items,
  collectingId,
  collectError,
  onCollect,
}: {
  items: CinemaOutstandingConcessionItem[];
  collectingId: string | null;
  collectError: string | null;
  onCollect: (item: CinemaOutstandingConcessionItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.owedBox}>
      <View style={styles.owedHeader}>
        <MaterialCommunityIcons name="popcorn" size={14} color={colors.warning} />
        <Text style={styles.owedHeaderText}>Paid for, not collected</Text>
      </View>
      <View style={{ gap: 8 }}>
        {items.map((item) => (
          <View key={item._id} style={styles.owedRow}>
            <Text style={styles.owedItemText} numberOfLines={1}>
              {item.quantity} × {item.beverageName}
            </Text>
            <Pressable
              onPress={() => onCollect(item)}
              disabled={collectingId === item._id}
              style={styles.owedButton}
            >
              {collectingId === item._id ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.owedButtonText}>Handed over</Text>
              )}
            </Pressable>
          </View>
        ))}
      </View>
      {collectError ? <Text style={styles.owedError}>{collectError}</Text> : null}
    </View>
  );
}

function PendingCard({
  pending,
  remaining,
  ineligible,
  showSeatPicker,
  eligibleSeats,
  outstandingEligibleSeats,
  distinctTicketTypes,
  selectedSeats,
  onToggleSeat,
  confirming,
  onConfirm,
  onCancel,
  collectingId,
  collectError,
  onCollect,
}: {
  pending: NonNullable<Pending>;
  remaining: CinemaStaffTicket[];
  ineligible: CinemaStaffTicket[];
  showSeatPicker: boolean;
  eligibleSeats: FlatSeat[];
  outstandingEligibleSeats: FlatSeat[];
  distinctTicketTypes: Set<string>;
  selectedSeats: Set<string>;
  onToggleSeat: (key: string) => void;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  collectingId: string | null;
  collectError: string | null;
  onCollect: (item: CinemaOutstandingConcessionItem) => void;
}) {
  const first = pending.tickets[0];
  const totalSeats =
    pending.kind === "order"
      ? pending.tickets.reduce((sum, t) => sum + (t.seats?.length || t.quantity), 0)
      : undefined;
  const showtime = formatShowtime(first.showtime?.startsAt);

  return (
    <View style={styles.card}>
      <ScrollView style={styles.cardScroll} contentContainerStyle={{ gap: 2 }}>
        <Text style={styles.cardTitle}>{first.movieTitle}</Text>
        <Text style={styles.cardSubtitle}>
          {first.hallName || "—"}
          {showtime ? ` · ${showtime}` : ""}
          {totalSeats !== undefined ? ` · ${totalSeats} seat${totalSeats === 1 ? "" : "s"}` : ""}
        </Text>

        {pending.isExpired ? (
          <View style={styles.expiredBanner}>
            <Ionicons name="time-outline" size={14} color={colors.error} />
            <Text style={styles.expiredBannerText}>This screening has already ended</Text>
          </View>
        ) : pending.isTooEarly ? (
          <View style={styles.tooEarlyBanner}>
            <Ionicons name="hourglass-outline" size={14} color={colors.warning} />
            <Text style={styles.tooEarlyBannerText}>Too early — doors aren&apos;t open yet</Text>
          </View>
        ) : (
          <View style={styles.nowPlayingBanner}>
            <Ionicons name="play-circle-outline" size={14} color={colors.success} />
            <Text style={styles.nowPlayingBannerText}>Now playing</Text>
          </View>
        )}

        <View style={{ marginTop: 12, gap: 6 }}>
          {showSeatPicker &&
            eligibleSeats.map((s) => {
              const admitted = !!s.admittedAt;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => !admitted && onToggleSeat(s.key)}
                  disabled={admitted}
                  style={styles.seatRow}
                >
                  <View style={styles.seatLabelRow}>
                    <MaterialCommunityIcons name="seat-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.seatLabelText}>
                      Row {s.row} · Seat {s.number}
                      {distinctTicketTypes.size > 1 ? ` · ${s.categoryLabel || s.ticketType}` : ""}
                    </Text>
                  </View>
                  {admitted ? (
                    <Text style={styles.seatAdmittedText}>Already admitted</Text>
                  ) : (
                    <Ionicons
                      name={selectedSeats.has(s.key) ? "checkbox" : "square-outline"}
                      size={20}
                      color={selectedSeats.has(s.key) ? colors.success : colors.textMuted}
                    />
                  )}
                </Pressable>
              );
            })}

          {(showSeatPicker ? ineligible : pending.tickets).map((t) => (
            <View key={t.ticketId} style={styles.seatRow}>
              <View style={styles.seatLabelRow}>
                <MaterialCommunityIcons name="seat-outline" size={15} color={colors.textMuted} />
                <Text style={styles.seatLabelText}>{seatLabel(t)}</Text>
              </View>
              {t.checkedIn ? (
                <Text style={styles.seatAdmittedText}>Already admitted</Text>
              ) : ["cancelled", "refunded"].includes(t.status) ? (
                <Text style={[styles.seatAdmittedText, { color: colors.error }]}>{t.status}</Text>
              ) : t.paymentStatus !== "completed" ? (
                <Text style={[styles.seatAdmittedText, { color: colors.warning }]}>Not paid</Text>
              ) : pending.isExpired ? (
                <Text style={[styles.seatAdmittedText, { color: colors.error }]}>Expired</Text>
              ) : pending.isTooEarly ? (
                <Text style={[styles.seatAdmittedText, { color: colors.warning }]}>Too early</Text>
              ) : null}
            </View>
          ))}
        </View>

        <OwedList items={pending.owed} collectingId={collectingId} collectError={collectError} onCollect={onCollect} />
      </ScrollView>

      <View style={styles.cardActions}>
        <ScannerButton label="Cancel" onPress={onCancel} muted loading={confirming} />
        {showSeatPicker ? (
          selectedSeats.size > 0 ? (
            <ScannerButton
              label={
                selectedSeats.size === outstandingEligibleSeats.length
                  ? "Mark as used"
                  : `Admit ${selectedSeats.size} seat${selectedSeats.size === 1 ? "" : "s"}`
              }
              onPress={onConfirm}
              loading={confirming}
            />
          ) : (
            <View style={styles.actionPlaceholder}>
              <Text style={styles.actionPlaceholderText}>Select at least one seat</Text>
            </View>
          )
        ) : remaining.length > 0 ? (
          <ScannerButton
            label={remaining.length === pending.tickets.length ? "Mark as used" : `Mark ${remaining.length} remaining as used`}
            onPress={onConfirm}
            loading={confirming}
          />
        ) : (
          <View style={styles.actionPlaceholder}>
            <Text style={styles.actionPlaceholderText}>
              {pending.tickets.every((t) => t.checkedIn)
                ? "Already admitted"
                : pending.isExpired
                  ? "This screening has ended"
                  : pending.isTooEarly
                    ? "Too early — doors aren't open yet"
                    : "Nothing here can be admitted"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function OutcomeCard({
  state,
  onScanNext,
  collectingId,
  collectError,
  onCollect,
}: {
  state: NonNullable<Outcome>;
  onScanNext: () => void;
  collectingId: string | null;
  collectError: string | null;
  onCollect: (item: CinemaOutstandingConcessionItem) => void;
}) {
  const owed = state.owed ?? [];
  return (
    <View style={[styles.outcomeCard, state.kind === "ok" ? styles.outcomeOk : styles.outcomeError]}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <Ionicons
          name={state.kind === "ok" ? "checkmark-circle" : "close-circle"}
          size={24}
          color={state.kind === "ok" ? colors.success : colors.error}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.outcomeTitle}>{state.title}</Text>
          <Text style={styles.outcomeDetail}>{state.detail}</Text>

          {state.kind === "ok" ? (
            owed.length > 0 ? (
              <OwedList items={owed} collectingId={collectingId} collectError={collectError} onCollect={onCollect} />
            ) : (
              <Text style={styles.outcomeNothing}>Nothing to collect.</Text>
            )
          ) : null}
        </View>
      </View>

      <ScannerButton label="Scan next" onPress={onScanNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayInner: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CHROME_BORDER,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: CHROME_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  frame: {
    alignSelf: "center",
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
  },
  bottomStack: {
    gap: 10,
  },
  hint: {
    alignItems: "center",
    paddingBottom: 4,
  },
  hintBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CHROME_BORDER,
  },
  hintText: {
    color: colors.ink,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    maxHeight: 420,
  },
  cardScroll: {
    flexGrow: 0,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.ink,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  expiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 100, 103, 0.35)",
    backgroundColor: "rgba(255, 100, 103, 0.12)",
  },
  expiredBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.error,
  },
  tooEarlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(252, 158, 71, 0.35)",
    backgroundColor: "rgba(252, 158, 71, 0.12)",
  },
  tooEarlyBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning,
  },
  nowPlayingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(63, 177, 113, 0.35)",
    backgroundColor: "rgba(63, 177, 113, 0.12)",
  },
  nowPlayingBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  seatLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  seatLabelText: {
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  seatAdmittedText: {
    fontSize: 12,
    color: colors.success,
  },
  owedBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(252, 158, 71, 0.35)",
    backgroundColor: "rgba(252, 158, 71, 0.08)",
    padding: 12,
  },
  owedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  owedHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.warning,
  },
  owedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  owedItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
  },
  owedButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.warning,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  owedButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
  },
  owedError: {
    marginTop: 8,
    fontSize: 12,
    color: colors.error,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  actionPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPlaceholderText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  outcomeCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  outcomeOk: {
    backgroundColor: "rgba(63, 177, 113, 0.14)",
    borderColor: "rgba(63, 177, 113, 0.35)",
  },
  outcomeError: {
    backgroundColor: "rgba(255, 100, 103, 0.14)",
    borderColor: "rgba(255, 100, 103, 0.35)",
  },
  outcomeTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  outcomeDetail: {
    fontSize: 13,
    color: colors.textMuted,
  },
  outcomeNothing: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  scannerButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  scannerButtonMuted: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: CHROME_BORDER,
  },
  scannerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  scannerButtonTextMuted: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  permissionSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
  },
  permissionBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
  back: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 16,
  },
});
