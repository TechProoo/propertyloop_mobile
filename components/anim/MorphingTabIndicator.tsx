// Morphing bottom-tab indicator — a thin pill that springs horizontally to sit
// above the active tab. Rendered as a sibling overlay on top of <Tabs> (never
// as a child of the navigator, which only accepts Screens), so it leaves the
// real tab bar — its haptics, blur and geometry — completely untouched.
//
// The active index is driven by the router (see each tab _layout), so the pill
// follows real navigation: tab taps, deep links and programmatic navigation
// all move it. Movement uses the shared SPRING for the app's signature feel.
import { useEffect } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SPRING } from "./motion";

export function MorphingTabIndicator({
  activeIndex,
  tabCount,
  bottom,
  color = "#1f6f43",
  segmentWidth = 26,
  height = 3,
}: {
  /** Index of the focused tab (0-based). */
  activeIndex: number;
  /** Total number of tabs. */
  tabCount: number;
  /** Distance from the screen bottom to the indicator, in px. Align this with
   *  the top edge of the tab bar (tabBarHeight - height). */
  bottom: number;
  color?: string;
  /** Width of the visible pill (centred within each tab slot). */
  segmentWidth?: number;
  height?: number;
}) {
  const { width } = useWindowDimensions();
  const tabWidth = width / tabCount;
  const x = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    x.value = withSpring(activeIndex * tabWidth, SPRING);
  }, [activeIndex, tabWidth, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, bottom, height }}
    >
      <Animated.View style={[{ width: tabWidth, alignItems: "center" }, style]}>
        <View
          style={{
            width: segmentWidth,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          }}
        />
      </Animated.View>
    </View>
  );
}
