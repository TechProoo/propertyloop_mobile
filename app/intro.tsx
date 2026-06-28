import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Appear, PressableScale } from "@/components/anim";
import { tapMedium } from "@/lib/haptics";

type Slide = {
  eyebrow: string;
  titlePre: string;
  titleItalic: string;
  titlePost: string;
  subtitle: string;
  /** Either a local require() (number) or a remote URL string. */
  image: number | string;
  card: {
    initials: string;
    title: string;
    subtitle: string;
  };
};

const SLIDES: Slide[] = [
  {
    eyebrow: "01 · VERIFIED LISTINGS",
    titlePre: "Every home, ",
    titleItalic: "walked",
    titlePost: " in person.",
    subtitle:
      "Our inspectors visit each property before it's listed. No catfish, no surprises — just verified addresses, photos, and details.",
    image: require("@/assets/images/intro-verified.jpg"),
    card: {
      initials: "TI",
      title: "Tunde · PropertyLoop inspector",
      subtitle: "56 homes verified this month",
    },
  },
  {
    eyebrow: "02 · NO MIDDLEMEN",
    titlePre: "Talk to the ",
    titleItalic: "listing",
    titlePost: " agent.",
    subtitle:
      "Only PropertyLoop connects you directly to the person who knows the property best — the listing agent. No chain of calls, no runaround.",
    image: require("@/assets/images/intro-agent.jpg"),
    card: {
      initials: "AO",
      title: "Adaeze · KYC-verified agent",
      subtitle: "Replies within 1 hour",
    },
  },
  {
    eyebrow: "03 · PROPERTY LOGBOOK",
    titlePre: "Every repair, ",
    titleItalic: "every",
    titlePost: " record.",
    subtitle:
      "Each property carries a permanent digital logbook — maintenance, repairs, and services recorded with verified vendor details. Full history, full transparency.",
    image: require("@/assets/images/intro-logbook.jpg"),
    card: {
      initials: "EO",
      title: "Emeka · Verified electrician",
      subtitle: "Last service logged 2 days ago",
    },
  },
];

export default function IntroScreen() {
  const [page, setPage] = useState(0);
  const slide = SLIDES[page];
  const isLast = page === SLIDES.length - 1;

  const handleContinue = () => {
    if (isLast) {
      router.push("/role-select" as Href);
    } else {
      setPage(page + 1);
    }
  };

  // Skip the intro slides → go straight to role selection (which leads into
  // sign-up). It must NOT jump into "/(tabs)": that's the authed home and an
  // unauthenticated user landing there crashes on the first authed API call.
  const handleSkip = () => router.push("/role-select" as Href);

  const onContinue = () => {
    tapMedium();
    handleContinue();
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Top bar — logo left, Skip right */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 120, height: 48 }}
            contentFit="contain"
          />
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text className="text-ink-2 text-sm font-sans-medium">Skip</Text>
          </Pressable>
        </View>

        {/* Image card with floating inspector overlay — re-animates per slide */}
        <Appear key={`img-${page}`} from="fade" duration={420}>
        <View className="px-5 mt-4">
          <View className="rounded-3xl overflow-hidden bg-stone-200">
            <Image
              source={slide.image}
              style={{ width: "100%", height: 380 }}
              contentFit="cover"
              transition={250}
            />
          </View>

          {/* Floating inspector card — sits below the image, overlapping */}
          <View className="absolute left-8 right-8 bottom-4 bg-white rounded-2xl px-3 py-2.5 flex-row items-center gap-2.5 shadow-md">
            <View className="w-9 h-9 rounded-full bg-primary-soft items-center justify-center">
              <Text className="text-primary-ink font-sans-bold text-xs">
                {slide.card.initials}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-ink text-xs font-sans-semibold"
                numberOfLines={1}
              >
                {slide.card.title}
              </Text>
              <Text className="text-ink-3 text-[11px] mt-0.5" numberOfLines={1}>
                {slide.card.subtitle}
              </Text>
            </View>
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-xs font-sans-bold">✓</Text>
            </View>
          </View>
        </View>
        </Appear>

        {/* Copy block — re-animates per slide, cascading after the image */}
        <Appear key={`copy-${page}`} delay={90}>
        <View className="px-5 mt-8">
          <Text className="text-primary text-[11px] font-sans-bold tracking-[1.5px]">
            {slide.eyebrow}
          </Text>
          <Text className="text-ink font-serif text-[2rem] leading-[38px] mt-3">
            {slide.titlePre}
            <Text className="font-serif-italic">{slide.titleItalic}</Text>
            {slide.titlePost}
          </Text>
          <Text className="text-ink-3 text-sm leading-6 mt-4">
            {slide.subtitle}
          </Text>
        </View>
        </Appear>

        {/* Bottom row — animated page dots + Continue */}
        <View className="flex-1" />
        <View className="px-5 pb-2 flex-row items-center justify-between">
          <Dots count={SLIDES.length} active={page} />
          <PressableScale
            onPress={onContinue}
            className="bg-primary rounded-full pl-6 pr-5 py-3 flex-row items-center gap-2"
          >
            <Text className="text-white font-sans-semibold text-base">
              {isLast ? "Get started" : "Continue"}
            </Text>
            <Text className="text-white text-base">›</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Pagination dots — the active dot stretches into an emerald pill on a spring
// as you move between slides; the others stay small and grey.
function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} on={i === active} />
      ))}
    </View>
  );
}

function Dot({ on }: { on: boolean }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.value = withSpring(on ? 1 : 0, { damping: 16, stiffness: 200 });
  }, [on, v]);
  const style = useAnimatedStyle(() => ({
    width: 6 + v.value * 16,
    backgroundColor: v.value > 0.5 ? "#1f6f43" : "#d8d2c8",
  }));
  return <Animated.View style={[{ height: 6, borderRadius: 3 }, style]} />;
}
