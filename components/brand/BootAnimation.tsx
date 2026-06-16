// Full-screen brand boot animation shown on cold start, over a deep-forest
// gradient. The hero is the PropertyLoop metaphor made literal: a glowing
// emerald comet traces a ring — "closing the loop" — while the wordmark
// springs in beneath it. It hands off seamlessly from the native splash
// (same dark field, no flash) and fades/lifts away the moment the session
// resolves, revealing whatever screen routing lands on.
//
// Built on the RN Animated API with the native driver (same approach as
// Skeleton/BouncyLoader), so it runs off the JS thread and stays smooth
// even while the auth bootstrap is doing network work.
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const EMERALD = "#34d27b"; // brighter than brand #1f6f43 so it glows on dark
const EMERALD_DEEP = "#1f6f43";

const RING_R = 52; // ring radius
const DOTS = 14; // comet trail resolution
const DOT = 9;

// Minimum on-screen time so the animation always reads as intentional, even
// when the session resolves in a few hundred ms on a warm start.
const MIN_VISIBLE_MS = 1800;

export function BootAnimation({
  authReady,
  onDone,
}: {
  authReady: boolean;
  onDone: () => void;
}) {
  const spin = useRef(new Animated.Value(0)).current; // ring rotation (loops)
  const enter = useRef(new Animated.Value(0)).current; // wordmark/tagline entrance
  const exit = useRef(new Animated.Value(0)).current; // 0 = held, 1 = dismissed
  const startRef = useRef(0);

  // Kick off the looping comet + the one-shot entrance.
  useEffect(() => {
    startRef.current = Date.now();

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();

    Animated.timing(enter, {
      toValue: 1,
      duration: 720,
      delay: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => loop.stop();
  }, [enter, spin]);

  // Once the session resolves (and the minimum beat has elapsed), lift + fade
  // the whole overlay away, then unmount via onDone.
  useEffect(() => {
    if (!authReady) return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startRef.current));
    const id = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 1,
        duration: 520,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && onDone());
    }, wait);
    return () => clearTimeout(id);
  }, [authReady, exit, onDone]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Overlay-level exit: fade out while lifting and gently scaling up.
  const overlayStyle = {
    opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
      {
        translateY: exit.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }),
      },
    ],
  };

  // Entrance: rise + scale + fade for the brand block.
  const enterStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
      <LinearGradient
        colors={["#0b2a1b", "#06160d", "#040d08"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        {/* Loop: soft halo + faint guide ring + rotating comet trail */}
        <View style={styles.ringWrap}>
          <View style={styles.halo} />
          <View style={styles.guide} />
          <Animated.View
            style={[styles.ring, { transform: [{ rotate }] }]}
          >
            {Array.from({ length: DOTS }).map((_, i) => {
              const angle = (360 / DOTS) * i;
              // Comet tail: head (i=0) brightest, fading around the loop.
              const opacity = 1 - (i / DOTS) * 0.86;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      opacity,
                      transform: [
                        { rotate: `${angle}deg` },
                        { translateY: -RING_R },
                      ],
                    },
                  ]}
                />
              );
            })}
          </Animated.View>
        </View>

        {/* Brand block */}
        <Animated.View style={[styles.brand, enterStyle]}>
          <View style={styles.wordmark}>
            <Text style={[styles.word, { color: "#f4f1ea" }]}>property</Text>
            <Text style={[styles.word, { color: EMERALD }]}>loop</Text>
          </View>
          <Text style={styles.tagline}>Closing the loop</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  ringWrap: {
    width: RING_R * 2,
    height: RING_R * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: RING_R * 2.6,
    height: RING_R * 2.6,
    borderRadius: RING_R * 1.3,
    backgroundColor: EMERALD_DEEP,
    opacity: 0.14,
  },
  guide: {
    position: "absolute",
    width: RING_R * 2,
    height: RING_R * 2,
    borderRadius: RING_R,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  ring: {
    width: RING_R * 2,
    height: RING_R * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    left: RING_R - DOT / 2,
    top: RING_R - DOT / 2,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: EMERALD,
  },
  brand: { marginTop: 44, alignItems: "center" },
  wordmark: { flexDirection: "row", alignItems: "baseline" },
  word: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.6 },
  tagline: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "rgba(244,241,234,0.55)",
    marginTop: 14,
  },
});
