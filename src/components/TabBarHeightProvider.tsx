import { createContext, useContext, useState, type ReactNode } from "react";

const TabBarHeightContext = createContext(0);
const ReportTabBarHeightContext = createContext<((height: number) => void) | null>(null);

/**
 * TabBar renders as an absolutely-positioned overlay (see TabBar.tsx) so it
 * floats over scrolling content instead of reserving its own row — which
 * means content no longer gets that space carved out for it automatically.
 * This shares the bar's own measured height with the screens under it, so
 * each Tabs layout can feed it back in as `sceneStyle.paddingBottom` and
 * every screen's content can scroll fully clear of the floating bar.
 */
export function TabBarHeightProvider({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState(0);
  return (
    <ReportTabBarHeightContext.Provider value={setHeight}>
      <TabBarHeightContext.Provider value={height}>{children}</TabBarHeightContext.Provider>
    </ReportTabBarHeightContext.Provider>
  );
}

/** The floating TabBar's current rendered height — 0 outside a TabBarHeightProvider. */
export function useTabBarHeight() {
  return useContext(TabBarHeightContext);
}

/** Internal — only TabBar itself should report its measured height. */
export function useReportTabBarHeight() {
  return useContext(ReportTabBarHeightContext);
}
