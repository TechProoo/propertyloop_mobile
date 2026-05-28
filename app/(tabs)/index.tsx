import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import type { Listing } from "@/api/types";

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await listingsService.list({ limit: 20, sort: "newest" });
      setListings(res.items);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load listings");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1f6f43" />
        <Text className="text-slate-500 mt-3">Loading listings…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-5 pt-2 pb-4">
        <Text className="text-3xl font-bold text-slate-900">PropertyLoop</Text>
        <Text className="text-slate-500 mt-1">
          Verified properties across Nigeria
        </Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-10 gap-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          error ? (
            <View className="items-center pt-20 px-5">
              <Text className="text-red-500 text-center">{error}</Text>
              <Pressable
                onPress={async () => {
                  setLoading(true);
                  await load();
                  setLoading(false);
                }}
                className="mt-4 px-6 py-3 bg-emerald-600 rounded-full"
              >
                <Text className="text-white font-semibold">Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center pt-20">
              <Text className="text-slate-500">No listings yet</Text>
            </View>
          )
        }
        renderItem={({ item }) => <ListingCard listing={item} />}
      />
    </SafeAreaView>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/property/${listing.id}` as Href} asChild>
      <Pressable className="bg-white rounded-3xl overflow-hidden border border-slate-200">
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: 200 }}
          contentFit="cover"
          transition={200}
        />
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <Text
              className="text-lg font-bold text-slate-900 flex-1"
              numberOfLines={1}
            >
              {listing.title}
            </Text>
            {listing.agent?.verified && (
              <View className="ml-2 px-2 py-0.5 bg-emerald-50 rounded-full">
                <Text className="text-emerald-700 text-xs font-semibold">
                  ✓ Verified
                </Text>
              </View>
            )}
          </View>
          <Text className="text-slate-500 text-sm mt-1" numberOfLines={1}>
            {listing.location}
          </Text>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xl font-bold text-emerald-700">
              {listing.priceLabel}
              {listing.period ? (
                <Text className="text-sm font-normal text-slate-500">
                  {" "}
                  / {listing.period}
                </Text>
              ) : null}
            </Text>
            <View className="flex-row gap-3">
              <Text className="text-slate-600 text-sm">{listing.beds} bd</Text>
              <Text className="text-slate-600 text-sm">{listing.baths} ba</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
