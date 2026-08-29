// Cinematic site-works gallery for the Facility Management screen.
//
// The frames are streamed from the website (propertyloop.ng/ultramodern/…)
// rather than bundled, for the same reason as the home-screen promo reel: a
// couple of megabytes of photography in the update payload means every user
// re-downloads it on every EAS update, and adds the same weight to the store
// binary. expo-image caches to disk, so it's a one-time fetch per device.
//
// One frame holds the stage at a time with a slow Ken Burns push and a
// cross-fade; a filmstrip underneath scrolls every frame and jumps the stage on
// tap. Autoplay is paused while the user is dragging the strip, and the whole
// thing degrades to a plain image if the network is slow — the caption is real
// text, not baked into the picture.
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { PhotoViewer } from "@/components/PhotoViewer";
import { tapLight } from "@/lib/haptics";

const PRIMARY = "#1f6f43";

const CDN = "https://propertyloop.ng/ultramodern";
const SCREEN_W = Dimensions.get("window").width;
const STAGE_H = Math.round(SCREEN_W * 0.86);
const SLIDE_MS = 5200;

type Frame = { file: string; title: string; place: string; note: string };

const PLANT = "Dangote Fertilizer · Ibeju-Lekki";

const FRAMES: Frame[] = [
  {
    file: "um-11.jpeg",
    title: "Central Control Room",
    place: PLANT,
    note: "Air-cooled chiller bank against the CCR — the building the plant is run from.",
  },
  {
    file: "um-09.jpeg",
    title: "Laboratory Block",
    place: PLANT,
    note: "Chilled water plant outside the laboratory, caged and serviceable from the yard.",
  },
  {
    file: "um-07.jpeg",
    title: "The Workshop",
    place: PLANT,
    note: "A wall of split units feeding the workshop, with the team on inspection.",
  },
  {
    file: "um-08.jpeg",
    title: "Substation 1",
    place: PLANT,
    note: "HVAC and fire systems keeping the switchgear inside SS1 within temperature.",
  },
  {
    file: "um-17.jpeg",
    title: "CCR Chiller Yard",
    place: PLANT,
    note: "Packaged chillers in the control-room yard — the plant's cooling backbone.",
  },
  {
    file: "um-20.jpeg",
    title: "Substation 2 Rooftop",
    place: PLANT,
    note: "Rooftop air handling units at SS2, with the refinery skyline behind.",
  },
  {
    file: "um-15.jpeg",
    title: "SS1 Air Ducts",
    place: PLANT,
    note: "Insulated supply ducting threaded through Substation 1.",
  },
  {
    file: "um-28.jpeg",
    title: "Chilled Water Plant",
    place: PLANT,
    note: "Pumps, expansion vessels and headers on a chilled water circuit.",
  },
  {
    file: "um-31.jpeg",
    title: "Air & Water Pump Skid",
    place: PLANT,
    note: "HVAC air and water pump system, pipework colour-coded and labelled.",
  },
  {
    file: "um-30.jpeg",
    title: "Industrial Install",
    place: PLANT,
    note: "Chilled water pipework and ducting going in overhead.",
  },
  {
    file: "um-26.jpeg",
    title: "Technical Building",
    place: PLANT,
    note: "The fertilizer technical building, served end to end by Ultramodern.",
  },
  {
    file: "um-33.jpeg",
    title: "Monitoring & Maintenance",
    place: PLANT,
    note: "Routine monitoring on a running unit — the maintenance contract in practice.",
  },
];

const URLS = FRAMES.map((f) => `${CDN}/${f.file}`);

export function FacilityGallery() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const stripRef = useRef<ScrollView>(null);
  const zoom = useSharedValue(1);

  const active = FRAMES[index];

  // Ken Burns: a slow push that restarts with each frame. Reanimated drives it
  // on the UI thread, so it keeps moving while JS is busy decoding the image.
  useEffect(() => {
    cancelAnimation(zoom);
    zoom.value = 1;
    zoom.value = withTiming(1.1, {
      duration: SLIDE_MS + 1400,
      easing: Easing.out(Easing.quad),
    });
    return () => cancelAnimation(zoom);
  }, [index, zoom]);

  const kenBurns = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.value }],
  }));

  const go = useCallback((next: number) => {
    const n = (next + FRAMES.length) % FRAMES.length;
    setIndex(n);
    // Keep the tapped/advanced thumbnail near the middle of the strip.
    stripRef.current?.scrollTo({
      x: Math.max(0, n * 104 - SCREEN_W / 2 + 52),
      animated: true,
    });
  }, []);

  useEffect(() => {
    if (paused || viewerAt !== null) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, viewerAt, go]);

  // The frames live on the website, so a stale deploy or a dead connection
  // means no pictures. Drop the whole section rather than show empty slots —
  // same call the home-screen promo reel makes. The screen's copy stands alone.
  if (failed) return null;

  return (
    <View>
      <Text
        className="text-[11px] font-sans-bold text-primary tracking-widest uppercase mt-8"
        style={{ letterSpacing: 1.2 }}
      >
        From the field
      </Text>
      <Text className="text-[12.5px] text-ink-2 mt-1 mb-3 leading-5">
        Plant rooms, chiller yards and risers photographed on live sites.
      </Text>

      {/* Stage */}
      <View
        className="rounded-3xl overflow-hidden bg-ink"
        style={{ height: STAGE_H }}
      >
        <Pressable
          onPress={() => {
            tapLight();
            setViewerAt(index);
          }}
          accessibilityRole="imagebutton"
          accessibilityLabel={`${active.title}. ${active.note} Tap to view full screen.`}
          style={{ flex: 1 }}
        >
          <Animated.View style={[{ flex: 1 }, kenBurns]}>
            <Image
              source={URLS[index]}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              // Cross-dissolve between frames. Deliberately no recyclingKey:
              // changing it blanks the view before the next image loads, which
              // would replace the dissolve with a flash of empty stage.
              transition={700}
              cachePolicy="memory-disk"
              onError={() => setFailed(true)}
            />
          </Animated.View>

          {/* Grade — bottom for the caption, top for the counter */}
          <LinearGradient
            colors={["rgba(26,33,32,0.55)", "transparent", "rgba(26,33,32,0.92)"]}
            locations={[0, 0.4, 1]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            pointerEvents="none"
          />

          {/* Counter */}
          <View
            className="absolute top-3.5 right-3.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <Text className="text-white font-sans-bold text-[11px]">
              {String(index + 1).padStart(2, "0")} / {FRAMES.length}
            </Text>
          </View>

          {/* Caption */}
          <View className="absolute left-4 right-4 bottom-4">
            <Text
              className="text-[10px] font-sans-bold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              {active.place}
            </Text>
            <Text
              className="font-serif text-white mt-1"
              style={{ fontSize: 24, letterSpacing: -0.4, lineHeight: 27 }}
            >
              {active.title}
            </Text>
            <Text
              className="text-[12px] mt-1.5 leading-4"
              style={{ color: "rgba(255,255,255,0.78)" }}
              numberOfLines={2}
            >
              {active.note}
            </Text>
          </View>
        </Pressable>

        {/* Prev / next */}
        <View className="absolute left-3.5 bottom-28 flex-row gap-2">
          {(
            [
              { dir: -1, icon: "chevron-back" as const, label: "Previous frame" },
              { dir: 1, icon: "chevron-forward" as const, label: "Next frame" },
            ]
          ).map((b) => (
            <Pressable
              key={b.icon}
              onPress={() => {
                tapLight();
                go(index + b.dir);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={b.label}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Ionicons name={b.icon} size={16} color="#ffffff" />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Filmstrip */}
      <ScrollView
        ref={stripRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setPaused(true)}
        onMomentumScrollEnd={() => setPaused(false)}
        onScrollEndDrag={() => setPaused(false)}
        contentContainerStyle={{ gap: 8, paddingVertical: 10, paddingRight: 8 }}
        className="mt-1"
      >
        {FRAMES.map((f, i) => {
          const on = i === index;
          return (
            <Pressable
              key={f.file}
              onPress={() => {
                tapLight();
                go(i);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Show ${f.title}`}
              className="rounded-2xl overflow-hidden"
              style={{
                width: 96,
                height: 68,
                opacity: on ? 1 : 0.55,
                borderWidth: on ? 2 : 0,
                borderColor: PRIMARY,
              }}
            >
              <Image
                source={URLS[i]}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={220}
                cachePolicy="disk"
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <Text className="text-[11px] text-ink-3 mt-0.5">
        Tap any frame to open it full screen.
      </Text>

      <PhotoViewer
        visible={viewerAt !== null}
        images={URLS}
        initialIndex={viewerAt ?? 0}
        onClose={() => setViewerAt(null)}
      />
    </View>
  );
}
