import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import agentsService, { type AgentStats } from "@/api/services/agents";
import listingsService from "@/api/services/listings";
import type { Listing } from "@/api/types";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_3 = "#7f857f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const STATUS_UI: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: "Live", bg: "#e3efe7", fg: PRIMARY_INK },
  PENDING_REVIEW: { label: "In review", bg: "#f5ead4", fg: "#6b4a16" },
  PAUSED: { label: "Paused", bg: "#f0f0f0", fg: "#4d524f" },
  SOLD: { label: "Sold", bg: "#1a2120", fg: "#ffffff" },
  RENTED: { label: "Rented", bg: "#1a2120", fg: "#ffffff" },
  ARCHIVED: { label: "Archived", bg: "#f0f0f0", fg: "#7f857f" },
};

export default function AgentHomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        agentsService.getStats(),
        listingsService.listMine({ limit: 5 }),
      ]);
      setStats(s);
      setListings(l.items);
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

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  const upNext: { tag: string; title: string; href: Href }[] = [];
  if (stats?.leads.new) {
    upNext.push({
      tag: "Leads",
      title: `${stats.leads.new} new lead${stats.leads.new === 1 ? "" : "s"} to follow up`,
      href: "/(agent-tabs)/leads" as Href,
    });
  }
  if (stats?.viewings.upcoming) {
    upNext.push({
      tag: "Viewings",
      title: `${stats.viewings.upcoming} upcoming viewing${stats.viewings.upcoming === 1 ? "" : "s"}`,
      href: "/(agent-tabs)/listings" as Href,
    });
  }
  if (stats?.listings.pendingReview) {
    upNext.push({
      tag: "Listings",
      title: `${stats.listings.pendingReview} listing${stats.listings.pendingReview === 1 ? "" : "s"} in review`,
      href: "/(agent-tabs)/listings" as Href,
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="bg-primary-soft px-5 pt-3 pb-5">
          <View className="flex-row items-center gap-3.5">
            <PLAvatar initials={initialsOf(user?.name)} size={56} tone="primary" />
            <View className="flex-1">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase"
                style={{ color: PRIMARY_INK }}
              >
                {greeting}
              </Text>
              <Text
                className="font-serif mt-0.5"
                style={{ fontSize: 22, color: "#1a2120", letterSpacing: -0.5, lineHeight: 26 }}
              >
                <Text className="font-serif-italic">{firstName}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/notifications" as Href)}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
              hitSlop={6}
            >
              <Ionicons name="notifications-outline" size={18} color={PRIMARY_INK} />
            </Pressable>
          </View>

          {/* Stat strip */}
          <View className="mt-4 flex-row gap-2">
            <StatTile n={stats?.listings.active ?? 0} l="Live listings" />
            <StatTile n={stats?.leads.total ?? 0} l="Total leads" />
            <StatTile n={stats?.listings.totalViews ?? 0} l="Views" />
          </View>
        </View>

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <>
            {/* Up next */}
            {upNext.length > 0 && (
              <>
                <SectionLabel className="px-5 pt-4">Up next</SectionLabel>
                <View className="px-4 pt-2.5 gap-2">
                  {upNext.map((u) => (
                    <Pressable
                      key={u.tag}
                      onPress={() => router.push(u.href)}
                      className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
                      style={{ borderWidth: 0.5 }}
                    >
                      <View className="flex-1">
                        <Text className="text-[10px] font-sans-bold tracking-widest uppercase text-primary">
                          {u.tag}
                        </Text>
                        <Text className="text-[13.5px] font-sans-bold text-ink mt-0.5">
                          {u.title}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color={INK_3} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Quick actions */}
            <SectionLabel className="px-5 pt-5">Quick actions</SectionLabel>
            <View className="px-4 pt-2.5 flex-row gap-2">
              <QuickAction
                icon="add-circle-outline"
                label="New listing"
                onPress={() => router.push("/create-listing" as Href)}
              />
              <QuickAction
                icon="people-outline"
                label="Leads"
                onPress={() => router.push("/(agent-tabs)/leads" as Href)}
              />
              <QuickAction
                icon="albums-outline"
                label="Listings"
                onPress={() => router.push("/(agent-tabs)/listings" as Href)}
              />
            </View>

            {/* Listings */}
            <View className="px-5 pt-5 flex-row items-baseline justify-between">
              <SectionLabel>Your listings</SectionLabel>
              <Pressable onPress={() => router.push("/(agent-tabs)/listings" as Href)} hitSlop={6}>
                <Text className="text-xs font-sans-bold text-primary">See all</Text>
              </Pressable>
            </View>
            {listings.length === 0 ? (
              <View className="px-4 pt-2">
                <View className="bg-white rounded-2xl px-4 py-8 items-center border-line" style={{ borderWidth: 0.5 }}>
                  <Text className="text-[13px] font-sans-bold text-ink">No listings yet</Text>
                  <Text className="text-[12px] text-ink-3 mt-1 text-center">
                    Create your first listing to start getting leads.
                  </Text>
                  <Pressable
                    onPress={() => router.push("/create-listing" as Href)}
                    className="mt-3 px-4 py-2 rounded-full bg-primary active:opacity-80"
                  >
                    <Text className="text-white text-[12px] font-sans-bold">New listing</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="px-4 pt-2 gap-2">
                {listings.slice(0, 3).map((l) => (
                  <ListingRow key={l.id} listing={l} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ n, l }: { n: number; l: string }) {
  return (
    <View
      className="flex-1 bg-white rounded-xl border-line"
      style={{ borderWidth: 0.5, paddingHorizontal: 8, paddingVertical: 10 }}
    >
      <Text className="font-serif text-ink" style={{ fontSize: 20, letterSpacing: -0.4 }}>
        {n}
      </Text>
      <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
        {l}
      </Text>
    </View>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-2xl items-center justify-center gap-1.5 py-4 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <Ionicons name={icon} size={22} color={PRIMARY} />
      <Text className="text-[12px] font-sans-bold text-ink">{label}</Text>
    </Pressable>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const meta = STATUS_UI[listing.status] ?? STATUS_UI.PAUSED;
  return (
    <Pressable
      onPress={() => router.push(`/agent-listing/${listing.id}` as Href)}
      className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <Image
        source={listing.coverImage}
        style={{ width: 56, height: 56, borderRadius: 10 }}
        contentFit="cover"
      />
      <View className="flex-1">
        <Text className="text-[13.5px] font-sans-bold text-ink" numberOfLines={1}>
          {listing.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3" numberOfLines={1}>
          {listing.location}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <View className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: meta.bg }}>
            <Text
              className="text-[9.5px] font-sans-bold tracking-widest uppercase"
              style={{ color: meta.fg }}
            >
              {meta.label}
            </Text>
          </View>
          <Text className="text-[11px] font-sans-semibold text-ink-3">
            {listing.viewsCount} views
          </Text>
        </View>
      </View>
      <Text className="font-serif text-ink" style={{ fontSize: 15, letterSpacing: -0.3 }}>
        {listing.priceLabel}
      </Text>
    </Pressable>
  );
}
