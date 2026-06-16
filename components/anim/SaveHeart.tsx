// Animated save/favourite heart. On save it does the now-familiar "pop":
// a quick over-scale that springs back, with a soft emerald ring burst —
// satisfying enough to make saving a listing feel like a tiny reward.
// On unsave it just eases back down, no fanfare.
//
// Wraps the shared favourites store so every heart in the app (home card,
// listing detail, saved tab) animates identically. Pass the listing id and
// it wires up toggle + state for you.
import { useEffect } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { toggleSaved, useIsSaved } from "@/lib/favourites";

const SAVED_COLOR = "#ff6b66";

export function SaveHeart({
  id,
  size = 16,
  color = "#ffffff",
  style,
  onToggle,
  hitSlop = 10,
}: {
  id: string;
  size?: number;
  /** Icon colour when *not* saved. Saved is always the warm coral. */
  color?: string;
  style?: ViewStyle | ViewStyle[];
  onToggle?: (nowSaved: boolean) => void;
  hitSlop?: number;
}) {
  const saved = useIsSaved(id);
  const scale = useSharedValue(1);
  const burst = useSharedValue(0); // 0 → 1 ring expansion on save

  // Replay the pop whenever this heart flips to saved (covers external
  // toggles too — e.g. saved on the detail screen, reflected on the card).
  useEffect(() => {
    if (saved) {
      scale.value = withSequence(
        withTiming(1.32, { duration: 130, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 9, stiffness: 240 }),
      );
      burst.value = 0;
      burst.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }
  }, [saved, scale, burst]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - burst.value) * 0.9,
    transform: [{ scale: 0.6 + burst.value * 1.4 }],
  }));

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        const next = toggleSaved(id);
        onToggle?.(next);
      }}
      hitSlop={hitSlop}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved" : "Save this home"}
      accessibilityState={{ selected: saved }}
    >
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Burst ring — only meaningful on save, harmless otherwise */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              width: size * 1.7,
              height: size * 1.7,
              borderRadius: size,
              borderWidth: 2,
              borderColor: SAVED_COLOR,
            },
            ringStyle,
          ]}
        />
        <Animated.View style={iconStyle}>
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={size}
            color={saved ? SAVED_COLOR : color}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}
