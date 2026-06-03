import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type Comp = {
  id: string;
  imageSeed: string;
  price: string;
  priceNumeric: number;
  title: string;
  area: string;
  beds: number;
  baths: number;
  sqm: number;
  ppm: string;
  soldOn: string;
  daysOnMarket: number;
};

const COMPS: Comp[] = [
  { id: "c-1", imageSeed: "comp-1", price: "₦82M", priceNumeric: 82, title: "Acacia Villa · 4-bed", area: "Lekki Phase 1", beds: 4, baths: 4, sqm: 320, ppm: "256k/m²", soldOn: "Apr 2026", daysOnMarket: 38 },
  { id: "c-2", imageSeed: "comp-2", price: "₦74M", priceNumeric: 74, title: "Marula Court · 4-bed", area: "Lekki Phase 1", beds: 4, baths: 3, sqm: 295, ppm: "251k/m²", soldOn: "Mar 2026", daysOnMarket: 22 },
  { id: "c-3", imageSeed: "comp-3", price: "₦80M", priceNumeric: 80, title: "Palm Heights · 4-bed", area: "Lekki Phase 1", beds: 4, baths: 5, sqm: 340, ppm: "235k/m²", soldOn: "Feb 2026", daysOnMarket: 51 },
  { id: "c-4", imageSeed: "comp-4", price: "₦69M", priceNumeric: 69, title: "Iroko Mews · 3-bed",  area: "Lekki Phase 1", beds: 3, baths: 3, sqm: 260, ppm: "265k/m²", soldOn: "Feb 2026", daysOnMarket: 19 },
];

const ASKING = 78;

export default function CompsScreen() {
  useLocalSearchParams<{ id?: string }>();
  const median =
    [...COMPS].map((c) => c.priceNumeric).sort((a, b) => a - b)[Math.floor(COMPS.length / 2)];
  const askingVsMedian = Math.round(((ASKING - median) / median) * 100);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">
          Comparable sales
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero summary */}
        <Text
          className="font-serif text-ink mt-2"
          style={{ fontSize: 26, letterSpacing: -0.5, lineHeight: 28 }}
        >
          What 4-beds <Text className="font-serif-italic">actually sold for</Text>
        </Text>
        <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
          Last 4 verified sales in Lekki Phase 1 · 3-6 beds · within 1.5 km.
        </Text>

        {/* Stat strip */}
        <View className="flex-row gap-2 mt-4">
          <Stat n={`₦${median}M`} l="Median sold" tone="primary" />
          <Stat n={`${askingVsMedian > 0 ? "+" : ""}${askingVsMedian}%`} l="Asking vs median" />
          <Stat n="32d" l="Avg days on market" />
        </View>

        {/* Asking marker */}
        <View
          className="mt-4 bg-white rounded-2xl px-3.5 py-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
            This listing
          </Text>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="font-serif text-ink" style={{ fontSize: 22, letterSpacing: -0.4 }}>
              ₦{ASKING}M
            </Text>
            <Text
              className="text-[12px] font-sans-bold"
              style={{ color: askingVsMedian > 0 ? "#a8421a" : PRIMARY }}
            >
              {askingVsMedian > 0 ? `${askingVsMedian}% above` : `${-askingVsMedian}% below`} median
            </Text>
          </View>
        </View>

        {/* Comp list */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Recently sold · {COMPS.length}
        </Text>
        <View className="gap-3">
          {COMPS.map((c) => (
            <View
              key={c.id}
              className="bg-white rounded-2xl overflow-hidden border-line"
              style={{ borderWidth: 0.5 }}
            >
              <View className="flex-row gap-3 p-3">
                <Image
                  source={`https://picsum.photos/seed/${c.imageSeed}/200/200`}
                  style={{ width: 76, height: 76, borderRadius: 10 }}
                  contentFit="cover"
                />
                <View className="flex-1">
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className="font-serif text-ink"
                      style={{ fontSize: 17, letterSpacing: -0.3 }}
                    >
                      {c.price}
                    </Text>
                    <View
                      className="px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#e3efe7" }}
                    >
                      <Text
                        className="text-[9.5px] font-sans-bold tracking-widest uppercase"
                        style={{ color: PRIMARY_INK }}
                      >
                        Sold {c.soldOn}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[13px] font-sans-bold text-ink mt-0.5">
                    {c.title}
                  </Text>
                  <Text className="text-[11.5px] text-ink-3 mt-0.5">{c.area}</Text>
                  <View className="flex-row items-center gap-3 mt-1.5 flex-wrap">
                    <MetaChip text={`${c.beds} bed`} />
                    <MetaChip text={`${c.baths} bath`} />
                    <MetaChip text={`${c.sqm} m²`} />
                    <Text className="text-[11px] font-sans-bold text-ink-2 ml-auto">
                      {c.ppm}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                className="flex-row items-center justify-between px-3.5 py-2"
                style={{ backgroundColor: "#f0f0f0" }}
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="time-outline" size={12} color={ACCENT_INK} />
                  <Text className="text-[11px] font-sans-bold" style={{ color: ACCENT_INK }}>
                    {c.daysOnMarket} days on market
                  </Text>
                </View>
                <Pressable onPress={() => router.push("/property/hibiscus-1" as Href)} hitSlop={6}>
                  <Text className="text-[11px] font-sans-bold text-primary">
                    See listing →
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-[11px] text-ink-3 mt-5 leading-4">
          Data sourced from agent-confirmed completions on PropertyLoop within the
          last 6 months. Off-market deals not included.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, l, tone }: { n: string; l: string; tone?: "primary" }) {
  return (
    <View
      className="flex-1 rounded-xl border-line px-2.5 py-2.5"
      style={{
        borderWidth: 0.5,
        backgroundColor: tone === "primary" ? "#e3efe7" : "#ffffff",
      }}
    >
      <Text
        className="font-serif"
        style={{ fontSize: 18, letterSpacing: -0.3, color: tone === "primary" ? PRIMARY_INK : "#1a2120" }}
      >
        {n}
      </Text>
      <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
        {l}
      </Text>
    </View>
  );
}

function MetaChip({ text }: { text: string }) {
  return (
    <Text className="text-[11px] font-sans-semibold text-ink-3">{text}</Text>
  );
}

// Silence unused-warning if a constant becomes unused.
void INK_3;
