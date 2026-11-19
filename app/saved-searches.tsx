import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useFocusEffect, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { useAuth } from "@/context/auth";
import { Alert } from "@/lib/dialog";
import { setSelectedLocation } from "@/lib/location";
import { setSearchFilters } from "@/lib/searchFilters";
import savedSearchesService, {
  describeSavedSearch,
  type SavedSearch,
} from "@/api/services/savedSearches";

export default function SavedSearchesScreen() {
  const { status, user, requireAuth } = useAuth();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [removing, setRemoving] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (status !== "authed" || !user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(false);
      savedSearchesService
        .list()
        .then((rows) => {
          if (active) setItems(rows);
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
      // Account changes and explicit retries must restart the focus request.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, user?.id, retry]),
  );

  function open(item: SavedSearch) {
    setSelectedLocation(item.location || "");
    setSearchFilters({
      type: item.type ?? undefined,
      propertyType: item.propertyType ?? undefined,
      minPrice: item.minPrice ?? undefined,
      maxPrice: item.maxPrice ?? undefined,
      minBeds: item.minBeds ?? undefined,
      minBaths: item.minBaths ?? undefined,
    });
    router.push({
      pathname: "/search-results",
      params: {
        q: item.search || "",
        savedSearchId: item.id,
        sort: item.sort || "newest",
      },
    });
  }
  function remove(item: SavedSearch) {
    Alert.alert(
      "Remove this saved search?",
      item.location || item.search || "All locations",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemoving(item.id);
            try {
              await savedSearchesService.remove(item.id);
              setItems((rows) => rows.filter((row) => row.id !== item.id));
            } catch {
              Alert.alert(
                "Could not remove search",
                "Check your connection and try again.",
              );
            } finally {
              setRemoving(null);
            }
          },
        },
      ],
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-cream-2"
        >
          <Ionicons name="chevron-back" size={20} color="#4d524f" />
        </Pressable>
        <Text className="text-[17px] font-sans-bold text-ink">
          Saved searches
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-[13px] leading-5 text-ink-3">
          Your location, budget and preferences, ready to reopen on any device.
        </Text>
        {status !== "authed" ? (
          <View className="items-center py-14">
            <Ionicons name="bookmark-outline" size={32} color="#1f6f43" />
            <Text className="mt-4 text-[16px] font-sans-bold text-ink">
              Sign in to keep your searches
            </Text>
            <Pressable
              onPress={() => requireAuth("save your searches")}
              className="mt-5 rounded-full bg-primary px-6 py-3"
            >
              <Text className="text-[13px] font-sans-bold text-white">
                Sign in
              </Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View className="py-16">
            <BouncyLoader color="#1f6f43" />
          </View>
        ) : error ? (
          <View className="items-center py-12">
            <Text className="text-[14px] font-sans-bold text-ink">
              Could not load your searches
            </Text>
            <Pressable
              onPress={() => setRetry((n) => n + 1)}
              className="mt-4 px-5 py-3"
            >
              <Text className="font-sans-bold text-primary">Try again</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View className="items-center py-14">
            <Ionicons name="search-outline" size={32} color="#1f6f43" />
            <Text className="mt-4 text-[17px] font-sans-bold text-ink">
              Save your next property search
            </Text>
            <Text className="mt-2 text-center text-[13px] leading-5 text-ink-3">
              Choose a location and your filters, then tap “Save this search”.
            </Text>
            <Pressable
              onPress={() => router.push("/search-results" as Href)}
              className="mt-5 rounded-full bg-primary px-6 py-3"
            >
              <Text className="text-[13px] font-sans-bold text-white">
                Find a property
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-6 gap-4">
            {items.map((item) => (
              <View
                key={item.id}
                className="rounded-3xl border border-line bg-white p-5"
              >
                <Text className="text-[18px] font-sans-bold text-ink">
                  {item.location || item.search || "All locations"}
                </Text>
                <Text className="mt-2 text-[12px] leading-5 text-ink-3">
                  {describeSavedSearch(item)}
                </Text>
                <View className="mt-4 flex-row items-center justify-between gap-3">
                  <Pressable
                    onPress={() => open(item)}
                    accessibilityRole="button"
                    className="flex-row items-center gap-2 rounded-full bg-primary px-4 py-3"
                  >
                    <Text className="text-[12px] font-sans-bold text-white">
                      View results
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => remove(item)}
                    disabled={removing === item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove saved search: ${item.location || item.search || "All locations"}`}
                    className="flex-row items-center gap-1.5 px-2 py-3"
                  >
                    <Ionicons name="trash-outline" size={15} color="#69736a" />
                    <Text className="text-[12px] font-sans-semibold text-ink-3">
                      {removing === item.id ? "Removing…" : "Remove"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
