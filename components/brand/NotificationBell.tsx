// Animated notification bell — a tappable bell that "rings" and shows a live
// unread-count badge. When there are unread notifications the icon gives a
// periodic gentle ring, a soft halo pulses behind it, and the count badge pops
// in with a spring. Drop it anywhere a bell is needed (agent/buyer/vendor home
// headers) and feed it a `count`.
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export function NotificationBell({
  count = 0,
  onPress,
  size = 42,
  iconSize = 19,
  iconColor = "#ffffff",
  bgColor = "rgba(255,255,255,0.16)",
  badgeColor = "#e5484d",
  badgeTextColor = "#ffffff",
  badgeBorderColor = "#1f6f43",
}: {
  count?: number;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  bgColor?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  /** Match the surface behind the bell so the badge ring reads as a cut-out. */
  badgeBorderColor?: string;
}) {
  const has = count > 0;

  const ring = useSharedValue(0); // bell rotation, periodic
  const halo = useSharedValue(0); // pulsing ring behind the bell
  const pop = useSharedValue(has ? 1 : 0); // badge entrance

  useEffect(() => {
    if (has) {
      // Halo: a single loop that scales out while fading — a quiet "live" pulse.
      halo.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      // Bell ring: a short shake every couple of seconds, not a constant jitter.
      ring.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 2200 }),
          withTiming(-1, { duration: 70 }),
          withTiming(1, { duration: 110 }),
          withTiming(-0.7, { duration: 100 }),
          withTiming(0.4, { duration: 90 }),
          withTiming(0, { duration: 70 }),
        ),
        -1,
        false,
      );
      pop.value = withDelay(60, withSpring(1, { damping: 11, stiffness: 320 }));
    } else {
      halo.value = 0;
      ring.value = 0;
      pop.value = withTiming(0, { duration: 150 });
    }
  }, [has, count]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring.value * 12}deg` }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(halo.value, [0, 0.15, 1], [0, 0.35, 0]),
    transform: [{ scale: interpolate(halo.value, [0, 1], [0.6, 1.55]) }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: pop.value }],
  }));

  return (
    <Pressable onPress={onPress} hitSlop={6} style={{ width: size, height: size }}>
      {/* Pulsing halo */}
      {has ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: badgeColor,
            },
            haloStyle,
          ]}
        />
      ) : null}

      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View style={bellStyle}>
          <Ionicons
            name={has ? "notifications" : "notifications-outline"}
            size={iconSize}
            color={iconColor}
          />
        </Animated.View>
      </View>

      {/* Count badge */}
      {has ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 19,
              height: 19,
              paddingHorizontal: 4,
              borderRadius: 9.5,
              backgroundColor: badgeColor,
              borderWidth: 2,
              borderColor: badgeBorderColor,
              alignItems: "center",
              justifyContent: "center",
            },
            badgeStyle,
          ]}
        >
          <Text
            style={{
              color: badgeTextColor,
              fontSize: 10,
              fontFamily: "Inter_700Bold",
              lineHeight: 13,
            }}
          >
            {count > 9 ? "9+" : count}
          </Text>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}
