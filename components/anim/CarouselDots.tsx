import { View } from "react-native";
import Animated, { useAnimatedStyle, interpolate, Extrapolate } from "react-native-reanimated";

export interface CarouselDotsProps {
  /** Current scroll position as a shared value */
  scrollPosition: Animated.Animated<number>;
  /** Total number of items in the carousel */
  itemCount: number;
  /** Width of each carousel item (used to calculate position) */
  itemWidth: number;
  /** Color of active dot */
  activeColor?: string;
  /** Color of inactive dots */
  inactiveColor?: string;
  /** Size of each dot */
  dotSize?: number;
  /** Gap between dots */
  gap?: number;
}

/**
 * Animated dot indicators for a carousel. Responds to scroll position
 * to show which item is currently visible. Dots scale and fade based on proximity.
 */
export function CarouselDots({
  scrollPosition,
  itemCount,
  itemWidth,
  activeColor = "#1f6f43",
  inactiveColor = "#e1dcd3",
  dotSize = 8,
  gap = 6,
}: CarouselDotsProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap,
      }}
    >
      {Array.from({ length: itemCount }).map((_, i) => (
        <DotIndicator
          key={i}
          index={i}
          scrollPosition={scrollPosition}
          itemWidth={itemWidth}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          dotSize={dotSize}
        />
      ))}
    </View>
  );
}

function DotIndicator({
  index,
  scrollPosition,
  itemWidth,
  activeColor,
  inactiveColor,
  dotSize,
}: {
  index: number;
  scrollPosition: Animated.Animated<number>;
  itemWidth: number;
  activeColor: string;
  inactiveColor: string;
  dotSize: number;
}) {
  const animStyle = useAnimatedStyle(() => {
    const position = scrollPosition.value / itemWidth;
    const distance = Math.abs(position - index);

    // Fade: dots closest to current position are fully opaque
    const opacity = interpolate(distance, [0, 1.5], [1, 0.4], Extrapolate.CLAMP);

    // Scale: active dot scales up slightly
    const scale = interpolate(distance, [0, 1], [1.2, 0.8], Extrapolate.CLAMP);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: inactiveColor,
        },
        animStyle,
      ]}
    />
  );
}
