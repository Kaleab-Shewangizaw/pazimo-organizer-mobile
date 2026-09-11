import type { Theme } from "expo-router";
import { DarkTheme as RNDarkTheme, DefaultTheme as RNDefaultTheme } from "expo-router";

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
 *
 * Dark mode is true black (#000000), not the reference's navy-tinted slate
 * — explicitly requested over the slate/blue cast that reads as "dark gray"
 * rather than "dark". Surfaces are neutral near-blacks (no hue), text is
 * neutral white/gray (no slate blue), so nothing in the theme carries a
 * blue tint except the gold accent itself.
 *
 * `accent` (#F1C035) is ~1.7:1 against white — fine for a fill, dot, or
 * border, but fails as text on a light surface. `accentText` covers that:
 * Pazimo's own site blue in light mode (readable at ~8:1, and matches
 * `accentAlt`'s light-mode value — see below), unchanged as gold in dark
 * mode, where `accent` itself already has plenty of contrast against
 * near-black.
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
  /**
   * The app's one highlight color for text (a revenue figure, an initial,
   * a stepper count) — never plain `accent`, which isn't readable on a
   * light surface. Blue in light mode (the same blue as `accentAlt`'s
   * light-mode value); still gold in dark mode, where the warm accent
   * reads fine against near-black.
   */
  accentText: string;
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

// Pazimo's own site blue (the `--primary` token in pazimo/frontend's
// globals.css) — light mode's `accentText` and `accentAlt` both resolve to
// this exact value, so there's one blue, not two coincidentally-matching
// hexes.
const blueAccentLight = "#0D47A1";

export const lightColors: ThemeColors = {
  background: "#FCFBF9",
  surface: "#FFFFFF",
  surfaceAlt: "#F2F0EC",
  border: "#E5E4DF",
  ink: "#101318",
  textMuted: "#686C73",
  accent: "#F1C035",
  accentSoft: "rgba(241, 192, 53, 0.16)",
  accentText: blueAccentLight,
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
  background: "#000000",
  surface: "#121212",
  surfaceAlt: "#1C1C1C",
  border: "rgba(255, 255, 255, 0.1)",
  ink: "#FAFAFA",
  textMuted: "#9E9E9E",
  accent: "#F1C035",
  accentSoft: "rgba(241, 192, 53, 0.16)",
  accentText: "#F1C035",
  buttonPrimaryBg: "#FAFAFA",
  buttonPrimaryText: "#101010",
  heroDivider: "rgba(0, 0, 0, 0.15)",
  success: "#3FB171",
  successBg: "rgba(63, 177, 113, 0.16)",
  error: "#FF6467",
  errorBg: "rgba(255, 100, 103, 0.16)",
  warning: "#FC9E47",
  warningBg: "rgba(252, 158, 71, 0.16)",
  overlay: "rgba(0, 0, 0, 0.6)",
};

/**
 * Pazimo's own navy pairing, pulled from the marketing site
 * (pazimo/frontend's footer, `#06283D`, deepening into `#1A5D8C` on its own
 * ticket-detail card). Fixed regardless of light/dark mode — used only for
 * the organizer dashboard's hero card (see HeroCard's "brand" variant),
 * which is meant to read as one deliberate brand moment, not something that
 * should blend into either theme.
 */
export const brandBlueDeep = "#06283D";
export const brandBlue = "#1A5D8C";

/** Whether `colors` is the dark palette — `useColors()` always returns one of
 * these two exact objects, never a merged/cloned copy, so reference equality
 * is safe here. */
export function isDarkTheme(colors: ThemeColors): boolean {
  return colors === darkColors;
}

/**
 * Experimental stand-in for the app's gold accent on loading spinners and
 * the tab bar's active state — unlike `brandBlue` above (fixed, for the one
 * hero card), this one follows the theme: plain white in dark mode, since
 * the flat navy read as dull against the true-black page, and Pazimo's own
 * site blue (the `--primary` token in pazimo/frontend's globals.css) in
 * light mode, rather than a muted/desaturated blue that drifts toward a
 * flesh tone.
 */
export function accentAlt(colors: ThemeColors): string {
  return isDarkTheme(colors) ? "#FFFFFF" : blueAccentLight;
}

/**
 * Soft elevation for cards that drop the hairline border in favor of
 * looking lifted off the page. Light mode only — a drop shadow reads as a
 * shadow against a light page, but on the true-black dark page there's
 * nothing lighter than the shadow to cast it onto, so it just looks like a
 * smudge. Dark mode falls back to no shadow at all (the border-free card
 * still separates from the page via its own lighter surface color).
 */
export function cardShadow(colors: ThemeColors): string {
  return isDarkTheme(colors) ? "none" : `0px 8px 20px ${colors.ink}1F`;
}

/**
 * The app never set React Navigation's own theme, so every navigator (each
 * role's Stack, and the Tabs nested inside it) fell back to RN Navigation's
 * default — a light-gray `background`/`card` in light mode. That default
 * showed through anywhere our own screens didn't paint over it edge to edge,
 * most visibly behind the floating TabBar once it stopped filling that area
 * itself. Feeding our real palette into a proper navigation `Theme` (wired
 * up via `ThemeProvider` in the root layout) fixes it at the source instead
 * of patching every gap individually.
 */
export const navigationLightTheme: Theme = {
  ...RNDefaultTheme,
  dark: false,
  colors: {
    ...RNDefaultTheme.colors,
    primary: lightColors.accent,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.ink,
    border: lightColors.border,
    notification: lightColors.error,
  },
};

export const navigationDarkTheme: Theme = {
  ...RNDarkTheme,
  dark: true,
  colors: {
    ...RNDarkTheme.colors,
    primary: darkColors.accent,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.ink,
    border: darkColors.border,
    notification: darkColors.error,
  },
};
