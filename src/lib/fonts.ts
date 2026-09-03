import {
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";

/**
 * Manrope is used only for display text and figures (greetings, section
 * titles, money/stat numbers) — restraint is the point, so body copy,
 * inputs, and buttons stay on the system font.
 */
export const fontAssets = {
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
};

export const fonts = {
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold",
} as const;
