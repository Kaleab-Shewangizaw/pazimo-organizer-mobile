/**
 * Design direction: "ticket stub" — Pazimo sells tickets, so the one
 * signature device in this app (the balance card, event cards) borrows the
 * perforated-stub shape of a physical ticket. See src/components/StubDivider.
 * Navy is inherited from the existing web app's brand primary
 * (organzier-pazimo/app/globals.css); gold is re-tuned from that same page's
 * accent into something closer to foil/museum-label gold, since flat
 * Tailwind-amber read as a status color once used site-wide.
 */
export const colors = {
  ink: "#16232F", // primary text — soft near-black, not pure black
  paper: "#F7F3EC", // page background — warm parchment, not sterile white
  surface: "#FFFFFF",
  navy: "#1B3555", // brand primary — buttons, primary actions
  navyDeep: "#0F2038", // pressed state, dark fills
  gold: "#B98A2E", // accent — used only on the stub cards' hero figures
  goldMuted: "#EFE3C8", // gold-tinted surface (chips, subtle highlights)
  border: "#E7E1D3",
  textMuted: "#6B6459",
  success: "#1E8E5A",
  successBg: "#E7F6EF",
  error: "#C4322F",
  errorBg: "#FBEAEA",
  warning: "#C2660B",
  warningBg: "#FBEEDD",
} as const;
