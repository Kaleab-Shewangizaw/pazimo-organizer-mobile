import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

/**
 * Space Grotesk (display) + DM Sans (body) — the pairing from the design
 * reference. Space Grotesk is used only for headings, section titles, and
 * money/stat figures, same restraint as this app's previous Manrope-only
 * system; DM Sans is available for body copy that wants to explicitly move
 * off the platform system font (buttons, chips, stat notes) without
 * requiring every existing screen to be swept at once.
 */
export const fontAssets = {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
};

export const fonts = {
  semibold: "SpaceGrotesk_500Medium",
  bold: "SpaceGrotesk_600SemiBold",
  extrabold: "SpaceGrotesk_700Bold",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",
} as const;
