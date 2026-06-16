import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import listingsService, {
  type Comp,
  type CompsResponse,
} from "@/api/services/listings";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function compactNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return naira(n);
}

export default function CompsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [data, setData] = useState<CompsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let active = true;
    listingsService
      .getComps(id)
      .then((d) => active && setData(d))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const pct = data?.askingVsMedianPct ?? null;

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
          Comparable listings
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : !data || data.count === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="bar-chart-outline" size={34} color={INK_3} />
          <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
            No comparables yet
          </Text>
          <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
            We couldn’t find similar active listings nearby to compare against.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Text
            className="font-serif text-ink mt-2"
            style={{ fontSize: 26, letterSpacing: -0.5, lineHeight: 28 }}
          >
            How similar homes{" "}
            <Text className="font-serif-italic">are priced</Text>
          </Text>
          <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
            {data.count} active listing{data.count === 1 ? "" : "s"} in{" "}
            {data.location} · around {data.beds} bed
            {data.beds === 1 ? "" : "s"}.
          </Text>

          {/* Stat strip */}
          <View className="flex-row gap-2 mt-4">
            <Stat
              n={data.medianNaira != null ? compactNaira(data.medianNaira) : "—"}
              l="Median asking"
              tone="primary"
            />
            <Stat
              n={pct != null ? `${pct > 0 ? "+" : ""}${pct}%` : "—"}
              l="This vs median"
            />
            <Stat
              n={data.avgDaysListed != null ? `${data.avgDaysListed}d` : "—"}
              l="Avg days listed"
            />
          </View>

          {/* This listing */}
          <View
            className="mt-4 bg-white rounded-2xl px-3.5 py-3 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
              This listing
            </Text>
            <View className="flex-row items-baseline gap-2 mt-1">
              <Text className="font-serif text-ink" style={{ fontSize: 22, letterSpacing: -0.4 }}>
                {data.asking.priceLabel}
              </Text>
              {pct != null && pct !== 0 && (
                <Text
                  className="text-[12px] font-sans-bold"
                  style={{ color: pct > 0 ? "#a8421a" : PRIMARY }}
                >
                  {pct > 0 ? `${pct}% above` : `${-pct}% below`} median
                </Text>
              )}
            </View>
          </View>

          {/* Comp list */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
            Comparable · {data.count}
          </Text>
          <View className="gap-3">
            {data.comps.map((c) => (
              <CompCard key={c.id} comp={c} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CompCard({ comp }: { comp: Comp }) {
  return (
    <Pressable
      onPress={() => router.push(`/property/${comp.id}` as Href)}
      className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View className="flex-row gap-3 p-3">
        <Image
          source={comp.coverImage}
          style={{ width: 76, height: 76, borderRadius: 10 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 17, letterSpacing: -0.3 }}
            >
              {comp.priceLabel}
            </Text>
            <View className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#e3efe7" }}>
              <Text
                className="text-[9.5px] font-sans-bold tracking-widest uppercase"
                style={{ color: PRIMARY_INK }}
              >
                Listed {comp.daysListed}d ago
              </Text>
            </View>
          </View>
          <Text className="text-[13px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
            {comp.title}
          </Text>
          <Text className="text-[11.5px] text-ink-3 mt-0.5" numberOfLines={1}>
            {comp.location}
          </Text>
          <View className="flex-row items-center gap-3 mt-1.5 flex-wrap">
            <MetaChip text={`${comp.beds} bed`} />
            <MetaChip text={`${comp.baths} bath`} />
            {!!comp.sqft && <MetaChip text={`${comp.sqft} m²`} />}
            {comp.pricePerSqm != null && (
              <Text className="text-[11px] font-sans-bold text-ink-2 ml-auto">
                ₦{Math.round(comp.pricePerSqm / 1000)}k/m²
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ n, l, tone }: { n: string; l: string; tone?: "primary" }) {
  const primary = tone === "primary";
  return (
    <View
      className="flex-1 rounded-2xl px-3 py-3"
      style={{ backgroundColor: primary ? PRIMARY : "#ffffff", borderWidth: primary ? 0 : 0.5, borderColor: "#e1dcd3" }}
    >
      <Text
        className="font-serif"
        style={{ fontSize: 19, letterSpacing: -0.3, color: primary ? "#ffffff" : "#1a2120" }}
      >
        {n}
      </Text>
      <Text
        className="text-[10.5px] font-sans-semibold mt-0.5"
        style={{ color: primary ? "rgba(255,255,255,0.8)" : INK_3 }}
      >
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
