import * as Haptics from "expo-haptics";
import type { Tabs } from "expo-router";
import { useEffect, useMemo, useRef, type ComponentProps } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useReportTabBarHeight } from "@/components/TabBarHeightProvider";
import { fonts } from "@/lib/fonts";
import { accentAlt, isDarkTheme, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

type TabBarRenderProp = NonNullable<ComponentProps<typeof Tabs>["tabBar"]>;
type TabBarProps = Parameters<TabBarRenderProp>[0];

/**
 * Floating pill tab bar shared by the organizer, cashier, and usher tab
 * layouts, replacing the stock React Navigation bar (flush to the screen
 * edge, no motion beyond a tint-color swap). Each icon swaps to its filled
 * variant and bounces on focus (see the per-layout `focused ? "x" :
 * "x-outline"` icon functions), and tabs squash slightly on press — all
 * driven by the RN core `Animated` API since the project has no
 * react-native-reanimated dependency.
 *
 * Renders as an absolutely-positioned overlay rather than a docked bar, so
 * content actually scrolls underneath it instead of stopping above a
 * solid-colored strip. `pointerEvents="box-none"` on the outer wrap lets
 * touches over its transparent margins fall through to that content — only
 * the pill itself is touchable. Each Tabs layout reports the measured
 * height back out (see TabBarHeightProvider) and feeds it into
 * `sceneStyle.paddingBottom` so scrollable content still has somewhere to
 * land above the bar instead of hiding behind it.
 */
export function TabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reportHeight = useReportTabBarHeight();

  const focusAnims = useRef(new Map<string, Animated.Value>()).current;
  const pressAnims = useRef(new Map<string, Animated.Value>()).current;

  const getFocusAnim = (key: string) => {
    let value = focusAnims.get(key);
    if (!value) {
      value = new Animated.Value(0);
      focusAnims.set(key, value);
    }
    return value;
  };
  const getPressAnim = (key: string) => {
    let value = pressAnims.get(key);
    if (!value) {
      value = new Animated.Value(1);
      pressAnims.set(key, value);
    }
    return value;
  };

  useEffect(() => {
    state.routes.forEach((route, index) => {
      Animated.spring(getFocusAnim(route.key), {
        toValue: index === state.index ? 1 : 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 260,
        mass: 0.7,
      }).start();
    });
    // getFocusAnim reads a ref map, not component state — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.routes]);

  return (
    <View
      pointerEvents="box-none"
      onLayout={(e) => reportHeight?.(e.nativeEvent.layout.height)}
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.bar}>
        <View style={styles.content}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = state.index === index;
            const focusAnim = getFocusAnim(route.key);
            const pressAnim = getPressAnim(route.key);
            const iconColor = isFocused ? accentAlt(colors) : colors.textMuted;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync().catch(() => {});
                }
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            const onPressIn = () => {
              Animated.spring(pressAnim, {
                toValue: 0.92,
                useNativeDriver: true,
                speed: 40,
                bounciness: 0,
              }).start();
            };
            const onPressOut = () => {
              Animated.spring(pressAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 8,
              }).start();
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.tabItem}
              >
                <Animated.View style={[styles.tabContent, { transform: [{ scale: pressAnim }] }]}>
                  <Animated.View
                    style={{
                      transform: [
                        { scale: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                        { translateY: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
                      ],
                    }}
                  >
                    {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 21 })}
                  </Animated.View>
                  <Text
                    style={[
                      styles.label,
                      { color: iconColor, fontFamily: isFocused ? fonts.bodyBold : fonts.bodyMedium },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    bar: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
      // Light mode only — a black-tinted drop shadow just reads as a smudge
      // on the true-black dark page, so dark mode skips it and leans on the
      // bar's own border instead.
      ...(isDarkTheme(colors)
        ? null
        : {
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }),
    },
    content: {
      flex: 1,
      flexDirection: "row",
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 2,
    },
    tabContent: {
      alignItems: "center",
      gap: 3,
      maxWidth: "100%",
    },
    label: {
      fontSize: 11,
      maxWidth: "100%",
    },
  });
