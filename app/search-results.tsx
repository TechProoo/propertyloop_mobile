import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useListings } from "@/api/hooks/useListings";
import type { Listing } from "@/api/types";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TYPE_TAG: Record<Listing["type"], string> = {
  SALE: "For sale",
  RENT: "For rent",
  SHORTLET: "Shortlet",
};

export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    propertyType?: string;
    minPrice?: string;
    maxPrice?: string;
    minBeds?: string;
    minBaths?: string;
  }>();
  const [query, setQuery] = useState(params.q ?? "");
  const [submitted, setSubmitted] = useState((params.q ?? "").trim());

  const num = (v?: string) => (v ? Number(v) : undefined);

  const {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
  } = useListings({
    search: submitted || undefined,
    propertyType: params.propertyType || undefined,
    minPrice: num(params.minPrice),
    maxPrice: num(params.maxPrice),
    minBeds: num(params.minBeds),
    minBaths: num(params.minBaths),
    sort: "newest",
  });

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Search header */}
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
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => setSubmitted(query.trim())}
              placeholder="Search area, title…"
              placeholderTextColor={INK_3}
              returnKeyType="search"
              autoCapitalize="none"
              className="flex-1 text-[13.5px] font-sans-bold text-ink"
              style={{ paddingVertical: 0 }}
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setSubmitted("");
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={16} color={INK_3} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => router.push("/filters" as Href)}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: INK }}
          >
            <Ionicons name="options-outline" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Result count */}
      <View
        className="px-5 py-2 flex-row items-center justify-between border-line"
        style={{ borderBottomWidth: 0.5 }}
      >
        <Text className="text-[13px] font-sans-bold text-ink">
          {loading ? "Searching…" : `${total} home${total === 1 ? "" : "s"}`}
          {submitted ? (
            <Text className="font-sans-semibold text-ink-3"> · “{submitted}”</Text>
          ) : null}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-[12.5px] font-sans-bold text-ink-2">Newest</Text>
          <Ionicons name="chevron-down" size={12} color={INK_2} />
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : error ? (
        <Empty
          icon="cloud-offline-outline"
          title="Couldn’t load results"
          body="Check your connection and try again."
          actionLabel="Try again"
          onAction={reload}
        />
      ) : items.length === 0 ? (
        <Empty
          icon="search-outline"
          title="No homes found"
          body={
            submitted
              ? `Nothing matches “${submitted}”. Try a different area or filter.`
              : "Search by area or keyword to find homes."
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 400
            ) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {items.map((c) => (
            <ResultCard key={c.id} listing={c} />
          ))}
          {loadingMore && (
            <BouncyLoader color={PRIMARY} style={{ marginTop: 4 }} />
          )}
          {!hasMore && (
            <Text className="text-center text-[12px] text-ink-3 font-sans-semibold pt-1">
              That’s all {total} home{total === 1 ? "" : "s"}
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ResultCard({ listing }: { listing: Listing }) {
  return (
    <Pressable
      onPress={() => router.push(`/property/${listing.id}` as Href)}
      className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View style={{ height: 170 }} className="relative">
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-full">
          <Text className="text-[10.5px] font-sans-bold text-ink tracking-wider uppercase">
            {TYPE_TAG[listing.type]}
          </Text>
        </View>
        {listing.verified && (
          <View className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 items-center justify-center">
            <Ionicons name="shield-checkmark" size={15} color={PRIMARY} />
          </View>
        )}
      </View>
      <View className="px-3.5 py-3">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="font-serif text-ink"
            style={{ fontSize: 20, letterSpacing: -0.4 }}
          >
            {listing.priceLabel}
            <Text style={{ fontSize: 12 }}>{listing.period ?? ""}</Text>
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#b9842c" />
            <Text className="text-[11px] font-sans-bold text-ink-2">
              {listing.rating}
            </Text>
          </View>
        </View>
        <Text className="text-[14px] font-sans-bold text-ink mt-0.5">
          {listing.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">
          {listing.location}
        </Text>
        <View className="flex-row gap-3 mt-2">
          <Stat icon="bed-outline" value={`${listing.beds} bed`} />
          <Stat icon="water-outline" value={`${listing.baths} bath`} />
          {!!listing.sqft && <Stat icon="resize-outline" value={`${listing.sqft} m²`} />}
        </View>
      </View>
    </Pressable>
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
      <Text className="text-[11.5px] font-sans-semibold text-ink-2">{value}</Text>
    </View>
  );
}

function Empty({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={28} color={INK_2} />
      </View>
      <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
        {title}
      </Text>
      <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
        {body}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
