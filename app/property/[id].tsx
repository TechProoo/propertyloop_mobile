import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { getSaleListing } from "@/mocks/sale-listing";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function picsum(seed: string, w = 1200, h = 900) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getSaleListing(id);
  const [saved, setSaved] = useState(false);

  const handleShare = () =>
    Share.share({
      title: listing.title,
      message: `${listing.title} — ${listing.priceLabel} · ${listing.area}`,
    }).catch(() => {});

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={{ height: 360 }} className="relative">
          <Image
            source={picsum(listing.imageSeeds[0])}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          {/* gradient overlay so the chrome stays legible against any photo */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 140,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />

          {/* Top chrome */}
          <View
            className="absolute left-4 right-4 flex-row items-center justify-between"
            style={{ top: 56 }}
          >
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            >
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <Ionicons name="share-outline" size={18} color="#ffffff" />
              </Pressable>
              <Pressable
                onPress={() => setSaved((s) => !s)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <Ionicons
                  name={saved ? "heart" : "heart-outline"}
                  size={18}
                  color={saved ? "#ff5a5f" : "#ffffff"}
                />
              </Pressable>
            </View>
          </View>

          {/* Pagination dots */}
          <View
            className="absolute left-4 flex-row gap-1.5"
            style={{ bottom: 56 }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={{
                  width: i === 0 ? 22 : 6,
                  height: 6,
                  borderRadius: 100,
                  backgroundColor:
                    i === 0 ? "#ffffff" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </View>
          {/* Counter */}
          <View
            className="absolute right-4 px-2.5 py-1 rounded-full"
            style={{ bottom: 56, backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <Text className="text-[11px] font-sans-bold text-white">
              1 / {listing.imageSeeds.length * 4}
            </Text>
          </View>
        </View>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <View
          className="bg-cream px-5 pt-6"
          style={{ marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {/* Tag row */}
          <View className="flex-row items-center gap-1.5 mb-2.5">
            <View className="bg-primary px-2 py-1 rounded-full">
              <Text className="text-[10px] font-sans-bold text-white tracking-widest uppercase">
                For sale
              </Text>
            </View>
            {listing.verified && (
              <View className="bg-primary-soft px-2 py-1 rounded-full flex-row items-center gap-1">
                <Ionicons name="shield-checkmark" size={10} color={PRIMARY} />
                <Text
                  className="text-[10px] font-sans-bold tracking-widest uppercase"
                  style={{ color: PRIMARY_INK }}
                >
                  Verified
                </Text>
              </View>
            )}
            <Text className="ml-auto text-[11px] font-sans-semibold text-ink-3">
              {listing.daysOnMarket} days on market
            </Text>
          </View>

          {/* Title + address */}
          <Text
            className="font-sans-bold text-ink tracking-tight"
            style={{ fontSize: 22, lineHeight: 26 }}
          >
            {listing.title}
          </Text>
          <View className="flex-row items-center gap-1 mt-1.5">
            <Ionicons name="location-outline" size={14} color={INK_2} />
            <Text className="text-[13.5px] font-sans-medium text-ink-2">
              {listing.address}
            </Text>
          </View>

          {/* Price stack */}
          <View className="mt-4 bg-primary-soft rounded-2xl px-4 py-3.5">
            <View className="flex-row items-baseline justify-between">
              <Text
                className="font-serif"
                style={{
                  fontSize: 32,
                  letterSpacing: -1,
                  color: PRIMARY_INK,
                }}
              >
                {listing.priceLabel}
              </Text>
              <Text
                className="text-[11px] font-sans-bold tracking-wider uppercase"
                style={{ color: PRIMARY_INK }}
              >
                {listing.pricePerSqm}
              </Text>
            </View>
            <View className="mt-1.5 flex-row items-center justify-between">
              <Text
                className="text-[12.5px]"
                style={{ color: PRIMARY_INK, opacity: 0.75 }}
              >
                Open to <Text className="font-sans-bold">offers</Text> · area
                median {listing.areaMedianPerSqm}
              </Text>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Comparable sales",
                    "Recent sales in this area will appear here.",
                  )
                }
                className="flex-row items-center gap-1"
              >
                <Text
                  className="text-[12.5px] font-sans-bold"
                  style={{ color: PRIMARY_INK }}
                >
                  Comps
                </Text>
                <Ionicons name="arrow-forward" size={11} color={PRIMARY_INK} />
              </Pressable>
            </View>
          </View>

          {/* Stats grid */}
          <View className="flex-row gap-2 mt-3.5">
            {listing.stats.map((s) => (
              <View
                key={s.l}
                className="flex-1 bg-cream-2 rounded-xl items-center"
                style={{ paddingVertical: 10 }}
              >
                <Ionicons name={s.icon} size={16} color={INK_2} />
                <Text
                  className="text-[15px] font-sans-bold text-ink mt-1"
                  style={{ letterSpacing: -0.3 }}
                >
                  {s.n}
                </Text>
                <Text className="text-[10px] font-sans-semibold text-ink-3 tracking-widest uppercase mt-0.5">
                  {s.l}
                </Text>
              </View>
            ))}
          </View>

          {/* Neighbourhood */}
          <Text className="text-[14px] font-sans-bold text-ink mt-6 mb-2.5">
            Neighbourhood
          </Text>
          <View className="flex-row gap-2">
            {listing.neighbourhood.map((c) => (
              <View
                key={c.l}
                className="flex-1 bg-cream-2 rounded-xl px-3 py-3"
              >
                <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase">
                  {c.l}
                </Text>
                <Text
                  className="font-serif text-ink mt-0.5"
                  style={{ fontSize: 18 }}
                >
                  {c.n}
                </Text>
                <Text className="text-[11px] font-sans-medium text-ink-3 mt-0.5">
                  {c.s}
                </Text>
              </View>
            ))}
          </View>

          {/* Listed by */}
          <Text className="text-[14px] font-sans-bold text-ink mt-6 mb-2.5">
            Listed by
          </Text>
          <View
            className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line"
            style={{ borderWidth: 1 }}
          >
            <PLAvatar
              initials={listing.agent.initials}
              size={46}
              tone={listing.agent.tone}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[14px] font-sans-bold text-ink">
                  {listing.agent.name}
                </Text>
                <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
              </View>
              <Text className="text-xs font-sans-semibold text-ink-3 mt-0.5">
                {listing.agent.agency} · {listing.agent.sales} sales · ⭐{" "}
                {listing.agent.rating}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky dual CTA ─────────────────────────────────────────── */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-white/95 border-line"
        style={{
          borderTopWidth: 0.5,
          paddingTop: 14,
          paddingBottom: 30,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row gap-2">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/book-viewing",
                params: { listingId: listing.id },
              } as Href)
            }
            className="flex-1 bg-cream-2 rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 15 }}
          >
            <Text className="text-[14px] font-sans-bold text-ink">
              Book viewing
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/make-offer",
                params: { listingId: listing.id },
              } as Href)
            }
            className="flex-1 bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 15 }}
          >
            <Text className="text-[14px] font-sans-bold text-white">
              Make an offer
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
