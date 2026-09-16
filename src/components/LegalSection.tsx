import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface LegalSectionProps {
  number: number;
  title: string;
  children: ReactNode;
  /** "danger" matches the source Terms page's red-badged "Prohibited Events" section. */
  tone?: "default" | "danger";
}

/** A numbered section in a legal document (Terms & Conditions / Privacy Policy). */
export function LegalSection({ number, title, children, tone = "default" }: LegalSectionProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const badgeColor = tone === "danger" ? colors.error : colors.accentText;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{number}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

/** A single bullet paragraph inside a LegalSection. */
export function LegalBullet({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "danger" }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dotColor = tone === "danger" ? colors.error : colors.accentText;

  return (
    <View style={styles.bulletRow}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.paragraph}>{children}</Text>
    </View>
  );
}

/** A plain paragraph inside a LegalSection (no bullet). */
export function LegalParagraph({ children }: { children: ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.paragraph}>{children}</Text>;
}

/** A tinted callout box (matches the source's amber/red warning boxes). */
export function LegalCallout({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "danger" }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bg = tone === "danger" ? colors.errorBg : colors.warningBg;
  const text = tone === "danger" ? colors.error : colors.warning;

  return (
    <View style={[styles.callout, { backgroundColor: bg }]}>
      <Text style={[styles.paragraph, { color: text }]}>{children}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginBottom: 28,
    },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    badge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.buttonPrimaryText,
    },
    title: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
    },
    body: {
      gap: 10,
      paddingLeft: 36,
    },
    bulletRow: {
      flexDirection: "row",
      gap: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 7,
    },
    paragraph: {
      flex: 1,
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textMuted,
    },
    callout: {
      borderRadius: 10,
      padding: 12,
    },
  });
