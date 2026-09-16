import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LegalBullet, LegalCallout, LegalParagraph, LegalSection } from "@/components/LegalSection";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

/**
 * Ported verbatim from pazimo/frontend's app/terms/page.tsx (the Organizer
 * Terms & Conditions the marketing site shows) — content-faithful, restyled
 * for this app's own theme rather than a literal Tailwind port.
 */
export default function OrganizerTermsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/account/menu")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Organizer Terms & Conditions</Text>
        <Text style={styles.effectiveDate}>Effective Date: July 30, 2025</Text>
        <Text style={styles.intro}>
          These terms govern your use of Pazimo as an Event Organizer. Please read them carefully
          before creating and managing events on our platform.
        </Text>

        <LegalSection number={1} title="Eligibility">
          <LegalParagraph>
            You must be at least 18 years old and legally able to enter into binding contracts in
            Ethiopia to create and manage events on Pazimo.
          </LegalParagraph>
        </LegalSection>

        <LegalSection number={2} title="Organizer Responsibilities">
          <LegalBullet>
            You are responsible for providing accurate, complete, and up-to-date event information,
            including event title, venue, time, pricing, and any restrictions.
          </LegalBullet>
          <LegalBullet>
            You must ensure that all events comply with applicable laws and do not violate the
            rights of third parties.
          </LegalBullet>
          <LegalBullet>
            You are solely responsible for fulfilling all obligations related to your event,
            including ticket delivery, customer support, and event execution.
          </LegalBullet>
          <LegalBullet>You agree not to list events that are false, misleading, illegal, or harmful.</LegalBullet>
        </LegalSection>

        <LegalSection number={3} title="Ticket Sales and Payouts">
          <LegalBullet>Tickets for your events will be sold through the Pazimo platform.</LegalBullet>
          <LegalBullet>Pazimo will collect and process all payments on your behalf.</LegalBullet>
          <LegalBullet>
            Organizer payouts will be made according to the agreed-upon schedule, typically after
            the event, minus Pazimo's commission and applicable fees.
          </LegalBullet>
          <LegalBullet>
            Pazimo reserves the right to withhold payouts in the case of disputes, chargebacks, or
            suspected fraud.
          </LegalBullet>
        </LegalSection>

        <LegalSection number={4} title="Fees and Commission">
          <LegalBullet>
            Pazimo charges a service fee or commission on each ticket sold. The rate will be
            communicated to you during event setup.
          </LegalBullet>
          <LegalBullet>You are responsible for any applicable taxes associated with your event income.</LegalBullet>
        </LegalSection>

        <LegalSection number={5} title="Cancellations and Refunds">
          <LegalBullet>
            Organizers must notify Pazimo and ticket buyers immediately if an event is canceled or
            rescheduled.
          </LegalBullet>
          <LegalBullet>
            Pazimo reserves the right to issue refunds to ticket buyers and deduct the amount from
            your payout if the event is canceled or if buyers are entitled to refunds under
            applicable consumer protection laws.
          </LegalBullet>
        </LegalSection>

        <LegalSection number={6} title="Prohibited Events" tone="danger">
          <LegalParagraph>You may not use Pazimo to host or promote:</LegalParagraph>
          <LegalBullet tone="danger">Illegal activities or gatherings.</LegalBullet>
          <LegalBullet tone="danger">Events that promote hate speech, discrimination, or violence.</LegalBullet>
          <LegalBullet tone="danger">Fake, misleading, or scam-related events.</LegalBullet>
        </LegalSection>

        <LegalSection number={7} title="Limitation of Liability">
          <LegalCallout>
            Pazimo is a facilitator and is not responsible for the actual performance or quality of
            any event. Organizers are solely liable for all aspects of their events, including
            safety and compliance with laws.
          </LegalCallout>
        </LegalSection>

        <LegalSection number={8} title="Account Termination">
          <LegalParagraph>Pazimo may suspend or terminate your organizer account at any time if you:</LegalParagraph>
          <LegalBullet>Violate these Terms;</LegalBullet>
          <LegalBullet>Engage in fraudulent or unethical behavior;</LegalBullet>
          <LegalBullet>Harm the reputation of Pazimo or other users.</LegalBullet>
        </LegalSection>

        <LegalSection number={9} title="Changes to Terms">
          <LegalParagraph>
            We may update these Terms occasionally. Organizers will be notified of significant
            changes. Continued use of Pazimo after updates means you accept the revised Terms.
          </LegalParagraph>
        </LegalSection>

        <LegalSection number={10} title="Governing Law">
          <LegalParagraph>
            These Terms are governed by the laws of Ethiopia. Any disputes shall be resolved
            through negotiation, or if necessary, in the appropriate courts in Addis Ababa.
          </LegalParagraph>
        </LegalSection>

        <View style={styles.contactBlock}>
          <Text style={styles.contactTitle}>Need help?</Text>
          <Text style={styles.contactBody}>
            For any questions about these terms or our services, contact support@pazimo.com or
            +251 991 051 844.
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
