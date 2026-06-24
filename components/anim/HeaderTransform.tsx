import { useCallback, useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useSharedValue,
} from "react-native-reanimated";

export interface HeaderTransformProps {
  /** Scroll offset as shared value (connect to your scroll handler) */
  scrollOffset: Animated.Animated<number>;
  /** Pixel threshold at which transformation begins (e.g., 60) */
  collapsedAt?: number;
  /** Min height when fully collapsed */
  minHeight?: number;
  /** Max height when expanded */
  maxHeight?: number;
  /** Content to animate (greeting, cards, etc.) */
  children: ReactNode;
  /** Background color during transition */
  backgroundColor?: string;
}

/**
 * Scroll-driven header transformation. As user scrolls, the header collapses
 * and content fades/morphs. Use for dashboard greetings that need to compact
 * when the user starts scrolling down.
 */
export function HeaderTransform({
  scrollOffset,
  collapsedAt = 60,
  minHeight = 80,
  maxHeight = 140,
  children,
  backgroundColor = "#fffbf4",
}: HeaderTransformProps) {
  const animStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollOffset.value,
      [0, collapsedAt],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      height: interpolate(
        progress,
        [0, 1],
        [maxHeight, minHeight],
        Extrapolate.CLAMP
      ),
      opacity: interpolate(progress, [0, 1], [1, 0.8], Extrapolate.CLAMP),
    };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor,
          overflow: "hidden",
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Hook to create a scroll-driven transform effect. Pass the offset from your
 * FlatList/ScrollView scroll handler to get animated values.
 *
 * Usage:
 *   const { scrollOffset, handleScroll } = useHeaderTransform();
 *   <Animated.FlatList onScroll={handleScroll} ... />
 *   <HeaderTransform scrollOffset={scrollOffset} />
 */
export function useHeaderTransform() {
  const scrollOffset = useSharedValue(0);

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y;
  });

  return { scrollOffset, handleScroll };
}

/**
 * Content wrapper that fades elements in sequence as scroll progresses.
 * Use inside HeaderTransform to have cards fade away at different rates.
 */
export function HeaderFadeLayer({
  scrollOffset,
  collapsedAt = 60,
  children,
  layer = 0,
}: {
  scrollOffset: Animated.Animated<number>;
  collapsedAt?: number;
  children: ReactNode;
  /** 0 = fades first, higher numbers fade later */
  layer?: number;
}) {
  const layerOffset = layer * 15; // Each layer waits 15px before fading

  const fadeStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollOffset.value,
      [layerOffset, collapsedAt + layerOffset],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: progress,
    };
  });

  return <Animated.View style={fadeStyle}>{children}</Animated.View>;
}
