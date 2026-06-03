// Content-aware loading placeholder. A softly pulsing block (cream-2) that
// the Home screen stacks into card-shaped scaffolds while the first paint
// settles — replaces the bare spinner the brief flagged as a known gap.
import { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";

export function Skeleton({
  style,
  radius = 12,
}: {
  style?: ViewStyle | ViewStyle[];
  radius?: number;
}) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: "#ece6df", borderRadius: radius, opacity }, style]}
    />
  );
}
