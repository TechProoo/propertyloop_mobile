import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const BACKGROUND = "#071c12";
const EMERALD = "#39d98a";
const BAR_WIDTH = 148;
const BAR_SEGMENT_WIDTH = 48;
// This transparent adaptive-icon export includes safe-zone padding. At 175 px
// its visible artwork matches the previous 132 px app-icon presentation.
const MARK_CANVAS_SIZE = 175;

// A short minimum keeps the transition intentional without making a fast
// session bootstrap feel artificially slow.
const MIN_VISIBLE_MS = 700;

export function AppLaunchScreen({
  authReady,
  onDone,
}: {
  authReady: boolean;
  onDone: () => void;
}) {
  const entrance = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const progressLoop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1350,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    Animated.timing(entrance, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    progressLoop.start();

    return () => progressLoop.stop();
  }, [entrance, progress]);

  useEffect(() => {
    if (!authReady) return;

    const remaining = Math.max(
      0,
      MIN_VISIBLE_MS - (Date.now() - startedAt.current),
    );
    const timeout = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDoneRef.current();
      });
    }, remaining);

    return () => clearTimeout(timeout);
  }, [authReady, exit]);

  const contentStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
      {
        scale: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };

  const overlayStyle = {
    opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      {
        scale: exit.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.015],
        }),
      },
    ],
  };

  const progressStyle = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-BAR_SEGMENT_WIDTH, BAR_WIDTH],
        }),
      },
    ],
  };

  return (
    <Animated.View
      accessibilityViewIsModal
      style={[styles.overlay, overlayStyle]}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0b2f20", BACKGROUND, "#04100a"]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />

      <Animated.View style={[styles.brand, contentStyle]}>
        <Image
          source={require("../../assets/images/adaptive-foreground.png")}
          style={styles.mark}
          contentFit="contain"
          transition={0}
        />

        <View style={styles.wordmark}>
          <Text style={styles.wordmarkPrimary}>property</Text>
          <Text style={styles.wordmarkAccent}>loop</Text>
        </View>

        <Text style={styles.tagline}>
          Own your space. Power your property search.
        </Text>

        <View
          accessibilityLabel="Loading PropertyLoop"
          accessibilityRole="progressbar"
          style={styles.progressTrack}
        >
          <Animated.View style={[styles.progressSegment, progressStyle]} />
        </View>
      </Animated.View>

      <Text style={styles.footer}>PROPERTYLOOP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: BACKGROUND,
  },
  ambientTop: {
    position: "absolute",
    top: -180,
    right: -150,
    width: 410,
    height: 410,
    borderRadius: 205,
    borderWidth: 1,
    borderColor: "rgba(57, 217, 138, 0.07)",
  },
  ambientBottom: {
    position: "absolute",
    bottom: -280,
    left: -220,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: "rgba(31, 111, 67, 0.08)",
  },
  brand: {
    position: "absolute",
    top: "50%",
    width: "100%",
    marginTop: -(MARK_CANVAS_SIZE / 2),
    alignItems: "center",
  },
  mark: {
    width: MARK_CANVAS_SIZE,
    height: MARK_CANVAS_SIZE,
    marginBottom: 24,
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  wordmarkPrimary: {
    color: "#f7f5ef",
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -1.2,
  },
  wordmarkAccent: {
    color: EMERALD,
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -1.2,
  },
  tagline: {
    marginTop: 10,
    color: "rgba(247, 245, 239, 0.56)",
    fontFamily: "Inter_500Medium",
    fontSize: 10.5,
    letterSpacing: 0.25,
  },
  progressTrack: {
    width: BAR_WIDTH,
    height: 2,
    marginTop: 44,
    borderRadius: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressSegment: {
    width: BAR_SEGMENT_WIDTH,
    height: 2,
    borderRadius: 1,
    backgroundColor: EMERALD,
  },
  footer: {
    position: "absolute",
    bottom: 34,
    color: "rgba(247, 245, 239, 0.24)",
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 2.6,
  },
});
