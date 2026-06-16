import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import type { Listing } from "@/api/types";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const STATUS_UI: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: "Live", bg: "#e3efe7", fg: PRIMARY_INK },
  PENDING_REVIEW: { label: "In review", bg: "#f5ead4", fg: "#6b4a16" },
  PAUSED: { label: "Paused", bg: "#f0f0f0", fg: INK_2 },
  SOLD: { label: "Sold", bg: "#1a2120", fg: "#ffffff" },
  RENTED: { label: "Rented", bg: "#1a2120", fg: "#ffffff" },
  ARCHIVED: { label: "Archived", bg: "#f0f0f0", fg: INK_3 },
};

type TabId = "all" | "ACTIVE" | "PENDING_REVIEW" | "PAUSED" | "closed";
const CLOSED = ["SOLD", "RENTED", "ARCHIVED"];
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ACTIVE", label: "Live" },
  { id: "PENDING_REVIEW", label: "In review" },
  { id: "PAUSED", label: "Paused" },
  { id: "closed", label: "Closed" },
];

export default function AgentListingsScreen() {
  const [tab, setTab] = useState<TabId>("all");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await listingsService.listMine({ limit: 100 });
      setItems(res.items);
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    c.ACTIVE = items.filter((l) => l.status === "ACTIVE").length;
    c.PENDING_REVIEW = items.filter((l) => l.status === "PENDING_REVIEW").length;
    c.PAUSED = items.filter((l) => l.status === "PAUSED").length;
    c.closed = items.filter((l) => CLOSED.includes(l.status)).length;
    return c;
  }, [items]);

  const filtered =
    tab === "all"
      ? items
      : tab === "closed"
        ? items.filter((l) => CLOSED.includes(l.status))
        : items.filter((l) => l.status === tab);

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

        {/* Sticky tabs */}
        <View className="bg-cream" style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}>
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
                    className={`text-[13px] ${on ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"}`}
                  >
                    {t.label} · {counts[t.id] ?? 0}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        {loading ? (
          <View className="py-16 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
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
                  {items.length === 0 ? "No listings yet" : "Nothing here"}
                </Text>
                <Text className="text-[11.5px] text-ink-3 mt-1 text-center px-8">
                  {items.length === 0
                    ? "Tap + to create your first listing."
                    : "No listings in this tab."}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const meta = STATUS_UI[listing.status] ?? STATUS_UI.PAUSED;
  return (
    <Pressable
      onPress={() => router.push(`/agent-listing/${listing.id}` as Href)}
      className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      {/* Status header */}
      <View
        className="flex-row items-center justify-between px-3.5 py-2"
        style={{ backgroundColor: meta.bg }}
      >
        <Text
          className="text-[10.5px] font-sans-bold tracking-widest uppercase"
          style={{ color: meta.fg }}
        >
          {meta.label}
        </Text>
        <Text
          className="text-[10.5px] font-sans-bold tracking-wider"
          style={{ color: meta.fg, opacity: 0.85 }}
        >
          {listing.viewsCount} views
        </Text>
      </View>

      {/* Body */}
      <View className="flex-row gap-3 p-3">
        <Image
          source={listing.coverImage}
          style={{ width: 70, height: 70, borderRadius: 12 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1} style={{ flex: 1 }}>
              {listing.title}
            </Text>
            <Text className="font-serif text-ink ml-2" style={{ fontSize: 16, letterSpacing: -0.3 }}>
              {listing.priceLabel}
            </Text>
          </View>
          <Text className="text-[11.5px] text-ink-3 mt-0.5" numberOfLines={1}>
            {listing.location}
          </Text>
          <View className="flex-row gap-3 mt-2">
            <MetricChip icon="bed-outline" value={`${listing.beds}`} label="bed" />
            <MetricChip icon="water-outline" value={`${listing.baths}`} label="bath" />
            {!!listing.sqft && (
              <MetricChip icon="resize-outline" value={`${listing.sqft}`} label="m²" />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function MetricChip({
  icon,
  value,
  label,
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
