import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import type { Listing } from "@/api/types";

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    listingsService
      .getById(id)
      .then(setListing)
      .catch((e) => setError(e?.message ?? "Failed to load"));
  }, [id]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white p-8">
        <Text className="text-red-500 text-center">{error}</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-slate-900 rounded-full"
        >
          <Text className="text-white font-semibold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1f6f43" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: listing.title, headerBackTitle: "Back" }} />
      <ScrollView contentContainerClassName="pb-10">
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: 280 }}
          contentFit="cover"
          transition={250}
        />

        <View className="px-5 pt-5">
          <Text className="text-2xl font-bold text-slate-900">
            {listing.title}
          </Text>
          <Text className="text-slate-500 mt-1">{listing.address}</Text>

          <View className="flex-row items-baseline mt-3">
            <Text className="text-3xl font-bold text-emerald-700">
              {listing.priceLabel}
            </Text>
            {listing.period && (
              <Text className="text-slate-500 ml-2">/ {listing.period}</Text>
            )}
          </View>

          <View className="flex-row gap-6 mt-5 py-4 border-y border-slate-200">
            <Stat label="Beds" value={String(listing.beds)} />
            <Stat label="Baths" value={String(listing.baths)} />
            {listing.sqft ? <Stat label="Sqft" value={listing.sqft} /> : null}
          </View>

          <Text className="text-base font-semibold text-slate-900 mt-6 mb-2">
            About this property
          </Text>
          <Text className="text-slate-600 leading-6">{listing.description}</Text>

          {listing.features?.length > 0 && (
            <>
              <Text className="text-base font-semibold text-slate-900 mt-6 mb-2">
                Features
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {listing.features.map((f) => (
                  <View key={f} className="px-3 py-1.5 bg-slate-100 rounded-full">
                    <Text className="text-slate-700 text-sm">{f}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {listing.agent && (
            <View className="mt-8 p-4 bg-slate-50 rounded-3xl flex-row items-center gap-3">
              {listing.agent.avatarUrl ? (
                <Image
                  source={listing.agent.avatarUrl}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center">
                  <Text className="text-emerald-700 font-bold">
                    {listing.agent.name?.[0] ?? "?"}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">
                  {listing.agent.name}
                </Text>
                <Text className="text-slate-500 text-sm">
                  {listing.agent.agency ?? "Independent agent"}
                </Text>
              </View>
              {listing.agent.verified && (
                <View className="px-2 py-1 bg-emerald-100 rounded-full">
                  <Text className="text-emerald-700 text-xs font-semibold">✓</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-slate-500 text-xs uppercase tracking-wider">
        {label}
      </Text>
      <Text className="text-slate-900 font-semibold text-base mt-0.5">
        {value}
      </Text>
    </View>
  );
}
