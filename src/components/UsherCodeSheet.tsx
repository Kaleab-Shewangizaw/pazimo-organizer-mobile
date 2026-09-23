import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { generateEventUsherCode, getEventUsherAccess, revokeUsherAccess } from "@/api/ushers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { accentAlt, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { EventUsherAccessGrant } from "@/types";

interface UsherCodeSheetProps {
  eventId: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet where an organizer sees, copies, and (re)generates the short
 * code ushers redeem to unlock ticket scanning for this event (GET/POST
 * /api/ushers/events/:eventId/code — usherController.js), plus who currently
 * holds a live grant from it and a way to revoke one person's access
 * (PATCH .../access/:usherId/revoke). Opened from the key icon in the event
 * tickets screen's header. Regenerating the code only changes what a *new*
 * redemption needs — it doesn't touch anyone already granted access, which
 * is why revoke is a separate, per-person action below.
 */
export function UsherCodeSheet({ eventId, visible, onClose }: UsherCodeSheetProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<EventUsherAccessGrant | null>(null);

  const query = useQuery({
    queryKey: ["usher-code", eventId],
    queryFn: () => getEventUsherAccess(eventId),
    enabled: visible,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateEventUsherCode(eventId),
    onSuccess: () => query.refetch(),
  });

  const revokeMutation = useMutation({
    mutationFn: (usherId: string) => revokeUsherAccess(eventId, usherId),
    onSuccess: () => {
      setRevokeTarget(null);
      query.refetch();
    },
  });

  async function copyCode(code: string) {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function onGeneratePress(hasExistingCode: boolean) {
    if (!hasExistingCode) {
      generateMutation.mutate();
      return;
    }
    Alert.alert(
      "Generate a new code?",
      "The current code stops working for new ushers right away. Anyone who already unlocked this event keeps their access.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Generate", style: "destructive", onPress: () => generateMutation.mutate() },
      ],
    );
  }

  const generateError = generateMutation.isError ? bannerMessageFor(generateMutation.error) : null;
  const revokeError = revokeMutation.isError ? bannerMessageFor(revokeMutation.error) : null;
  const loadError = query.isError ? bannerMessageFor(query.error) : null;

  const data = query.data?.data;
  const code = data?.code ?? null;
  const ushers = data?.ushers ?? [];
  const usherCount = ushers.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
      <SafeAreaView style={styles.sheetSafeArea} edges={["bottom"]}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Usher code</Text>
              <Text style={styles.subtitle}>
                Share this so ushers can unlock scanning for this event.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {loadError ? <Banner kind="error" message={loadError} /> : null}
          {generateError ? <Banner kind="error" message={generateError} /> : null}
          {revokeError ? <Banner kind="error" message={revokeError} /> : null}

          {query.isPending ? (
            <ActivityIndicator color={accentAlt(colors)} style={styles.loading} />
          ) : code ? (
            <>
              <View style={styles.codeRow}>
                {code.split("").map((char, index) => (
                  <View key={index} style={styles.codeBox}>
                    <Text style={styles.codeChar}>{char}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.usherCount}>
                {usherCount === 0
                  ? "No ushers have access yet"
                  : `${usherCount} usher${usherCount === 1 ? "" : "s"} currently have access`}
              </Text>

              {usherCount > 0 ? (
                <ScrollView style={styles.usherList} nestedScrollEnabled>
                  {ushers.map((grant) => {
                    const isRevoking =
                      revokeMutation.isPending && revokeMutation.variables === grant.usher._id;
                    return (
                      <View key={grant.accessId} style={styles.usherRow}>
                        <View style={styles.usherInfo}>
                          <Text style={styles.usherName} numberOfLines={1}>
                            {grant.usher.firstName} {grant.usher.lastName}
                          </Text>
                          <Text style={styles.usherEmail} numberOfLines={1}>
                            {grant.usher.email}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setRevokeTarget(grant)}
                          disabled={revokeMutation.isPending}
                          hitSlop={8}
                          style={styles.revokeButton}
                          accessibilityRole="button"
                          accessibilityLabel={`Revoke access for ${grant.usher.firstName} ${grant.usher.lastName}`}
                        >
                          {isRevoking ? (
                            <ActivityIndicator size="small" color={colors.error} />
                          ) : (
                            <Ionicons name="person-remove-outline" size={18} color={colors.error} />
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}

              <View style={styles.actionRow}>
                <Button
                  label={copied ? "Copied!" : "Copy code"}
                  variant="secondary"
                  onPress={() => copyCode(code)}
                  style={styles.copyButton}
                />
                <Pressable
                  onPress={() => onGeneratePress(true)}
                  disabled={generateMutation.isPending}
                  style={styles.regenerateButton}
                  accessibilityRole="button"
                  accessibilityLabel="Generate a new code"
                >
                  {generateMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  ) : (
                    <Ionicons name="refresh-outline" size={20} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <Button
              label="Generate code"
              onPress={() => onGeneratePress(false)}
              loading={generateMutation.isPending}
            />
          )}
        </View>
      </SafeAreaView>

      <ConfirmDialog
        visible={revokeTarget !== null}
        title="Revoke access?"
        message={
          revokeTarget
            ? `${revokeTarget.usher.firstName} ${revokeTarget.usher.lastName} will need a new code to scan this event again.`
            : undefined
        }
        confirmLabel="Revoke"
        destructive
        onConfirm={() => revokeTarget && revokeMutation.mutate(revokeTarget.usher._id)}
        onCancel={() => setRevokeTarget(null)}
      />
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheetSafeArea: {
      marginTop: "auto",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 14,
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 4,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    loading: {
      paddingVertical: 20,
    },
    codeRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 6,
    },
    codeBox: {
      width: 44,
      height: 52,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    codeChar: {
      fontFamily: fonts.extrabold,
      fontSize: 19,
      color: colors.ink,
    },
    usherCount: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
    },
    usherList: {
      maxHeight: 220,
    },
    usherRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    usherInfo: {
      flex: 1,
      gap: 2,
    },
    usherName: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.ink,
    },
    usherEmail: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
    },
    revokeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 2,
    },
    copyButton: {
      flex: 1,
    },
    regenerateButton: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
  });
