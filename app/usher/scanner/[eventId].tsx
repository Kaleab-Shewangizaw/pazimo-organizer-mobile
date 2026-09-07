import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { checkInTicket, validateTicketQr } from "@/api/tickets";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { darkColors } from "@/lib/theme";
import type { ScannedTicketInfo } from "@/types";

/**
 * Three stages per scan:
 *  1. "scanning" — camera live, waiting for a QR code.
 *  2. "reviewing" — validate-qr came back (read-only: it does NOT check the
 *     ticket in). Shows who it belongs to, which event, and how many people
 *     it admits, and lets the usher choose how many to admit right now
 *     before anything is committed.
 *  3. "result" — the outcome of actually calling checkInTicket: success,
 *     already fully used, or an error. Always ends in a "Scan next" tap
 *     back to "scanning".
 */
type ScanState =
  | { stage: "scanning" }
  | { stage: "reviewing"; ticket: ScannedTicketInfo }
  | {
      stage: "result";
      kind: "success" | "already" | "mismatch" | "error";
      title: string;
      subtitle?: string;
    };

// This screen is deliberately always dark, regardless of the app's own
// light/dark setting — a camera viewfinder with a bright white chrome is
// both harder to read outdoors/at a dim door and needlessly harsh at
// night, which is when this screen actually gets used. `darkColors` is
// used directly (not the `useColors()` hook) so it never follows whatever
// theme the rest of the app is in.
const colors = darkColors;

// The backend reports a scanned ticket belonging to a different event than
// this scanner session in a couple of different wordings, depending on
// which check catches it first (missing UsherEventAccess vs. an explicit
// scopeEventId mismatch — see validateQRCode/checkInTicket). To the person
// holding the scanner, both mean the same thing: this ticket isn't for the
// event they're checking people into — so they're normalized to one clear
// message here rather than surfacing either backend wording verbatim.
const WRONG_EVENT_MESSAGES = [
  "you don't have access to scan tickets for this event",
  "you don't have access to check in tickets for this event",
  "this ticket does not belong to the selected event",
];

/** Classifies a scan/check-in error: a wrong-event mismatch reads as a
 * heads-up (amber) — an expected thing to happen at a door with several
 * events running — everything else stays a hard error (red). */
function classifyScanError(error: unknown): { kind: "mismatch" | "error"; title: string } {
  const message = bannerMessageFor(error) ?? "Something went wrong. Please try again.";
  const normalized = message.trim().toLowerCase();
  if (WRONG_EVENT_MESSAGES.some((known) => normalized.includes(known))) {
    return { kind: "mismatch", title: "Wrong ticket for this event" };
  }
  return { kind: "error", title: message };
}

/**
 * Camera-driven QR scanner for one event. Ticket QR codes are a bare
 * ticketId string (no JSON envelope) — validate-qr is given that raw
 * scanned string plus this screen's eventId as `scopeEventId`, and the
 * backend checks the usher's UsherEventAccess grant against the ticket's
 * real event, never against whatever this screen claims.
 */
export default function ScannerScreen() {
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ stage: "scanning" });
  const [count, setCount] = useState(1);

  const validateMutation = useMutation({
    mutationFn: (qrData: string) => validateTicketQr(qrData, eventId),
    onSuccess: (response) => {
      if (response.alreadyCheckedIn) {
        setState({
          stage: "result",
          kind: "already",
          title: "Already checked in",
          subtitle: response.data.userName,
        });
        return;
      }
      setCount(Math.max(1, response.data.ticketCount || 1));
      setState({ stage: "reviewing", ticket: response.data });
    },
    onError: (error) => {
      setState({ stage: "result", ...classifyScanError(error) });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: ({ ticket, count }: { ticket: ScannedTicketInfo; count: number }) =>
      checkInTicket(ticket.ticketId, count, eventId),
    onSuccess: (response) => {
      if (response.alreadyCheckedIn) {
        setState({ stage: "result", kind: "already", title: "Already checked in" });
        return;
      }
      setState({
        stage: "result",
        kind: "success",
        title: response.data.fullyUsed ? "Checked in" : "Admission recorded",
        subtitle:
          response.data.remainingUses > 0
            ? `${response.data.remainingUses} admission${response.data.remainingUses === 1 ? "" : "s"} left on this ticket`
            : undefined,
      });
    },
    onError: (error) => {
      setState({ stage: "result", ...classifyScanError(error) });
    },
  });

  const handleScan = ({ data }: { data: string }) => {
    if (state.stage !== "scanning") return;
    validateMutation.mutate(data);
  };

  const scanNext = () => {
    setState({ stage: "scanning" });
    setCount(1);
  };

  if (!permission) {
    return <View style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionSafeArea}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={40} color={colors.ink} />
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionBody}>
            Pazimo needs your camera to scan ticket QR codes at the door.
          </Text>
          <ScannerButton label="Grant access" onPress={requestPermission} />
          <Text style={styles.back} onPress={() => router.back()} accessibilityRole="link">
            ‹ Back
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={styles.fill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={state.stage === "scanning" ? handleScan : undefined}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {title ?? "Scan tickets"}
          </Text>
        </View>

        <View style={styles.frame} pointerEvents="none" />

        {state.stage === "reviewing" ? (
          <ReviewCard
            ticket={state.ticket}
            count={count}
            onChangeCount={setCount}
            loading={checkInMutation.isPending}
            onConfirm={() => checkInMutation.mutate({ ticket: state.ticket, count })}
            onCancel={scanNext}
          />
        ) : state.stage === "result" ? (
          <ResultCard state={state} onScanNext={scanNext} />
        ) : validateMutation.isPending ? (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Checking ticket…</Text>
          </View>
        ) : (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Point the camera at a ticket's QR code</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

/** A button styled with this screen's always-dark palette, not the app's theme. */
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
      style={({ pressed }) => [
        styles.scannerButton,
        muted && styles.scannerButtonMuted,
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={muted ? colors.ink : colors.background} />
      ) : (
        <Text style={[styles.scannerButtonText, muted && styles.scannerButtonTextMuted]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function ReviewCard({
  ticket,
  count,
  onChangeCount,
  loading,
  onConfirm,
  onCancel,
}: {
  ticket: ScannedTicketInfo;
  count: number;
  onChangeCount: (n: number) => void;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const maxCount = Math.max(1, ticket.ticketCount || 1);

  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewName}>{ticket.userName}</Text>
      <Text style={styles.reviewMeta}>
        {ticket.eventTitle}
        {ticket.ticketType ? ` · ${ticket.ticketType}` : ""}
      </Text>
      <Text style={styles.reviewAdmits}>Admits up to {maxCount}</Text>

      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => onChangeCount(Math.max(1, count - 1))}
          disabled={count <= 1}
          style={[styles.stepperButton, count <= 1 && styles.stepperButtonDisabled]}
        >
          <Ionicons name="remove" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.stepperValue}>{count}</Text>
        <Pressable
          onPress={() => onChangeCount(Math.min(maxCount, count + 1))}
          disabled={count >= maxCount}
          style={[styles.stepperButton, count >= maxCount && styles.stepperButtonDisabled]}
        >
          <Ionicons name="add" size={20} color={colors.ink} />
        </Pressable>
      </View>
      <Text style={styles.stepperLabel}>admitting now</Text>

      <ScannerButton label={`Check in ${count}`} onPress={onConfirm} loading={loading} />
      <ScannerButton label="Cancel" onPress={onCancel} muted />
    </View>
  );
}

function ResultCard({
  state,
  onScanNext,
}: {
  state: Extract<ScanState, { stage: "result" }>;
  onScanNext: () => void;
}) {
  const palette =
    state.kind === "success"
      ? styles.resultSuccess
      : state.kind === "already"
        ? styles.resultWarning
        : state.kind === "mismatch"
          ? styles.resultMismatch
          : styles.resultError;
  const icon =
    state.kind === "success"
      ? "checkmark-circle"
      : state.kind === "already"
        ? "alert-circle"
        : state.kind === "mismatch"
          ? "swap-horizontal"
          : "close-circle";

  return (
    <View style={[styles.resultCard, palette]}>
      <Ionicons name={icon} size={28} color={colors.background} />
      <Text style={styles.resultTitle}>{state.title}</Text>
      {state.subtitle ? <Text style={styles.resultSubtitle}>{state.subtitle}</Text> : null}
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
    justifyContent: "space-between",
    padding: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
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
  hint: {
    alignItems: "center",
    paddingBottom: 12,
  },
  hintText: {
    color: colors.ink,
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  reviewName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: "center",
  },
  reviewMeta: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  reviewAdmits: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 10,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.accent,
    minWidth: 44,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  stepperLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  resultCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  resultSuccess: {
    backgroundColor: colors.success,
  },
  resultWarning: {
    backgroundColor: colors.warning,
  },
  // Distinct from resultWarning ("already checked in") and resultError (a
  // real failure) — a wrong-event scan is neither, it's just a heads-up
  // that this ticket belongs elsewhere, so it gets its own color.
  resultMismatch: {
    backgroundColor: "#818CF8",
  },
  resultError: {
    backgroundColor: colors.error,
  },
  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.background,
    textAlign: "center",
  },
  resultSubtitle: {
    fontSize: 14,
    color: "rgba(10, 10, 11, 0.75)",
    textAlign: "center",
  },
  scannerButton: {
    marginTop: 10,
    alignSelf: "stretch",
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  scannerButtonMuted: {
    backgroundColor: "transparent",
  },
  scannerButtonText: {
    fontSize: 16,
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
