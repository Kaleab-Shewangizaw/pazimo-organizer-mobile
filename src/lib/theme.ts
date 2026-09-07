/**
 * Palette adapted from a design reference the user provided (a Lovable
 * mockup of this exact app, "Gatelight") — converted from its oklch tokens
 * to hex via the CSS Color 4 oklch->sRGB matrices, not eyeballed. Same
 * "one accent reserved for the figure that matters most" restraint as
 * before, now built around a warm off-white/near-black-navy pair instead of
 * pure white/black, with a more saturated gold and solid-fill "hero" cards
 * (see HeroCard) rather than bordered ones.
 *
 * Deliberate deviation from the reference: its dark theme's `--accent`
 * token collapses to a neutral gray (same as `--muted`) — almost certainly
 * a shadcn-generator default rather than an intentional choice, since every
 * other token pair stays purposeful. Dark mode here keeps the same vivid
 * gold as light mode; it reads fine (plenty of contrast) against the dark
 * surfaces and keeps the accent meaningful in both modes.
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
  /** A translucent version of buttonPrimaryText, for a hairline divider drawn on top of a HeroCard (which is filled buttonPrimaryBg). */
  heroDivider: string;
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  warningBg: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: "#FCFBF9",
  surface: "#FFFFFF",
  surfaceAlt: "#F2F0EC",
  border: "#E5E4DF",
  ink: "#101318",
  textMuted: "#686C73",
  accent: "#F1C035",
  accentSoft: "rgba(241, 192, 53, 0.16)",
  buttonPrimaryBg: "#14181F",
  buttonPrimaryText: "#FDFCF9",
  heroDivider: "rgba(255, 255, 255, 0.15)",
  success: "#269E5F",
  successBg: "rgba(38, 158, 95, 0.12)",
  error: "#D81F2C",
  errorBg: "rgba(216, 31, 44, 0.1)",
  warning: "#F2943C",
  warningBg: "rgba(242, 148, 60, 0.14)",
  overlay: "rgba(16, 19, 24, 0.5)",
};

export const darkColors: ThemeColors = {
  background: "#020618",
  surface: "#0F172B",
  surfaceAlt: "#1D293D",
  border: "rgba(255, 255, 255, 0.1)",
  ink: "#F8FAFC",
  textMuted: "#90A1B9",
  accent: "#F1C035",
  accentSoft: "rgba(241, 192, 53, 0.16)",
  buttonPrimaryBg: "#E2E8F0",
  buttonPrimaryText: "#0F172B",
  heroDivider: "rgba(0, 0, 0, 0.15)",
  success: "#3FB171",
  successBg: "rgba(63, 177, 113, 0.16)",
  error: "#FF6467",
  errorBg: "rgba(255, 100, 103, 0.16)",
  warning: "#FC9E47",
  warningBg: "rgba(252, 158, 71, 0.16)",
  overlay: "rgba(0, 0, 0, 0.6)",
};
