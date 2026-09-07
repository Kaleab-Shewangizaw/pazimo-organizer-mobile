/**
 * Two deliberate directions, not a generic "invert the grays" dark mode:
 *
 * - "Ledger" (light) — near-white, near-black ink, one warm brass accent
 *   reserved for the figure that matters most on a screen (an available
 *   balance, a hero stat). Hairline borders instead of boxed shadows.
 * - "After Hours" (dark) — near-black, warm off-white ink, the same accent
 *   pushed brighter so it reads like a marquee bulb against the dark.
 *
 * Every screen reads colors via `useColors()` (or `useThemeMode()` for the
 * mode itself), never a static import — that's what lets a screen actually
 * re-render when the mode changes. See `ThemeProvider` below.
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  ink: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  warningBg: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F5",
  border: "#E7E7E9",
  ink: "#111214",
  textMuted: "#6E7076",
  accent: "#B7791F",
  accentSoft: "#F7ECD9",
  buttonPrimaryBg: "#111214",
  buttonPrimaryText: "#FFFFFF",
  success: "#1E8E5A",
  successBg: "#E7F6EF",
  error: "#C4322F",
  errorBg: "#FBEAEA",
  warning: "#C2660B",
  warningBg: "#FBEEDD",
  overlay: "rgba(15, 15, 17, 0.5)",
};

export const darkColors: ThemeColors = {
  background: "#0A0A0B",
  surface: "#17181A",
  surfaceAlt: "#1F2023",
  border: "#2A2B2E",
  ink: "#F2F1EE",
  textMuted: "#9A9A9E",
  accent: "#F5B942",
  accentSoft: "rgba(245, 185, 66, 0.14)",
  buttonPrimaryBg: "#F2F1EE",
  buttonPrimaryText: "#0A0A0B",
  success: "#34D399",
  successBg: "rgba(52, 211, 153, 0.14)",
  error: "#F87171",
  errorBg: "rgba(248, 113, 113, 0.14)",
  warning: "#FBBF24",
  warningBg: "rgba(251, 191, 36, 0.14)",
  overlay: "rgba(0, 0, 0, 0.6)",
};
