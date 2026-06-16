// Bouncy three-dot loader shown app-wide wherever something is loading.
// Designed as a drop-in for React Native's <ActivityIndicator />: it accepts
// the same `color` and `size` ("small" | "large" | number) props so existing
// call-sites swap over cleanly. Built on the RN Animated API (native driver),
// matching the approach already used by Skeleton.
import { useEffect, useRef } from "react";
import { Animated, Easing, View, type ViewStyle } from "react-native";

const PRIMARY = "#1f6f43";

export function BouncyLoader({
  color = PRIMARY,
  size = "small",
  style,
}: {
  color?: string;
  size?: "small" | "large" | number;
  style?: ViewStyle | ViewStyle[];
}) {
  const dot = typeof size === "number" ? Math.max(4, size / 4) : size === "large" ? 11 : 8;
  const gap = dot * 0.6;
  const travel = dot * 1.15;

  const a0 = useRef(new Animated.Value(0)).current;
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Each dot runs a fixed 1200ms cycle; staggered start delays create the wave.
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ]),
      );
    const anims = [make(a0, 0), make(a1, 150), make(a2, 300)];
    anims.forEach((x) => x.start());
    return () => anims.forEach((x) => x.stop());
  }, [a0, a1, a2]);

  const dotStyle = (v: Animated.Value) => ({
    width: dot,
    height: dot,
    borderRadius: dot / 2,
    backgroundColor: color,
    marginHorizontal: gap / 2,
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -travel],
        }),
      },
    ],
  });

  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "flex-end", height: dot + travel },
        style,
      ]}
    >
      <Animated.View style={dotStyle(a0)} />
      <Animated.View style={dotStyle(a1)} />
      <Animated.View style={dotStyle(a2)} />
    </View>
  );
}
