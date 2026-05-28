import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Listing } from "@/api/types";
import { MOCK_LISTINGS } from "@/mocks/listings";

export default function HomeScreen() {
  // Demo data only — backend wiring is intentionally disabled. Swap
  // `MOCK_LISTINGS` for `listingsService.list(...)` when ready to re-wire.
  const [listings] = useState<Listing[]>(MOCK_LISTINGS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    // Pull-to-refresh is a no-op until the backend is reconnected.
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

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
