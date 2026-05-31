import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SEARCH_RESULTS } from "@/mocks/linked";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function SearchResultsScreen() {
  const r = SEARCH_RESULTS;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Sticky search header */}
      <View className="px-4 pt-1 pb-2.5">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <View
            className="flex-1 bg-white rounded-full px-3.5 py-2.5 flex-row items-center gap-2 border-line"
            style={{ borderWidth: 1 }}
          >
            <Ionicons name="search" size={15} color={INK_2} />
            <Text className="flex-1 text-[13.5px] font-sans-bold text-ink">
              {r.query}
            </Text>
            <View className="bg-primary-soft px-2 py-0.5 rounded-full">
              <Text
                className="text-[10px] font-sans-bold tracking-wider uppercase"
                style={{ color: PRIMARY_INK }}
              >
                Saved
              </Text>
            </View>
          </View>
          <Pressable
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: INK }}
          >
            <Ionicons name="options-outline" size={16} color="#ffffff" />
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingTop: 10 }}
        >
          {r.chips.map((c) => (
            <View
              key={c}
              className="bg-ink px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
            >
              <Text className="text-[12px] font-sans-bold text-white">{c}</Text>
              <Ionicons name="close" size={11} color="#ffffff" />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Result count + sort */}
      <View
        className="px-5 py-2 flex-row items-center justify-between border-line"
        style={{ borderBottomWidth: 0.5 }}
      >
        <Text className="text-[13px] font-sans-bold text-ink">
          {r.totalHomes} homes{" "}
          <Text className="font-sans-semibold text-ink-3">
            · {r.newCount} new
          </Text>
        </Text>
        <View className="flex-row gap-3">
          <Pressable className="flex-row items-center gap-1">
            <Text className="text-[12.5px] font-sans-bold text-ink-2">
              Newest
            </Text>
            <Ionicons name="chevron-down" size={12} color={INK_2} />
          </Pressable>
          <Pressable className="flex-row items-center gap-1">
            <Ionicons name="map-outline" size={13} color={PRIMARY} />
            <Text className="text-[12.5px] font-sans-bold text-primary">
              Map
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Results */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {r.results.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/property/${c.id}` as Href)}
            className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
            style={{ borderWidth: 0.5 }}
          >
            <View style={{ height: 170 }} className="relative">
              <Image
                source={`https://picsum.photos/seed/${c.imageSeed}/600/400`}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              {c.tag && (
                <View className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-full">
                  <Text className="text-[10.5px] font-sans-bold text-ink tracking-wider uppercase">
                    {c.tag}
                  </Text>
                </View>
              )}
              <View className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 items-center justify-center">
                <Ionicons name="heart-outline" size={16} color={INK} />
              </View>
            </View>
            <View className="px-3.5 py-3">
              <View className="flex-row items-baseline justify-between">
                <Text
                  className="font-serif text-ink"
                  style={{ fontSize: 20, letterSpacing: -0.4 }}
                >
                  {c.price}
                </Text>
                <Text className="text-[11px] font-sans-semibold text-ink-3">
                  {c.ppm}
                </Text>
              </View>
              <Text className="text-[14px] font-sans-bold text-ink mt-0.5">
                {c.title}
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-0.5">{c.area}</Text>
              <View className="flex-row gap-3 mt-2">
                <Stat icon="bed-outline" value={`${c.beds} bed`} />
                <Stat icon="water-outline" value={`${c.baths} bath`} />
                <Stat icon="resize-outline" value={c.areaSqm} />
              </View>
            </View>
          </Pressable>
        ))}
        <Text className="text-center text-[12px] text-ink-3 font-sans-semibold pt-1">
          Showing {r.results.length} of {r.totalHomes} · scroll for more
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={13} color={INK_2} />
      <Text className="text-[11.5px] font-sans-semibold text-ink-2">
        {value}
      </Text>
    </View>
  );
}
