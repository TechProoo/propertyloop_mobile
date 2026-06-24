import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { SPRING } from "./motion";

export interface MorphingTabIndicatorProps {
  /** Currently active tab index */
  activeIndex: number;
  /** Total number of tabs */
  tabCount: number;
  /** Width of the entire tab bar (all tabs combined) */
  containerWidth: number;
  /** Color of the morphing indicator */
  color?: string;
  /** Height of the indicator bar */
  height?: number;
  /** Vertical position (bottom offset) */
  bottom?: number;
}

/**
 * Animated tab indicator that smoothly morphs position and width as the active
 * tab changes. Use with bottom tab navigation for a fluid, responsive feel.
 * Place this as an overlay on top of your tab bar.
 */
export function MorphingTabIndicator({
  activeIndex,
  tabCount,
  containerWidth,
  color = "#1f6f43",
  height = 3,
  bottom = 0,
}: MorphingTabIndicatorProps) {
  const tabWidth = containerWidth / tabCount;
  const translateX = useSharedValue(0);
  const indicatorWidth = useSharedValue(tabWidth);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * tabWidth, SPRING);
    indicatorWidth.value = withSpring(tabWidth, SPRING);
  }, [activeIndex, tabWidth, translateX, indicatorWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <View
      style={{
        position: "absolute",
        bottom,
        left: 0,
        height,
        width: containerWidth,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

/**
 * Pill-style morphing indicator for use with custom tab implementations.
 * Morphs between rounded pill shapes behind each tab.
 */
export function MorphingPillIndicator({
  activeIndex,
  tabCount,
  containerWidth,
  color = "#1f6f43",
  padding = 4,
}: MorphingTabIndicatorProps & { padding?: number }) {
  const tabWidth = containerWidth / tabCount;
  const pillWidth = tabWidth - padding * 2;
  const translateX = useSharedValue(padding);
  const indicatorWidth = useSharedValue(pillWidth);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * tabWidth + padding, SPRING);
    indicatorWidth.value = withSpring(pillWidth, SPRING);
  }, [activeIndex, tabWidth, pillWidth, padding, translateX, indicatorWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <View
      style={{
        position: "absolute",
        top: padding,
        left: 0,
        bottom: padding,
        width: containerWidth,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            backgroundColor: color,
            borderRadius: 12,
            opacity: 0.15,
          },
          animStyle,
        ]}
      />
    </View>
  );
}
