import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOutstandingVenueOrder, redeemVenueSale } from "@/api/venue";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { darkColors } from "@/lib/theme";
import type { VenueOutstandingItem } from "@/types";

/**
 * A venue sells only drinks — no seats, no ticket types — so unlike
 * CinemaScanner there is one kind of code (the bare payment reference) and
 * one kind of item, no picker. A venue's pickup code is a plain CODE128
 * barcode over that reference (see backend/src/utils/barcodeRenderer.js),
 * not a JSON QR payload, so whatever the scanner decodes IS the reference to
 * look up, with no parsing step.
 *
 * Mirrors the already-shipped web dashboard's
 * components/venue/venue-scanner.tsx exactly — same two endpoints, same
 * lookup-then-hand-over shape.
 */
type Pending = { reference: string; items: VenueOutstandingItem[] } | null;
type Outcome = { kind: "ok" | "error" | "empty"; title: string; detail: string } | null;

const colors = darkColors;
const CHROME_GRADIENT = ["#242424", "#050505"] as const;
const CHROME_BORDER = "#404040";

function errorMessage(error: unknown, fallback: string): string {
  return bannerMessageFor(error) ?? fallback;
}

/**
 * Camera-driven barcode/QR scanner for a venue's counter — look an order up
 * by its pickup code, then hand its drinks over one at a time. The camera
 * only mounts while this screen is actually focused, matching
 * CinemaScanner/TicketScanner: only one CameraView may be active at a time,
 * and a tab screen stays mounted (just unfocused) when staff switch tabs.
 */
export function VenueScanner({ venueId, onBack }: { venueId: string; onBack?: () => void }) {
  const isFocused = useIsFocused();
  const tabBarHeight = useTabBarHeight();
  const [permission, requestPermission] = useCameraPermissions();

  const [pending, setPending] = useState<Pending>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [looking, setLooking] = useState(false);
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

  const lookup = async (reference: string) => {
    setOutcome(null);
    setCollectError(null);
    setLooking(true);
    try {
      const response = await getOutstandingVenueOrder(venueId, reference);
      const items = response.data || [];
      if (items.length === 0) {
        setOutcome({
          kind: "empty",
          title: "Nothing outstanding",
          detail: `No unclaimed drinks on "${reference}".`,
        });
        resetSoon();
        return;
      }
      setPending({ reference, items });
    } catch (error) {
      setOutcome({
        kind: "error",
        title: "Not found",
        detail: errorMessage(error, "That order could not be found."),
      });
      resetSoon();
    } finally {
      setLooking(false);
    }
  };

  const beginLookup = (raw: string) => {
    const reference = raw.trim();
    if (!reference || busyRef.current || pending) return;
    busyRef.current = true;
    lookup(reference);
  };

  const handleScan = ({ data }: { data: string }) => {
    beginLookup(data);
  };

  const dismiss = () => {
    setPending(null);
    setCollectError(null);
    busyRef.current = false;
  };

  /** Hand one pre-bought drink over. */
  const collect = async (item: VenueOutstandingItem) => {
    setCollectingId(item._id);
    setCollectError(null);
    try {
      await redeemVenueSale(venueId, item._id);
      setPending((prev) => {
        if (!prev) return prev;
        const remaining = prev.items.filter((i) => i._id !== item._id);
        if (remaining.length === 0) {
          setOutcome({
            kind: "ok",
            title: "All handed over",
            detail: `Everything on "${prev.reference}" has been collected.`,
          });
          busyRef.current = false;
          resetSoon();
          return null;
        }
        return { ...prev, items: remaining };
      });
    } catch (error) {
      // The server's message is specific on purpose ("Already collected at
      // 19:42"), which is what settles a dispute at the counter.
      setCollectError(errorMessage(error, "Could not mark that collected."));
    } finally {
      setCollectingId(null);
    }
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
            Pazimo needs your camera to scan pickup codes at the counter.
          </Text>
          <ScannerButton label="Grant access" onPress={requestPermission} />
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
              Bar counter
            </Text>
          </LinearGradient>

          {!pending && !outcome ? <View style={styles.frame} pointerEvents="none" /> : null}

          <View style={styles.bottomStack}>
            {pending ? (
              <PendingCard
                pending={pending}
                collectingId={collectingId}
                collectError={collectError}
                onCollect={collect}
                onCancel={dismiss}
              />
            ) : outcome ? (
              <OutcomeCard state={outcome} onScanNext={() => setOutcome(null)} />
            ) : (
              <HintBubble>{looking ? "Checking code…" : "Point the camera at a pickup code"}</HintBubble>
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

function PendingCard({
  pending,
  collectingId,
  collectError,
  onCollect,
  onCancel,
}: {
  pending: NonNullable<Pending>;
  collectingId: string | null;
  collectError: string | null;
  onCollect: (item: VenueOutstandingItem) => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.card}>
      <ScrollView style={styles.cardScroll} contentContainerStyle={{ gap: 2 }}>
        <Text style={styles.cardTitle}>Order {pending.reference}</Text>
        <Text style={styles.cardSubtitle}>
          {pending.items.length} item{pending.items.length === 1 ? "" : "s"} still owed
        </Text>

        <View style={{ marginTop: 12, gap: 8 }}>
          {pending.items.map((item) => (
            <View key={item._id} style={styles.itemRow}>
              <View style={styles.itemLabelRow}>
                <MaterialCommunityIcons name="glass-cocktail" size={15} color={colors.textMuted} />
                <Text style={styles.itemLabelText} numberOfLines={1}>
                  {item.quantity} × {item.beverageName}
                </Text>
              </View>
              <Pressable
                onPress={() => onCollect(item)}
                disabled={collectingId === item._id}
                style={styles.owedButton}
              >
                {collectingId === item._id ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.owedButtonText}>Handed over</Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>

        {collectError ? <Text style={styles.owedError}>{collectError}</Text> : null}
      </ScrollView>

      <View style={styles.cardActions}>
        <ScannerButton label="Close" onPress={onCancel} muted />
      </View>
    </View>
  );
}

function OutcomeCard({ state, onScanNext }: { state: NonNullable<Outcome>; onScanNext: () => void }) {
  const icon = state.kind === "ok" ? "checkmark-circle" : state.kind === "empty" ? "information-circle" : "close-circle";
  const iconColor = state.kind === "ok" ? colors.success : state.kind === "empty" ? colors.warning : colors.error;
  return (
    <View
      style={[
        styles.outcomeCard,
        state.kind === "ok" ? styles.outcomeOk : state.kind === "empty" ? styles.outcomeEmpty : styles.outcomeError,
      ]}
    >
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.outcomeTitle}>{state.title}</Text>
          <Text style={styles.outcomeDetail}>{state.detail}</Text>
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  itemLabelText: {
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  owedButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.warning,
    minWidth: 100,
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
  outcomeEmpty: {
    backgroundColor: "rgba(252, 158, 71, 0.14)",
    borderColor: "rgba(252, 158, 71, 0.35)",
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
