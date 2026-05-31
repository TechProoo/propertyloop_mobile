import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAgentListing,
  LISTING_ANALYTICS,
  STATUS_META,
} from "@/mocks/agent";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function AgentListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getAgentListing(id);
  const meta = STATUS_META[listing.status];
  const toneBg =
    meta.tone === "primary" ? "#e3efe7"
    : meta.tone === "accent" ? "#f5ead4"
    : meta.tone === "ink"    ? INK
    : "#ece6df";
  const toneFg =
    meta.tone === "primary" ? PRIMARY_INK
    : meta.tone === "accent" ? ACCENT_INK
    : meta.tone === "ink"    ? "#ffffff"
    : INK_2;

  const onAction = (label: string) =>
    Alert.alert(label, `${label} on "${listing.title}"`, [
      { text: "Cancel", style: "cancel" },
      { text: label, style: label === "Archive" ? "destructive" : "default" },
    ]);

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
        <Pressable
          onPress={() => router.push(`/property/${listing.id}` as Href)}
          hitSlop={8}
        >
          <Ionicons name="open-outline" size={18} color={INK_2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ height: 210 }} className="relative">
          <Image
            source={`https://picsum.photos/seed/${listing.imageSeed}/1200/800`}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View
            className="absolute top-3 left-3 px-2 py-1 rounded-full"
            style={{ backgroundColor: toneBg }}
          >
            <Text
              className="text-[10.5px] font-sans-bold tracking-widest uppercase"
              style={{ color: toneFg }}
            >
              {meta.label}
            </Text>
          </View>
          {listing.featured && (
            <View className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full">
              <Text className="text-[10.5px] font-sans-bold text-ink tracking-widest uppercase">
                Featured
              </Text>
            </View>
          )}
        </View>

        <View className="px-5 pt-4">
          {/* Title + price */}
          <Text
            className="font-serif text-ink"
            style={{ fontSize: 26, letterSpacing: -0.5, lineHeight: 28 }}
          >
            {listing.title}
          </Text>
          <View className="flex-row items-baseline justify-between mt-1.5">
            <Text className="text-[12.5px] text-ink-3">{listing.area}</Text>
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 22, letterSpacing: -0.4 }}
            >
              {listing.price}
            </Text>
          </View>

          {/* Quick metrics */}
          <View className="flex-row gap-2 mt-4">
            <Stat n={`${listing.views}`}     l="Views" />
            <Stat n={`${listing.saves}`}     l="Saves" />
            <Stat n={`${listing.inquiries}`} l="Leads" tone="primary" />
            <Stat n={`${listing.daysLive}d`} l="Live" />
          </View>

          {/* 7-day analytics */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
            Last 7 days
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Row label="Views"         value={`${LISTING_ANALYTICS.views7d}`}     trend={LISTING_ANALYTICS.viewsTrend}    up />
            <Row label="Contact rate"  value={LISTING_ANALYTICS.contactRate}     trend={LISTING_ANALYTICS.contactTrend} up />
            <Row label="Avg time on page" value={LISTING_ANALYTICS.avgTimeOnPage} />
            <Row label="Save rate"     value={LISTING_ANALYTICS.saveRate} last />
          </View>

          {/* Inline edit shortcut */}
          <Pressable
            onPress={() => router.push(`/create-listing?id=${listing.id}` as Href)}
            className="mt-4 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
            style={{ borderWidth: 0.5 }}
          >
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#e3efe7" }}
            >
              <Ionicons name="create-outline" size={17} color={PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold text-ink">
                Edit details
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-0.5">
                Price, photos, description, amenities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={INK_3} />
          </Pressable>

          {/* Lifecycle actions */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
            Lifecycle
          </Text>
          <View className="gap-2">
            {listing.status === "live" && (
              <>
                <LifecycleBtn icon="pause-outline"     label="Pause listing"       onPress={() => onAction("Pause")} />
                <LifecycleBtn icon="rocket-outline"    label="Boost to featured"   onPress={() => onAction("Boost")} />
              </>
            )}
            {listing.status === "draft" && (
              <LifecycleBtn icon="cloud-upload-outline" label="Publish now" tone="primary" onPress={() => onAction("Publish")} />
            )}
            {listing.status === "under_offer" && (
              <LifecycleBtn icon="checkmark-circle-outline" label="Mark as sold/let" tone="primary" onPress={() => onAction("Mark complete")} />
            )}
            <LifecycleBtn icon="archive-outline" label="Archive" destructive onPress={() => onAction("Archive")} />
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 28,
        }}
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
      style={{
        borderWidth: 0.5,
        backgroundColor: tone === "primary" ? "#e3efe7" : "#ffffff",
      }}
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

function Row({
  label, value, trend, up, last,
}: {
  label: string;
  value: string;
  trend?: string;
  up?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between px-4 py-3"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
      }}
    >
      <Text className="text-[12.5px] font-sans-semibold text-ink-3">{label}</Text>
      <View className="flex-row items-baseline gap-2">
        <Text className="text-[14px] font-sans-bold text-ink">{value}</Text>
        {trend && (
          <Text
            className="text-[11px] font-sans-bold"
            style={{ color: up ? PRIMARY : "#a8421a" }}
          >
            {trend}
          </Text>
        )}
      </View>
    </View>
  );
}

function LifecycleBtn({
  icon, label, onPress, tone, destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: "primary";
  destructive?: boolean;
}) {
  const bg =
    tone === "primary" ? PRIMARY
    : destructive       ? "#fde6e4"
    : "#ffffff";
  const fg =
    tone === "primary" ? "#ffffff"
    : destructive       ? "#b3261e"
    : INK;
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
