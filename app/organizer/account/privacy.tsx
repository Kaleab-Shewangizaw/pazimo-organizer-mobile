import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LegalBullet, LegalParagraph, LegalSection } from "@/components/LegalSection";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

/**
 * Ported verbatim from pazimo/frontend's app/privacy/page.tsx — content-
 * faithful, restyled for this app's own theme rather than a literal
 * Tailwind port.
 */
export default function OrganizerPrivacyScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/account/menu")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.effectiveDate}>Effective: July 19, 2025 · Last Updated: July 19, 2025</Text>
        <Text style={styles.intro}>
          Your privacy is important to us. This Privacy Policy explains how Pazimo collects, uses,
          and protects your personal information.
        </Text>

        <LegalSection number={1} title="Information We Collect">
          <LegalBullet>Account Data: Name, email, phone number, password.</LegalBullet>
          <LegalBullet>
            Payment Info: Billing details (processed securely by third-party providers).
          </LegalBullet>
          <LegalBullet>
            Usage Data: App usage behavior, event preferences, and interactions.
          </LegalBullet>
        </LegalSection>

        <LegalSection number={2} title="How We Use Your Information">
          <LegalBullet>To process ticket purchases and provide customer support.</LegalBullet>
          <LegalBullet>To notify you about upcoming events, promotions, or app updates.</LegalBullet>
          <LegalBullet>To improve user experience and platform performance.</LegalBullet>
        </LegalSection>

        <LegalSection number={3} title="Sharing of Data">
          <LegalParagraph>We do not sell your data. Your information may only be shared:</LegalParagraph>
          <LegalBullet>With event organizers (for attendees only).</LegalBullet>
          <LegalBullet>With trusted third-party services (e.g., payment processors).</LegalBullet>
          <LegalBullet>If required by law or legal process.</LegalBullet>
        </LegalSection>

        <LegalSection number={4} title="Data Security">
          <LegalParagraph>
            We use encryption, secure servers, and other safeguards to protect your data.
          </LegalParagraph>
        </LegalSection>

        <LegalSection number={5} title="Cookies & Analytics">
          <LegalParagraph>
            We may use cookies and analytics tools to understand how users interact with our
            platform.
          </LegalParagraph>
        </LegalSection>

        <LegalSection number={6} title="Your Rights">
          <LegalBullet>Access or update your personal information.</LegalBullet>
          <LegalBullet>Request deletion of your account or data.</LegalBullet>
          <LegalBullet>Opt-out of marketing communications.</LegalBullet>
        </LegalSection>

        <LegalSection number={7} title="Children's Privacy">
          <LegalParagraph>
            Our platform is not intended for children under 13. We do not knowingly collect data
            from minors.
          </LegalParagraph>
        </LegalSection>

        <LegalSection number={8} title="Changes to this Policy">
          <LegalParagraph>
            We may update this Privacy Policy. When we do, we'll notify users via app or email.
          </LegalParagraph>
        </LegalSection>

        <View style={styles.contactBlock}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          <Text style={styles.contactBody}>
            For questions or concerns, reach out to support@pazimo.com.
          </Text>
        </View>
      </ScrollView>
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
    },
    content: {
      padding: 20,
      paddingBottom: 48,
    },
    heading: {
      fontFamily: fonts.extrabold,
      fontSize: 24,
      color: colors.ink,
      marginBottom: 6,
    },
    effectiveDate: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 12,
    },
    intro: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textMuted,
      marginBottom: 28,
    },
    contactBlock: {
      marginTop: 12,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
      gap: 6,
    },
    contactTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
    },
    contactBody: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
