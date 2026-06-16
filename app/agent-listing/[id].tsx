import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
  type Href,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import type { Listing } from "@/api/types";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const STATUS_UI: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: "Live", bg: "#e3efe7", fg: PRIMARY_INK },
  PENDING_REVIEW: { label: "In review", bg: "#f5ead4", fg: "#6b4a16" },
  PAUSED: { label: "Paused", bg: "#f0f0f0", fg: INK_2 },
  SOLD: { label: "Sold", bg: "#1a2120", fg: "#ffffff" },
  RENTED: { label: "Rented", bg: "#1a2120", fg: "#ffffff" },
  ARCHIVED: { label: "Archived", bg: "#f0f0f0", fg: INK_3 },
};

export default function AgentListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const l = await listingsService.getById(id);
      setListing(l);
    } catch {
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const setStatus = (status: string, confirm: { title: string; message: string; action: string }) => {
    if (!id) return;
    Alert.alert(confirm.title, confirm.message, [
      { text: "Cancel", style: "cancel" },
      {
        text: confirm.action,
        style: status === "ARCHIVED" ? "destructive" : "default",
        onPress: async () => {
          setBusy(true);
          try {
            const updated = await listingsService.update(id, { status });
            setListing(updated);
          } catch (e: any) {
            Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const remove = () => {
    if (!id) return;
    Alert.alert("Delete listing?", "This permanently removes the listing.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await listingsService.remove(id);
            router.replace("/(agent-tabs)/listings" as Href);
          } catch (e: any) {
            Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <BouncyLoader color={PRIMARY} />
      </View>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="albums-outline" size={34} color={INK_3} />
        <Text className="text-[16px] font-sans-bold text-ink mt-4">Listing not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const meta = STATUS_UI[listing.status] ?? STATUS_UI.PAUSED;
  const isClosed = ["SOLD", "RENTED", "ARCHIVED"].includes(listing.status);
  const soldLabel = listing.type === "RENT" ? "Mark as rented" : "Mark as sold";
  const soldStatus = listing.type === "RENT" ? "RENTED" : "SOLD";

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
        <Text className="text-[15px] font-sans-bold text-ink">Listing</Text>
        <Pressable onPress={() => router.push(`/property/${listing.id}` as Href)} hitSlop={8}>
          <Ionicons name="open-outline" size={18} color={INK_2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ height: 210 }} className="relative">
          <Image
            source={listing.coverImage}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View className="absolute top-3 left-3 px-2 py-1 rounded-full" style={{ backgroundColor: meta.bg }}>
            <Text
              className="text-[10.5px] font-sans-bold tracking-widest uppercase"
              style={{ color: meta.fg }}
            >
              {meta.label}
            </Text>
          </View>
        </View>

        <View className="px-5 pt-4">
          <Text className="font-serif text-ink" style={{ fontSize: 26, letterSpacing: -0.5, lineHeight: 28 }}>
            {listing.title}
          </Text>
          <View className="flex-row items-baseline justify-between mt-1.5">
            <Text className="text-[12.5px] text-ink-3" numberOfLines={1} style={{ flex: 1 }}>
              {listing.location}
            </Text>
            <Text className="font-serif text-ink ml-2" style={{ fontSize: 22, letterSpacing: -0.4 }}>
              {listing.priceLabel}
              {listing.period ?? ""}
            </Text>
          </View>

          {/* Metrics */}
          <View className="flex-row gap-2 mt-4">
            <Stat n={`${listing.viewsCount}`} l="Views" tone="primary" />
            <Stat n={`${listing.beds}`} l="Beds" />
            <Stat n={`${listing.baths}`} l="Baths" />
            {!!listing.sqft && <Stat n={`${listing.sqft}`} l="m²" />}
          </View>

          {/* Edit */}
          <Pressable
            onPress={() => router.push(`/create-listing?id=${listing.id}` as Href)}
            className="mt-5 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
            style={{ borderWidth: 0.5 }}
          >
            <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: "#e3efe7" }}>
              <Ionicons name="create-outline" size={17} color={PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold text-ink">Edit details</Text>
              <Text className="text-[11.5px] text-ink-3 mt-0.5">
                Price, photos, description, amenities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={INK_3} />
          </Pressable>

          {/* Lifecycle */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
            Lifecycle
          </Text>
          {busy ? (
            <View className="py-4 items-center">
              <BouncyLoader color={PRIMARY} />
            </View>
          ) : (
            <View className="gap-2">
              {listing.status === "ACTIVE" && (
                <>
                  <LifecycleBtn
                    icon="pause-outline"
                    label="Pause listing"
                    onPress={() =>
                      setStatus("PAUSED", {
                        title: "Pause listing?",
                        message: "Buyers won't see it until you reactivate.",
                        action: "Pause",
                      })
                    }
                  />
                  <LifecycleBtn
                    icon="checkmark-circle-outline"
                    label={soldLabel}
                    tone="primary"
                    onPress={() =>
                      setStatus(soldStatus, {
                        title: soldLabel + "?",
                        message: "This closes the listing.",
                        action: "Confirm",
                      })
                    }
                  />
                </>
              )}
              {listing.status === "PAUSED" && (
                <LifecycleBtn
                  icon="play-outline"
                  label="Reactivate listing"
                  tone="primary"
                  onPress={() =>
                    setStatus("ACTIVE", {
                      title: "Reactivate?",
                      message: "The listing becomes visible to buyers again.",
                      action: "Reactivate",
                    })
                  }
                />
              )}
              {listing.status === "PENDING_REVIEW" && (
                <View className="bg-white rounded-2xl px-3.5 py-3 border-line" style={{ borderWidth: 1 }}>
                  <Text className="text-[12.5px] text-ink-2">
                    This listing is awaiting review. You&apos;ll be notified once it goes live.
                  </Text>
                </View>
              )}
              {isClosed && (
                <View className="bg-white rounded-2xl px-3.5 py-3 border-line" style={{ borderWidth: 1 }}>
                  <Text className="text-[12.5px] text-ink-2">
                    This listing is {meta.label.toLowerCase()}.
                  </Text>
                </View>
              )}
              <LifecycleBtn icon="trash-outline" label="Delete listing" destructive onPress={remove} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}
      >
        <Pressable
          onPress={() => router.push("/(agent-tabs)/leads" as Href)}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            See leads on this listing
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ n, l, tone }: { n: string; l: string; tone?: "primary" }) {
  return (
    <View
      className="flex-1 rounded-xl border-line px-2.5 py-2.5"
      style={{ borderWidth: 0.5, backgroundColor: tone === "primary" ? "#e3efe7" : "#ffffff" }}
    >
      <Text
        className="font-serif"
        style={{ fontSize: 18, letterSpacing: -0.3, color: tone === "primary" ? PRIMARY_INK : INK }}
      >
        {n}
      </Text>
      <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
        {l}
      </Text>
    </View>
  );
}

function LifecycleBtn({
  icon,
  label,
  onPress,
  tone,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: "primary";
  destructive?: boolean;
}) {
  const bg = tone === "primary" ? PRIMARY : destructive ? "#fde6e4" : "#ffffff";
  const fg = tone === "primary" ? "#ffffff" : destructive ? "#b3261e" : INK;
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl px-3.5 py-3 flex-row items-center gap-3 active:opacity-90"
      style={{
        backgroundColor: bg,
        borderWidth: tone === "primary" ? 0 : 1,
        borderColor: destructive ? "transparent" : "#e1dcd3",
      }}
    >
      <Ionicons name={icon} size={17} color={fg} />
      <Text className="text-[13.5px] font-sans-bold" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}
