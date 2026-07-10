import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appear, PressableScale, stagger } from "@/components/anim";
import listingsService from "@/api/services/listings";
import { useAuth } from "@/context/auth";
import type { Listing, ListingType } from "@/api/types";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
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

type Scope = "mine" | "all";
const SCOPES: { id: Scope; label: string }[] = [
  { id: "mine", label: "My listings" },
  { id: "all", label: "All listings" },
];

type TabId = "all" | "ACTIVE" | "PENDING_REVIEW" | "PAUSED" | "closed";
const CLOSED = ["SOLD", "RENTED", "ARCHIVED"];
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ACTIVE", label: "Live" },
  { id: "PENDING_REVIEW", label: "In review" },
  { id: "PAUSED", label: "Paused" },
  { id: "closed", label: "Closed" },
];

type TypeFilter = "all" | ListingType;
const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "SALE", label: "Buy" },
  { id: "RENT", label: "Rent" },
  { id: "SHORTLET", label: "Shortlet" },
];

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

export default function AgentListingsScreen() {
  const { user } = useAuth();
  const myId = user?.id;

  const [scope, setScope] = useState<Scope>("mine");

  // Mine — the agent's own portfolio (any status).
  const [tab, setTab] = useState<TabId>("all");
  const [mine, setMine] = useState<Listing[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);

  // All — the live marketplace.
  const [all, setAll] = useState<Listing[]>([]);
  const [allTotal, setAllTotal] = useState(0);
  const [loadingAll, setLoadingAll] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const loadMine = useCallback(async () => {
    try {
      const res = await listingsService.listMine({ limit: 100 });
      setMine(res.items);
    } catch {
      /* leave empty */
    } finally {
      setLoadingMine(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const res = await listingsService.list({ limit: 100, sort: "newest" });
      setAll(res.items);
      setAllTotal(res.total);
    } catch {
      /* leave empty */
    } finally {
      setLoadingAll(false);
    }
  }, []);

  // Portfolio stays fresh on every focus (the agent edits/creates here).
  useFocusEffect(
    useCallback(() => {
      loadMine();
    }, [loadMine]),
  );

  // The marketplace loads lazily the first time the agent switches to it.
  useEffect(() => {
    if (scope === "all") loadAll();
  }, [scope, loadAll]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mine.length };
    c.ACTIVE = mine.filter((l) => l.status === "ACTIVE").length;
    c.PENDING_REVIEW = mine.filter((l) => l.status === "PENDING_REVIEW").length;
    c.PAUSED = mine.filter((l) => l.status === "PAUSED").length;
    c.closed = mine.filter((l) => CLOSED.includes(l.status)).length;
    return c;
  }, [mine]);

  const mineFiltered =
    tab === "all"
      ? mine
      : tab === "closed"
        ? mine.filter((l) => CLOSED.includes(l.status))
        : mine.filter((l) => l.status === tab);

  const allFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((l) => {
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        (l.agent?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [all, query, typeFilter]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-5 pt-1 pb-3 bg-cream">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
                {scope === "mine" ? "Your portfolio" : "The marketplace"}
              </Text>
              <Text
                className="font-serif text-ink mt-1"
                style={{ fontSize: 30, letterSpacing: -0.7, lineHeight: 32 }}
              >
                {scope === "mine" ? (
                  <>
                    Your <Text className="font-serif-italic">listings</Text>
                  </>
                ) : (
                  <>
                    All <Text className="font-serif-italic">listings</Text>
                  </>
                )}
              </Text>
            </View>
            <PressableScale
              onPress={() => router.push("/create-listing" as Href)}
              activeScale={0.9}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: PRIMARY,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: PRIMARY,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <Ionicons name="add" size={23} color="#ffffff" />
            </PressableScale>
          </View>
          {scope === "mine" && !loadingMine && mine.length > 0 && (
            <View className="mt-3 self-start rounded-full px-3 py-1.5 flex-row items-center gap-1.5" style={{ backgroundColor: "#e3efe7" }}>
              <Ionicons name="pulse-outline" size={13} color={PRIMARY} />
              <Text className="text-[11px] font-sans-bold" style={{ color: PRIMARY_INK }}>
                {counts.ACTIVE} live · {mine.reduce((sum, l) => sum + (l.viewsCount ?? 0), 0).toLocaleString("en-NG")} total views
              </Text>
            </View>
          )}
        </View>

        {/* Sticky controls: scope toggle + scope-specific filters */}
        <View className="bg-cream px-5 pt-1 pb-2" style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}>
          {/* Scope toggle */}
          <View className="flex-row rounded-full p-1" style={{ backgroundColor: "#ece6df" }}>
            {SCOPES.map((s) => {
              const on = scope === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setScope(s.id)}
                  className="flex-1 rounded-full items-center"
                  style={{
                    paddingVertical: 9,
                    backgroundColor: on ? PRIMARY : "transparent",
                    shadowColor: PRIMARY,
                    shadowOpacity: on ? 0.25 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: on ? 2 : 0,
                  }}
                >
                  <Text
                    className="text-[13px]"
                    style={{
                      fontFamily: "Inter_700Bold",
                      color: on ? "#ffffff" : INK_2,
                    }}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Mine: status tabs */}
          {scope === "mine" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 18, paddingTop: 12, paddingBottom: 2 }}
            >
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTab(t.id)}
                    style={{
                      paddingBottom: 6,
                      borderBottomWidth: on ? 2 : 0,
                      borderBottomColor: INK,
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
          )}

          {/* All: search + type chips */}
          {scope === "all" && (
            <View style={{ paddingTop: 12 }}>
              <View
                className="flex-row items-center bg-white rounded-full px-3.5 border-line"
                style={{ borderWidth: 0.5, height: 40 }}
              >
                <Ionicons name="search" size={16} color={INK_3} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search title, area or agent"
                  placeholderTextColor={INK_3}
                  className="flex-1 ml-2 text-ink text-[13.5px]"
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={INK_3} />
                  </Pressable>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 2 }}
              >
                {TYPE_FILTERS.map((f) => {
                  const on = typeFilter === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setTypeFilter(f.id)}
                      className="px-3.5 py-1.5 rounded-full"
                      style={{
                        backgroundColor: on ? INK : "#ffffff",
                        borderWidth: on ? 0 : 1,
                        borderColor: LINE,
                      }}
                    >
                      <Text
                        className="text-[12.5px] font-sans-bold"
                        style={{ color: on ? "#ffffff" : INK_2 }}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* List */}
        {scope === "mine" ? (
          loadingMine && mine.length === 0 ? (
            <Loader />
          ) : (
            <View className="px-4 pt-3 gap-3">
              {mineFiltered.map((l, i) => (
                <Appear key={l.id} delay={stagger(Math.min(i, 8))}>
                  <PortfolioCard listing={l} />
                </Appear>
              ))}
              {mineFiltered.length === 0 && (
                <EmptyState
                  icon="albums-outline"
                  title={mine.length === 0 ? "No listings yet" : "Nothing here"}
                  detail={
                    mine.length === 0
                      ? "Tap + to create your first listing."
                      : "No listings in this tab."
                  }
                />
              )}
            </View>
          )
        ) : loadingAll && all.length === 0 ? (
          <Loader />
        ) : (
          <View className="px-4 pt-3 gap-3.5">
            {allFiltered.length > 0 && (
              <Text className="text-[11.5px] font-sans-semibold text-ink-3 px-1">
                {allFiltered.length} of {allTotal} live{" "}
                {allTotal === 1 ? "listing" : "listings"}
              </Text>
            )}
            {allFiltered.map((l, i) => (
              <Appear key={l.id} delay={stagger(Math.min(i, 8))}>
                <MarketCard listing={l} mine={l.agent?.id === myId} />
              </Appear>
            ))}
            {allFiltered.length === 0 && (
              <EmptyState
                icon="search-outline"
                title="No matches"
                detail="Try a different search or filter."
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Loader() {
  return (
    <View className="py-16 items-center">
      <BouncyLoader color={PRIMARY} />
    </View>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}) {
  return (
    <Appear delay={60} from="fade">
      <View
        className="bg-white rounded-3xl py-12 items-center"
        style={{
          shadowColor: INK,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 1,
        }}
      >
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <Ionicons name={icon} size={28} color={PRIMARY} />
        </View>
        <Text className="text-[14px] font-sans-bold text-ink">{title}</Text>
        <Text className="text-[12px] text-ink-3 mt-1.5 text-center px-8 leading-5">
          {detail}
        </Text>
      </View>
    </Appear>
  );
}

/** The agent's own listing — status header, compact row, opens the manage screen. */
function PortfolioCard({ listing }: { listing: Listing }) {
  const meta = STATUS_UI[listing.status] ?? STATUS_UI.PAUSED;
  return (
    <PressableScale
      onPress={() => router.push(`/agent-listing/${listing.id}` as Href)}
      activeScale={0.985}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        shadowColor: INK,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
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
          style={{ width: 82, height: 82, borderRadius: 14 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={2} style={{ flex: 1, lineHeight: 18 }}>
              {listing.title}
            </Text>
            <Text className="font-serif text-ink ml-2" style={{ fontSize: 16, letterSpacing: -0.3 }}>
              {listing.priceLabel}
            </Text>
          </View>
          <Text className="text-[11.5px] text-ink-3 mt-1" numberOfLines={1}>
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
    </PressableScale>
  );
}

/** A marketplace listing — photo-led, agent attribution, opens the public page. */
function MarketCard({ listing, mine }: { listing: Listing; mine: boolean }) {
  const agent = listing.agent;
  return (
    <PressableScale
      onPress={() => router.push(`/property/${listing.id}` as Href)}
      activeScale={0.985}
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        shadowColor: INK,
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      {/* Cover */}
      <View>
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: 178 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          locations={[0.45, 1]}
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        {/* Price */}
        <View className="absolute left-3 bottom-3 bg-ink/90 rounded-full px-3 py-1.5">
          <Text className="text-white font-sans-bold text-[13px]">
            {listing.priceLabel}
            {listing.period ? (
              <Text className="text-white/70 font-sans-medium"> {listing.period}</Text>
            ) : null}
          </Text>
        </View>
        {/* Yours / type badge */}
        <View className="absolute right-3 top-3 flex-row gap-1.5">
          {mine && (
            <View className="bg-primary rounded-full px-2.5 py-1">
              <Text className="text-white font-sans-bold text-[10px] tracking-widest uppercase">
                Yours
              </Text>
            </View>
          )}
          {listing.verified && (
            <View className="bg-white/90 rounded-full w-6 h-6 items-center justify-center">
              <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View className="p-3.5">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[15px] font-sans-bold text-ink flex-1" numberOfLines={2} style={{ lineHeight: 19 }}>
            {listing.title}
          </Text>
          {listing.rating > 0 && (
            <View className="flex-row items-center gap-1 ml-2">
              <Ionicons name="star" size={11} color="#b9842c" />
              <Text className="text-[11.5px] font-sans-bold text-ink">
                {listing.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-[12px] text-ink-3 mt-0.5" numberOfLines={1}>
          {listing.location}
        </Text>

        <View className="flex-row gap-3.5 mt-2.5">
          <MetricChip icon="bed-outline" value={`${listing.beds}`} label="bed" />
          <MetricChip icon="water-outline" value={`${listing.baths}`} label="bath" />
          {!!listing.sqft && (
            <MetricChip icon="resize-outline" value={`${listing.sqft}`} label="m²" />
          )}
        </View>

        {/* Agent */}
        {agent && (
          <View
            className="flex-row items-center gap-2 mt-3 pt-3"
            style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}
          >
            <PLAvatar initials={initialsOf(agent.name)} uri={agent.avatarUrl} size={26} tone="primary" />
            <Text className="text-[12px] font-sans-semibold text-ink-2 flex-1" numberOfLines={1}>
              {agent.name}
              {agent.agency ? (
                <Text className="text-ink-3 font-sans-medium"> · {agent.agency}</Text>
              ) : null}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={INK_3} />
          </View>
        )}
      </View>
    </PressableScale>
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
