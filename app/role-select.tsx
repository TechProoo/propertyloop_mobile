import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { Appear, PressableScale, stagger } from "@/components/anim";
import { tapSelection, tapMedium } from "@/lib/haptics";

type Role = "BUYER" | "AGENT" | "VENDOR";

type RoleCard = {
  id: Role;
  badge: string;
  badgeTone: "emerald" | "slate" | "amber";
  iconBg: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  desc: string;
  chips: string[];
  /** Optional footnote shown below the chips (e.g. KYC requirement). */
  footnote?: string;
  /** What the bottom CTA reads when this role is selected. */
  ctaLabel: string;
};

const CARDS: RoleCard[] = [
  {
    id: "BUYER",
    badge: "BUYER · RENTER",
    badgeTone: "emerald",
    iconBg: "bg-primary-soft",
    iconName: "key-outline",
    iconColor: "#1f6f43", // emerald-700
    title: "I'm looking for a home",
    desc: "Search verified listings, save favourites, make offers, and book viewings.",
    chips: ["Search & save", "Mortgage tools", "Make offers"],
    ctaLabel: "Continue as buyer",
  },
  {
    id: "AGENT",
    badge: "AGENT",
    badgeTone: "slate",
    iconBg: "bg-cream-2",
    iconName: "business-outline",
    iconColor: "#334155", // slate-700
    title: "I'm an estate agent",
    desc: "List properties, manage viewings, handle offers, and earn commissions.",
    chips: ["Listings dashboard", "Lead inbox", "Earnings"],
    footnote: "Verified KYC required",
    ctaLabel: "Continue as agent",
  },
  {
    id: "VENDOR",
    badge: "SERVICE LOOP",
    badgeTone: "amber",
    iconBg: "bg-amber-100",
    iconName: "construct-outline",
    iconColor: "#b45309", // amber-700
    title: "I provide property services",
    desc: "Plumbers, cleaners, inspectors, movers — find verified work near you.",
    chips: ["Job board", "Quotes", "Reviews"],
    footnote: "Trade verification required",
    ctaLabel: "Continue as service provider",
  },
];

const badgeClasses: Record<RoleCard["badgeTone"], string> = {
  emerald: "bg-primary",
  slate: "bg-slate-900",
  amber: "bg-amber-500",
};

export default function RoleSelectScreen() {
  const [selected, setSelected] = useState<Role>("BUYER");
  const current = CARDS.find((c) => c.id === selected)!;

  const handleContinue = () => {
    if (selected === "BUYER") {
      router.push("/buyer-preferences" as Href);
    } else if (selected === "AGENT") {
      router.push("/agent-setup" as Href);
    } else {
      router.push({ pathname: "/signup", params: { role: selected } } as Href);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Top bar + progress */}
        <View className="flex-row items-center px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
          >
            <Text className="text-ink-2 text-xl">‹</Text>
          </Pressable>
        </View>
        <OnboardingProgress step={1} total={3} className="px-5 mt-3" />

        <ScrollView
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Appear delay={60}>
            <Text className="text-ink font-serif text-3xl mt-6 leading-[36px]">
              How will you use{"\n"}
              <Text className="font-serif-italic">propertyloop</Text>?
            </Text>
            <Text className="text-ink-3 text-sm mt-2 leading-5">
              Pick one to start — you can add other roles later from settings.
            </Text>
          </Appear>

          {/* Role cards */}
          <View className="mt-6 gap-4">
            {CARDS.map((card, i) => (
              <Appear key={card.id} delay={stagger(i, 160)}>
                <RoleCardView
                  card={card}
                  selected={selected === card.id}
                  onPress={() => {
                    tapSelection();
                    setSelected(card.id);
                  }}
                />
              </Appear>
            ))}
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-cream">
          <PressableScale
            onPress={() => {
              tapMedium();
              handleContinue();
            }}
            className="bg-primary rounded-full py-4 items-center"
          >
            <Text className="text-white font-sans-semibold text-base">
              {current.ctaLabel}
            </Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

function RoleCardView({
  card,
  selected,
  onPress,
}: {
  card: RoleCard;
  selected: boolean;
  onPress: () => void;
}) {
  // Selected cards lift slightly on a spring — gives the choice physical weight.
  const sel = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    sel.value = withSpring(selected ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [selected, sel]);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + sel.value * 0.018 }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: sel.value,
    transform: [{ scale: sel.value }],
  }));

  return (
    <Animated.View style={cardStyle}>
    <Pressable
      onPress={onPress}
      className={`rounded-3xl p-5 border-2 ${
        selected
          ? "bg-primary-soft border-primary"
          : "bg-white border-line"
      }`}
    >
      {/* Top row: badge pill (left) + check circle (right) */}
      <View className="flex-row items-start justify-between">
        <View className={`${badgeClasses[card.badgeTone]} px-3 py-1 rounded-full`}>
          <Text className="text-white text-[10px] font-sans-bold tracking-wider">
            {card.badge}
          </Text>
        </View>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            selected
              ? "bg-primary border-primary"
              : "bg-white border-line"
          }`}
        >
          <Animated.Text style={checkStyle} className="text-white text-xs font-sans-bold">
            ✓
          </Animated.Text>
        </View>
      </View>

      {/* Icon + title row */}
      <View className="flex-row items-center gap-3 mt-4">
        <View
          className={`w-12 h-12 rounded-2xl ${card.iconBg} items-center justify-center`}
        >
          <Ionicons name={card.iconName} size={24} color={card.iconColor} />
        </View>
        <Text className="text-ink font-sans-bold text-lg flex-1">
          {card.title}
        </Text>
      </View>

      {/* Description */}
      <Text className="text-ink-2 text-sm leading-5 mt-3">{card.desc}</Text>

      {/* Feature chips */}
      <View className="flex-row flex-wrap gap-2 mt-3">
        {card.chips.map((chip) => (
          <View
            key={chip}
            className="px-3 py-1.5 bg-cream-2 rounded-full"
          >
            <Text className="text-ink-2 text-xs font-sans-medium">{chip}</Text>
          </View>
        ))}
      </View>

      {/* Footnote — verification requirement */}
      {card.footnote && (
        <View className="flex-row items-center gap-1.5 mt-3">
          <Text className="text-ink-3 text-base">○</Text>
          <Text className="text-ink-3 text-xs">{card.footnote}</Text>
        </View>
      )}
    </Pressable>
    </Animated.View>
  );
}
