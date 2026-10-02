import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  View,
  type KeyboardEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Spread onto every ScrollView/FlatList that holds a text input.
 *
 * On iOS `automaticallyAdjustKeyboardInsets` does the whole job natively:
 * it insets the scroll view by however much of it the keyboard actually
 * covers (measured in window coordinates, so a nav header or top bar above
 * it doesn't throw the maths off) and scrolls the focused input into view.
 * Android ignores it — KeyboardAvoider covers that side.
 */
export const keyboardScrollProps = {
  keyboardShouldPersistTaps: "handled",
  automaticallyAdjustKeyboardInsets: true,
  keyboardDismissMode: Platform.OS === "ios" ? "interactive" : "on-drag",
} satisfies ScrollViewProps;

interface KeyboardAvoiderProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Also pad on iOS. Only for content that isn't inside a scroll view
   * spread with keyboardScrollProps — otherwise iOS would be adjusted twice.
   */
  ios?: boolean;
}

/**
 * Replacement for React Native's KeyboardAvoidingView, which gets two
 * things wrong for this app:
 *
 * - It measures itself with onLayout (relative to its parent, not the
 *   window), so under a native stack header — usher sign-up, forgot
 *   password — it under-pads by the header's height and the last fields
 *   stay hidden behind the keyboard.
 * - Android apps are edge-to-edge since SDK 54, so `adjustResize` no
 *   longer shrinks the window; with no `behavior` on Android (what every
 *   screen here had) nothing moved at all.
 *
 * This pads its bottom by exactly the slice of itself the keyboard covers,
 * measured with measureInWindow. A ScrollView inside shrinks with it, and
 * Android's ScrollView scrolls the focused input back into view when its
 * height changes.
 */
export function KeyboardAvoider({ children, style, ios = false }: KeyboardAvoiderProps) {
  const ref = useRef<View>(null);
  const [bottom, setBottom] = useState(0);
  const enabled = Platform.OS === "android" || (Platform.OS === "ios" && ios);

  useEffect(() => {
    if (!enabled) return;

    const update = (e: KeyboardEvent | null) => {
      const view = ref.current;
      if (!view) return;
      if (!e) {
        setBottom(0);
        return;
      }
      const keyboardTop = e.endCoordinates.screenY;
      view.measureInWindow((_x, y, _width, height) => {
        if (Platform.OS === "ios" && e.duration) {
          LayoutAnimation.configureNext({
            duration: e.duration,
            update: { duration: e.duration, type: LayoutAnimation.Types.keyboard },
          });
        }
        setBottom(Math.max(0, y + height - keyboardTop));
      });
    };

    // iOS's will-change-frame fires for show, hide, and resize (e.g. the
    // QuickType bar appearing), with the end frame each time.
    const subs =
      Platform.OS === "ios"
        ? [Keyboard.addListener("keyboardWillChangeFrame", update)]
        : [
            Keyboard.addListener("keyboardDidShow", update),
            Keyboard.addListener("keyboardDidHide", () => update(null)),
          ];
    return () => subs.forEach((s) => s.remove());
  }, [enabled]);

  return (
    <View ref={ref} style={[style, enabled && bottom > 0 ? { paddingBottom: bottom } : null]}>
      {children}
    </View>
  );
}
