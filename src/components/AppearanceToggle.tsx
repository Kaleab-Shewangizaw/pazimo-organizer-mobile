import { SegmentedControl } from "@/components/SegmentedControl";
import { useThemeStore, type ThemeMode } from "@/store/themeStore";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** Light/Dark/System segmented control — shared by every role's Account screen. */
export function AppearanceToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return <SegmentedControl options={OPTIONS} value={mode} onChange={setMode} />;
}
