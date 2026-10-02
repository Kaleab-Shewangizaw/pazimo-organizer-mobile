import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import { cardShadow, isDarkTheme, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

/**
 * Instagram-style loading placeholders: grey shapes laid out like the
 * content that's about to arrive, gently pulsing, instead of a centred
 * spinner on a blank page. The screen keeps its shape when data lands, so
 * loading reads as "filling in" rather than "nothing, then everything".
 *
 * Every Bone shares one module-level pulse so they breathe in unison (and
 * there's one native-driven animation running, not one per shape). It
 * starts with the first mounted Bone, stops with the last, and is skipped
 * entirely when the OS "reduce motion" setting is on.
 */
const pulse = new Animated.Value(0);
let pulseUsers = 0;
let pulseLoop: Animated.CompositeAnimation | null = null;

function usePulse() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReduceMotion(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    pulseUsers += 1;
    if (pulseUsers === 1) {
      const half = { duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true };
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, ...half }),
          Animated.timing(pulse, { toValue: 0, ...half }),
        ]),
      );
      pulseLoop.start();
    }
    return () => {
      pulseUsers -= 1;
      if (pulseUsers === 0) {
        pulseLoop?.stop();
        pulseLoop = null;
        pulse.setValue(0);
      }
    };
  }, [reduceMotion]);

  return reduceMotion ? null : pulse;
}

const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });

/** A bone's fill — a step stronger than surfaceAlt so it still shows on a white card. */
function boneColor(colors: ThemeColors) {
  return isDarkTheme(colors) ? "#262626" : "#E8E6E1";
}

interface BoneProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** One placeholder shape. */
export function Bone({ width = "100%", height, radius = 8, style }: BoneProps) {
  const colors = useColors();
  const animated = usePulse();
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: boneColor(colors) },
        animated ? { opacity: pulseOpacity } : null,
        style,
      ]}
    />
  );
}

/** A white (light) / raised (dark) card, matching the app's real cards. */
export function SkeletonCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Mirrors HeroCard: eyebrow, big figure, two footer figures. */
export function SkeletonHero() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SkeletonCard style={styles.hero}>
      <Bone width={110} height={12} />
      <Bone width="60%" height={36} radius={10} style={styles.mt10} />
      <View style={styles.heroFooter}>
        <View style={styles.heroFooterItem}>
          <Bone width="70%" height={16} />
          <Bone width="50%" height={11} />
        </View>
        <View style={styles.heroFooterItem}>
          <Bone width="70%" height={16} />
          <Bone width="50%" height={11} />
        </View>
      </View>
    </SkeletonCard>
  );
}

/** Mirrors a row of StatTiles. */
export function SkeletonStatRow({ count = 2 }: { count?: number }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row12}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} style={styles.statTile}>
          <Bone width="55%" height={20} />
          <Bone width="40%" height={11} />
        </SkeletonCard>
      ))}
    </View>
  );
}

const CHIP_WIDTHS = [76, 128, 104, 118, 92];

/** Mirrors a horizontal Chip filter row. */
export function SkeletonChips() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.chips}>
      {CHIP_WIDTHS.map((w, i) => (
        <Bone key={i} width={w} height={36} radius={999} />
      ))}
    </View>
  );
}

/** Mirrors ListRow: two lines on the left, amount + status on the right. */
export function SkeletonListRow({ last = false }: { last?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.listRow, last && styles.noBorder]}>
      <View style={styles.listRowLeft}>
        <Bone width="62%" height={14} />
        <Bone width="42%" height={11} />
      </View>
      <View style={styles.listRowRight}>
        <Bone width={64} height={14} />
        <Bone width={40} height={11} />
      </View>
    </View>
  );
}

/** A card of ListRows, like the sales/catalog lists. */
export function SkeletonList({ rows = 6 }: { rows?: number }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SkeletonCard style={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonListRow key={i} last={i === rows - 1} />
      ))}
    </SkeletonCard>
  );
}

/** A titled card of thumbnail + label + progress rows (revenue-by-event, drinks, tiers). */
export function SkeletonProgressCard({
  rows = 4,
  thumb = true,
  title = true,
}: {
  rows?: number;
  thumb?: boolean;
  title?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SkeletonCard style={styles.paddedCard}>
      {title ? <Bone width={140} height={16} /> : null}
      <View style={styles.progressList}>
        {Array.from({ length: rows }, (_, i) => (
          <View key={i} style={styles.progressRow}>
            {thumb ? <Bone width={40} height={40} radius={10} /> : null}
            <View style={styles.flexGap8}>
              <View style={styles.spaceBetween}>
                <Bone width="45%" height={13} />
                <Bone width="22%" height={13} />
              </View>
              <Bone height={6} radius={3} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonCard>
  );
}

/**
 * Mirrors EventCoverCard: the cover photo, then either EventCard's
 * sold/checked-in/revenue strip or a custom `footer`.
 */
export function SkeletonEventCard({
  coverHeight = 200,
  footer,
}: {
  coverHeight?: number;
  footer?: ReactNode;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SkeletonCard style={styles.eventCard}>
      <Bone height={coverHeight} radius={0} />
      {footer ?? (
        <View style={styles.metrics}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.metric}>
              <Bone width={48} height={15} />
              <Bone width={64} height={11} />
            </View>
          ))}
        </View>
      )}
    </SkeletonCard>
  );
}

/** A card of thumbnail + two-line rows with a chevron (event pickers, drink pickers). */
export function SkeletonThumbList({ rows = 4 }: { rows?: number }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SkeletonCard style={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.listRow, i === rows - 1 && styles.noBorder]}>
          <Bone width={48} height={48} radius={12} />
          <View style={styles.listRowLeft}>
            <Bone width="65%" height={14} />
            <Bone width="45%" height={11} />
          </View>
          <Bone width={10} height={16} radius={3} />
        </View>
      ))}
    </SkeletonCard>
  );
}

/** A settings-style card of label/description rows with a trailing control. */
export function SkeletonSettingsCard({ rows = 4 }: { rows?: number }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SkeletonCard style={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.listRow, i === rows - 1 && styles.noBorder]}>
          <View style={styles.listRowLeft}>
            <Bone width="50%" height={14} />
            <Bone width="80%" height={11} />
          </View>
          <Bone width={48} height={28} radius={999} />
        </View>
      ))}
    </SkeletonCard>
  );
}

/** A screen-level heading placeholder, for screens whose title is data-driven. */
export function SkeletonHeading({ width = "55%" }: { width?: DimensionValue }) {
  return <Bone width={width} height={24} radius={8} />;
}

/**
 * A screen's own static title ("Tickets", "Bar") — real text, not a bone:
 * it's known before any data arrives, so there's no reason to hide it.
 */
export function SkeletonPageTitle({ children }: { children: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.pageTitle}>{children}</Text>;
}

/** A small uppercase section label (e.g. "Box office"). */
export function SkeletonEyebrow() {
  return <Bone width={90} height={11} radius={4} />;
}

interface SkeletonScreenProps {
  children: ReactNode;
  /**
   * Render a real top bar with this title and a working back button —
   * for pushed screens, so the user can still leave while it loads.
   */
  title?: string;
  backHref?: Href;
  /** Pad the bottom clear of the floating tab bar (tab screens). */
  tabBar?: boolean;
  /**
   * Skip the SafeAreaView + top bar — for screens that already render
   * their own chrome and only need the content area filled.
   */
  bare?: boolean;
}

/**
 * Screen chrome for a skeleton: the same background, safe area, padding,
 * and (optionally) top bar as the real screen it stands in for. Not
 * scrollable or interactive beyond the back button — nothing to act on yet.
 */
export function SkeletonScreen({ children, title, backHref, tabBar, bare }: SkeletonScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();

  const content = (
    <ScrollView
      scrollEnabled={false}
      contentContainerStyle={[styles.content, tabBar && { paddingBottom: tabBarHeight + 24 }]}
      accessible
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
    >
      {children}
    </ScrollView>
  );

  if (bare) return content;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {title !== undefined ? (
        <View style={styles.topBar}>
          {backHref ? (
            <Pressable onPress={() => goBack(backHref)} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}
      {content}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarTitle: {
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
      flexShrink: 1,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    pageTitle: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      boxShadow: cardShadow(colors),
    },
    paddedCard: {
      padding: 20,
      gap: 18,
    },
    hero: {
      borderRadius: 24,
      padding: 20,
    },
    heroFooter: {
      flexDirection: "row",
      gap: 20,
      marginTop: 26,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    heroFooterItem: {
      flex: 1,
      gap: 6,
    },
    mt10: {
      marginTop: 10,
    },
    row12: {
      flexDirection: "row",
      gap: 12,
    },
    statTile: {
      flex: 1,
      borderRadius: 14,
      padding: 14,
      gap: 8,
    },
    chips: {
      flexDirection: "row",
      gap: 8,
      overflow: "hidden",
    },
    list: {
      borderRadius: 14,
      paddingHorizontal: 14,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    noBorder: {
      borderBottomWidth: 0,
    },
    listRowLeft: {
      flex: 1,
      gap: 7,
    },
    listRowRight: {
      alignItems: "flex-end",
      gap: 7,
    },
    progressList: {
      gap: 16,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    flexGap8: {
      flex: 1,
      gap: 8,
    },
    spaceBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    eventCard: {
      borderRadius: 16,
      overflow: "hidden",
    },
    metrics: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
    },
    metric: {
      gap: 6,
    },
  });
