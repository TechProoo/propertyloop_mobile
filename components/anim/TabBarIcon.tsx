// Animated bottom-tab icon. On focus the glyph springs up a touch and lifts —
// a small, premium "you are here" beat that the static outline→filled swap was
// missing. Shared by all three tab bars (buyer / agent / vendor) so the chrome
// feels identical across roles.
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function TabBarIcon({
  focused,
  color,
  name,
  size = 23,
}: {
  focused: boolean;
  color: string;
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
}) {
  const f = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    f.value = withSpring(focused ? 1 : 0, { damping: 13, stiffness: 230, mass: 0.7 });
  }, [focused, f]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + f.value * 0.14 },
      { translateY: -f.value * 2.5 },
    ],
  }));

  return (
    <Animated.View style={iconStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
