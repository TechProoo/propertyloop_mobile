import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AGENT_LISTINGS,
  STATUS_META,
  type AgentListing,
  type ListingStatus,
} from "@/mocks/agent";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS: { id: "all" | ListingStatus; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "live",        label: "Live" },
  { id: "under_offer", label: "Under offer" },
  { id: "draft",       label: "Drafts" },
  { id: "let",         label: "Closed" },
];

export default function AgentListingsScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: AGENT_LISTINGS.length };
    TABS.forEach((t) => {
      if (t.id === "all") return;
      c[t.id] = AGENT_LISTINGS.filter((l) => l.status === t.id).length;
    });
    return c;
  }, []);

  const filtered =
    tab === "all"
      ? AGENT_LISTINGS
      : AGENT_LISTINGS.filter((l) => l.status === tab);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header */}
        <View className="px-5 pt-1 pb-3 bg-cream">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
                Your portfolio
              </Text>
              <Text
                className="font-serif text-ink mt-1"
                style={{ fontSize: 30, letterSpacing: -0.7, lineHeight: 32 }}
              >
                Your <Text className="font-serif-italic">listings</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/create-listing" as Href)}
              className="w-11 h-11 rounded-full bg-primary items-center justify-center active:opacity-80"
            >
              <Ionicons name="add" size={22} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Sticky tab strip */}
        <View
          className="bg-cream"
          style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 18 }}
          >
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={{
                    paddingBottom: 12,
                    paddingTop: 4,
                    borderBottomWidth: on ? 2 : 0,
                    borderBottomColor: "#1a2120",
                  }}
                >
                  <Text
                    className={`text-[13px] ${
                      on
                        ? "font-sans-bold text-ink"
                        : "font-sans-semibold text-ink-3"
                    }`}
                  >
                    {t.label} · {counts[t.id] ?? 0}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        <View className="px-4 pt-3 gap-3">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
          {filtered.length === 0 && (
            <View
              className="bg-white rounded-2xl py-12 items-center border-line"
              style={{ borderWidth: 0.5 }}
            >
              <Ionicons name="albums-outline" size={28} color={INK_3} />
              <Text className="text-[13px] font-sans-bold text-ink mt-2">
                Nothing here yet
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-1">
                Add a listing to fill this view.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingCard({ listing }: { listing: AgentListing }) {
  const meta = STATUS_META[listing.status];
  const toneBg =
    meta.tone === "primary" ? "#e3efe7"
    : meta.tone === "accent" ? "#f5ead4"
    : meta.tone === "ink"    ? "#1a2120"
    : "#f0f0f0";
  const toneFg =
    meta.tone === "primary" ? PRIMARY_INK
    : meta.tone === "accent" ? ACCENT_INK
    : meta.tone === "ink"    ? "#ffffff"
    : INK_2;

  return (
    <Pressable
      onPress={() => router.push(`/agent-listing/${listing.id}` as Href)}
      className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      {/* Status header */}
      <View
        className="flex-row items-center justify-between px-3.5 py-2"
        style={{ backgroundColor: toneBg }}
      >
        <Text
          className="text-[10.5px] font-sans-bold tracking-widest uppercase"
          style={{ color: toneFg }}
        >
          {meta.label}
          {listing.featured ? " · Featured" : ""}
        </Text>
        {listing.daysLive > 0 && (
          <Text
            className="text-[10.5px] font-sans-bold tracking-wider"
            style={{ color: toneFg, opacity: 0.85 }}
          >
            {listing.daysLive}d live
          </Text>
        )}
      </View>

      {/* Body */}
      <View className="flex-row gap-3 p-3">
        <View
          style={{
            width: 70, height: 70, borderRadius: 12,
            backgroundColor: "#f0f0f0",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name="image-outline" size={22} color={INK_3} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
              {listing.title}
            </Text>
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 17, letterSpacing: -0.3 }}
            >
              {listing.price}
            </Text>
          </View>
          <Text className="text-[11.5px] text-ink-3 mt-0.5">{listing.area}</Text>
          <View className="flex-row gap-3 mt-2">
            <MetricChip icon="eye-outline"          value={`${listing.views}`}      label="views" />
            <MetricChip icon="heart-outline"        value={`${listing.saves}`}      label="saves" />
            <MetricChip icon="chatbubble-outline"   value={`${listing.inquiries}`}  label="leads" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function MetricChip({
  icon, value, label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={12} color={INK_2} />
      <Text className="text-[11px] font-sans-bold text-ink-2">{value}</Text>
      <Text className="text-[11px] font-sans-medium text-ink-3">{label}</Text>
    </View>
  );
}
