// ─────────────────────────────────────────────────────────────────────────
// In-view reveal — cards fade + rise as they scroll into the viewport, instead
// of all animating at mount. Scroll-driven and fully on the UI thread: a
// <RevealScrollView> publishes its live scroll offset, and each <Reveal> child
// measures its own on-screen position every scroll frame and animates itself in
// the first time it crosses into view.
//
// Usage — swap the screen's <ScrollView> for <RevealScrollView> and wrap each
// card in <Reveal> (carry layout-critical width/flex on the Reveal's `style`):
//
//   <RevealScrollView>
//     {items.map((it) => (
//       <Reveal key={it.id} style={{ width: "47.5%" }}>
//         <Card item={it} />
//       </Reveal>
//     ))}
//   </RevealScrollView>
//
// Used outside a RevealScrollView it degrades gracefully to a one-shot
// reveal-on-mount, so it's always safe to drop in.
// ─────────────────────────────────────────────────────────────────────────
import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import {
  useWindowDimensions,
  type ScrollViewProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  measure,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedRef,
  type SharedValue,
} from "react-native-reanimated";

const ScrollCtx = createContext<SharedValue<number> | null>(null);

/**
 * Drop-in replacement for <ScrollView> that drives <Reveal> children. Forwards
 * every ScrollView prop; just renames the component.
 */
export function RevealScrollView({
  children,
  ...props
}: ScrollViewProps & { children: ReactNode }) {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  return (
    <ScrollCtx.Provider value={scrollY}>
      <Animated.ScrollView {...props} onScroll={onScroll} scrollEventThrottle={16}>
        {children}
      </Animated.ScrollView>
    </ScrollCtx.Provider>
  );
}

// Reveal an item once its top edge rises above `threshold` of the screen
// height (0.88 → starts animating just before fully on-screen). Runs on the UI
// thread; bails until `measure` returns a real frame (null during layout).
function applyReveal(
  ref: AnimatedRef<Animated.View>,
  shown: SharedValue<number>,
  winH: number,
  threshold: number,
  duration: number,
) {
  "worklet";
  const m = measure(ref);
  if (m == null) return;
  const inView = m.pageY < winH * threshold && m.pageY + m.height > 0;
  if (inView && shown.value < 1) {
    shown.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }
}

/**
 * Wraps a card so it fades + rises in the moment it scrolls into view. `style`
 * is applied to the wrapper (put width/flex here). `distance` is the rise in px.
 */
export function Reveal({
  children,
  style,
  distance = 26,
  threshold = 0.88,
  duration = 520,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  distance?: number;
  threshold?: number;
  duration?: number;
}) {
  const scrollY = useContext(ScrollCtx);
  const ref = useAnimatedRef<Animated.View>();
  const shown = useSharedValue(0);
  const { height: winH } = useWindowDimensions();

  // Re-check on every scroll frame.
  useAnimatedReaction(
    () => scrollY?.value ?? 0,
    () => applyReveal(ref, shown, winH, threshold, duration),
  );

  // Initial check for items already on screen (and a short retry — `measure`
  // can return null on the very first frame on Android).
  useEffect(() => {
    runOnUI(applyReveal)(ref, shown, winH, threshold, duration);
    const t = setTimeout(
      () => runOnUI(applyReveal)(ref, shown, winH, threshold, duration),
      90,
    );
    return () => clearTimeout(t);
  }, [ref, shown, winH, threshold, duration]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * distance }],
  }));

  return (
    <Animated.View ref={ref} style={[style, aStyle]}>
      {children}
    </Animated.View>
  );
}
