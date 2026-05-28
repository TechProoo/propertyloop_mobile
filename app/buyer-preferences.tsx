import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type Intent = "RENTING" | "BUYING" | "BROWSING";

const INTENTS: { id: Intent; title: string; desc: string; glyph: string }[] = [
  { id: "RENTING", title: "Renting", desc: "Yearly or short-term", glyph: "🔑" },
  { id: "BUYING", title: "Buying", desc: "Find a forever home", glyph: "🏠" },
  {
    id: "BROWSING",
    title: "Just looking",
    desc: "Browsing the market",
    glyph: "👀",
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

export default function BuyerPreferencesScreen() {
  const [intent, setIntent] = useState<Intent>("RENTING");
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
      },
    } as Href);
  };

  return (
    <View className="flex-1 bg-[#f5f0eb]">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-slate-700 text-xl">‹</Text>
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
            <Text className="text-slate-600 text-sm font-medium">Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text className="text-slate-900 font-serif text-3xl mt-6 leading-[36px]">
            What brings <Text className="italic">you</Text> here?
          </Text>
          <Text className="text-slate-500 text-sm mt-2 leading-5">
            We'll tailor your home feed. You can change this any time.
          </Text>

          {/* Intent cards */}
          <View className="mt-6 gap-3">
            {INTENTS.map((opt) => {
              const selected = intent === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setIntent(opt.id)}
                  className={`rounded-3xl p-4 flex-row items-center gap-3 border-2 active:opacity-80 ${
                    selected
                      ? "bg-emerald-50 border-emerald-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <View
                    className={`w-11 h-11 rounded-2xl items-center justify-center ${
                      selected ? "bg-emerald-600" : "bg-emerald-50"
                    }`}
                  >
                    <Text className="text-xl">{opt.glyph}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-bold text-base">
                      {opt.title}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                      {opt.desc}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selected
                        ? "bg-emerald-600 border-emerald-600"
                        : "border-slate-300"
                    }`}
                  >
                    {selected && (
                      <Text className="text-white text-xs font-bold">✓</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Areas */}
          <View className="mt-7">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-slate-900 font-bold text-base">
                Areas you like
              </Text>
              <Text className="text-slate-500 text-xs">
                pick up to {MAX_AREAS} ·{" "}
                <Text className="text-emerald-700 font-semibold">
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
                          ? "bg-white border-slate-200 opacity-40"
                          : "bg-white border-slate-200"
                    } active:opacity-80`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {a}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Budget placeholder — TODO: add range slider */}
          <View className="mt-7">
            <Text className="text-slate-900 font-bold text-base">
              Yearly budget
            </Text>
            <Text className="text-slate-500 text-xs mt-1">
              Coming soon — we'll add budget filtering shortly.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky bottom CTA */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-[#f5f0eb]">
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            className="bg-emerald-700 rounded-full py-4 items-center active:opacity-80 disabled:opacity-50"
          >
            <Text className="text-white font-semibold text-base">
              Show me homes
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
