import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingCta from "@/components/onboarding/OnboardingCta";

type Intent = "RENTING" | "BUYING" | "BROWSING";

const INTENTS: {
  id: Intent;
  title: string;
  desc: string;
  iconName: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "RENTING",
    title: "Renting",
    desc: "Yearly or short-term",
    iconName: "key-outline",
  },
  {
    id: "BUYING",
    title: "Buying",
    desc: "Find a forever home",
    iconName: "home-outline",
  },
  {
    id: "BROWSING",
    title: "Just looking",
    desc: "Browsing the market",
    iconName: "eye-outline",
  },
];

const AREAS = [
  "Lekki Phase 1",
  "Ikoyi",
  "Victoria Island",
  "Yaba",
  "Ikeja GRA",
  "Surulere",
  "Magodo",
  "Maitama (Abuja)",
  "Asokoro (Abuja)",
  "GRA Port Harcourt",
];

const MAX_AREAS = 4;

// Budget ranges adapt to intent: yearly rent bands vs purchase bands. Stored
// as the display string on BuyerProfile.budgetRange (see backend signup DTO).
const BUDGETS: Record<Intent, string[]> = {
  RENTING: ["Under ₦1M / yr", "₦1M – ₦3M / yr", "₦3M – ₦10M / yr", "₦10M+ / yr"],
  BUYING: ["Under ₦50M", "₦50M – ₦100M", "₦100M – ₦200M", "₦200M+"],
  BROWSING: [],
};

export default function BuyerPreferencesScreen() {
  const insets = useSafeAreaInsets();
  // Measure the sticky CTA so the scroll content can pad past it — a fixed
  // padding leaves the last section hidden behind a taller CTA on some devices.
  const [footerH, setFooterH] = useState(0);
  const [intent, setIntent] = useState<Intent>("RENTING");
  const [budget, setBudget] = useState<string | null>(null);
  const [areas, setAreas] = useState<string[]>([
    "Lekki Phase 1",
    "Ikoyi",
    "Victoria Island",
  ]);

  const toggleArea = (a: string) => {
    setAreas((prev) => {
      if (prev.includes(a)) return prev.filter((x) => x !== a);
      if (prev.length >= MAX_AREAS) return prev;
      return [...prev, a];
    });
  };

  const canContinue = useMemo(
    () => areas.length > 0,
    [areas.length],
  );

  const handleContinue = () => {
    if (!canContinue) return;
    router.push({
      pathname: "/signup",
      params: {
        role: "BUYER",
        intent,
        areas: areas.join("|"),
        ...(budget ? { budget } : {}),
      },
    } as Href);
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-ink-2 text-xl">‹</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/signup",
                params: { role: "BUYER" },
              } as Href)
            }
            hitSlop={12}
          >
            <Text className="text-ink-2 text-sm font-sans-medium">Skip</Text>
          </Pressable>
        </View>
        <OnboardingProgress step={2} total={3} className="px-5 mt-3" />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: footerH + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text className="text-ink font-serif text-3xl mt-6 leading-[36px]">
            What brings <Text className="font-serif-italic">you</Text> here?
          </Text>
          <Text className="text-ink-3 text-sm mt-2 leading-5">
            We'll tailor your home feed. You can change this any time.
          </Text>

          {/* Intent cards */}
          <View className="mt-6 gap-3">
            {INTENTS.map((opt) => {
              const selected = intent === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    setIntent(opt.id);
                    // Rent and buy bands differ — clear a stale pick on switch.
                    setBudget(null);
                  }}
                  className={`rounded-3xl p-4 flex-row items-center gap-3 border-2 active:opacity-80 ${
                    selected
                      ? "bg-primary-soft border-primary"
                      : "bg-white border-line"
                  }`}
                >
                  <View
                    className={`w-11 h-11 rounded-2xl items-center justify-center ${
                      selected ? "bg-primary" : "bg-primary-soft"
                    }`}
                  >
                    <Ionicons
                      name={opt.iconName}
                      size={22}
                      color={selected ? "#ffffff" : "#1f6f43"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink font-sans-bold text-base">
                      {opt.title}
                    </Text>
                    <Text className="text-ink-2 text-[13px] mt-0.5">
                      {opt.desc}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selected
                        ? "bg-primary border-primary"
                        : "border-line"
                    }`}
                  >
                    {selected && (
                      <Text className="text-white text-xs font-sans-bold">✓</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Areas */}
          <View className="mt-7">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-ink font-sans-bold text-base">
                Areas you like
              </Text>
              <Text className="text-ink-3 text-xs">
                pick up to {MAX_AREAS} ·{" "}
                <Text className="text-primary font-sans-semibold">
                  {areas.length}/{MAX_AREAS}
                </Text>
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2 mt-3">
              {AREAS.map((a) => {
                const selected = areas.includes(a);
                const disabled = !selected && areas.length >= MAX_AREAS;
                return (
                  <Pressable
                    key={a}
                    onPress={() => toggleArea(a)}
                    disabled={disabled}
                    className={`px-4 py-2 rounded-full border ${
                      selected
                        ? "bg-slate-900 border-slate-900"
                        : disabled
                          ? "bg-white border-line opacity-40"
                          : "bg-white border-line"
                    } active:opacity-80`}
                  >
                    <Text
                      className={`text-sm font-sans-medium ${
                        selected ? "text-white" : "text-ink-2"
                      }`}
                    >
                      {a}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Budget — optional, bands adapt to rent vs buy. Hidden for browsers. */}
          {BUDGETS[intent].length > 0 && (
            <View className="mt-7">
              <View className="flex-row items-baseline justify-between">
                <Text className="text-ink font-sans-bold text-base">
                  {intent === "RENTING" ? "Yearly budget" : "Budget"}
                </Text>
                <Text className="text-ink-3 text-xs">optional</Text>
              </View>
              <View className="flex-row flex-wrap gap-2 mt-3">
                {BUDGETS[intent].map((b) => {
                  const selected = budget === b;
                  return (
                    <Pressable
                      key={b}
                      onPress={() => setBudget(selected ? null : b)}
                      className={`px-4 py-2 rounded-full border ${
                        selected
                          ? "bg-slate-900 border-slate-900"
                          : "bg-white border-line"
                      } active:opacity-80`}
                    >
                      <Text
                        className={`text-sm font-sans-medium ${
                          selected ? "text-white" : "text-ink-2"
                        }`}
                      >
                        {b}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky bottom CTA — bottom padding tracks the safe-area inset so the
            button clears the Android nav bar / gesture area (edge-to-edge). */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pt-3 bg-cream"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 10 }}
          onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
        >
          <OnboardingCta
            label="Show me homes"
            ready={canContinue}
            onPress={handleContinue}
            getMissing={() => ["at least one area you like"]}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
