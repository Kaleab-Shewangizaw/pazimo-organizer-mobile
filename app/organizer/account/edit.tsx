import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOrganizerProfile, updateOrganizerProfile, updateOrganizerProfilePicture } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { editOrganizerProfileSchema } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { resolveMediaUrl } from "@/lib/media";
import { goBack } from "@/lib/navigation";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

export default function OrganizerEditProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [organization, setOrganization] = useState(user?.organization ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** The picked (already OS-cropped) photo, held here for the preview dialog
   * below until the organizer confirms it — nothing uploads until then. */
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // organization isn't on /auth/me (it lives on the sign-up
  // OrganizerRegistration doc), so the store's user never has it — fetch the
  // full profile once to hydrate the field instead of leaving it blank.
  const profileQuery = useQuery({
    queryKey: ["organizer-profile"],
    queryFn: getOrganizerProfile,
  });
  const hasHydratedOrganization = useRef(false);
  useEffect(() => {
    if (hasHydratedOrganization.current || !profileQuery.data) return;
    hasHydratedOrganization.current = true;
    setOrganization(profileQuery.data.data.organization ?? "");
  }, [profileQuery.data]);

  const pictureMutation = useMutation({
    mutationFn: (uri: string) => updateOrganizerProfilePicture(uri),
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(["organizer-profile"], res);
      setPreviewUri(null);
    },
    onError: (err) =>
      Alert.alert("Couldn't update photo", bannerMessageFor(err) ?? undefined),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = editOrganizerProfileSchema.safeParse({
        firstName,
        lastName,
        email,
        phoneNumber,
        organization,
      });
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          errors[String(issue.path[0])] = issue.message;
        }
        setFieldErrors(errors);
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setFieldErrors({});
      const res = await updateOrganizerProfile(parsed.data);
      setUser(res.data);
      queryClient.setQueryData(["organizer-profile"], res);
    },
    onSuccess: () => goBack("/organizer/(tabs)/account"),
  });

  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const request = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!request.granted) {
          Alert.alert(
            "Photo access needed",
            "Allow Pazimo to access your photos to set a profile picture.",
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      setPreviewUri(result.assets[0].uri);
    } catch {
      // Most commonly: expo-image-picker was just added and the installed
      // dev client binary on this device predates it — the native module
      // isn't in the app yet. Rebuild the dev client (`npx expo run:android`
      // / `npx expo run:ios`, or a new EAS development build) after adding a
      // new native dependency; a JS-only reload can't pick it up.
      Alert.alert(
        "Couldn't open photo picker",
        "If this keeps happening after a fresh app reload, the app may need to be rebuilt to include photo picker support.",
      );
    }
  };

  if (!user) return null;

  const avatarUrl = resolveMediaUrl(user.profilePicture);
  const topLevelError = saveMutation.isError ? bannerMessageFor(saveMutation.error) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/(tabs)/account")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Edit profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickPhoto} style={styles.avatarWrap} disabled={pictureMutation.isPending}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {user.firstName?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            {pictureMutation.isPending ? (
              <Ionicons name="ellipsis-horizontal" size={14} color={colors.buttonPrimaryText} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.buttonPrimaryText} />
            )}
          </View>
        </Pressable>
        <Text style={styles.changePhotoLabel}>Change photo</Text>

        <View style={styles.form}>
          {topLevelError ? <Banner kind="error" message={topLevelError} /> : null}

          <TextField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            error={fieldErrors.firstName}
            autoCapitalize="words"
          />
          <TextField
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            error={fieldErrors.lastName}
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label="Phone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={fieldErrors.phoneNumber}
            keyboardType="phone-pad"
          />
          <TextField
            label="Organization"
            value={organization}
            onChangeText={setOrganization}
            error={fieldErrors.organization}
            autoCapitalize="words"
          />

          <Button
            label="Save changes"
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            style={styles.submit}
          />
        </View>
      </ScrollView>

      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.previewBackdrop}>
          <SafeAreaView style={styles.previewSafeArea} edges={["top", "bottom"]}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.previewTitle}>Profile photo</Text>
              <Pressable
                onPress={() => setPreviewUri(null)}
                hitSlop={8}
                style={styles.previewCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.previewImageWrap}>
              {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} /> : null}
              {pictureMutation.isPending ? (
                <View style={styles.previewLoadingOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="large" />
                </View>
              ) : null}
            </View>

            <Text style={styles.previewCaption}>This is how your profile photo will look.</Text>

            <View style={styles.previewActions}>
              <Pressable
                onPress={() => {
                  setPreviewUri(null);
                  pickPhoto();
                }}
                disabled={pictureMutation.isPending}
                style={({ pressed }) => [
                  styles.previewButton,
                  styles.previewButtonOutline,
                  pressed && styles.previewButtonPressed,
                ]}
              >
                <Text style={styles.previewButtonOutlineText}>Choose another</Text>
              </Pressable>
              <Pressable
                onPress={() => previewUri && pictureMutation.mutate(previewUri)}
                disabled={pictureMutation.isPending}
                style={({ pressed }) => [
                  styles.previewButton,
                  styles.previewButtonSolid,
                  pressed && styles.previewButtonPressed,
                ]}
              >
                {pictureMutation.isPending ? (
                  <ActivityIndicator color="#101318" />
                ) : (
                  <Text style={styles.previewButtonSolidText}>Use photo</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 88;
const PREVIEW_SIZE = 240;

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
      alignItems: "center",
      paddingBottom: 40,
    },
    avatarWrap: {
      marginTop: 12,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    avatarFallback: {
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 32,
      color: colors.accentText,
    },
    avatarBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.buttonPrimaryBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    changePhotoLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.accentText,
      marginTop: 10,
    },
    form: {
      alignSelf: "stretch",
      gap: 16,
      marginTop: 28,
    },
    submit: {
      marginTop: 8,
    },
    previewBackdrop: {
      flex: 1,
      backgroundColor: "rgba(10,10,12,0.94)",
    },
    previewSafeArea: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 20,
    },
    previewHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    previewTitle: {
      fontFamily: fonts.bold,
      fontSize: 17,
      color: "#FFFFFF",
    },
    previewCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    previewImageWrap: {
      alignSelf: "center",
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      borderRadius: PREVIEW_SIZE / 2,
      overflow: "hidden",
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    previewImage: {
      width: "100%",
      height: "100%",
    },
    previewLoadingOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    previewCaption: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      textAlign: "center",
    },
    previewActions: {
      flexDirection: "row",
      gap: 12,
    },
    previewButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    previewButtonPressed: {
      opacity: 0.8,
    },
    previewButtonOutline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.4)",
    },
    previewButtonOutlineText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: "#FFFFFF",
    },
    previewButtonSolid: {
      backgroundColor: "#FFFFFF",
    },
    previewButtonSolidText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: "#101318",
    },
  });
