import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { NotificationBell } from "@/components/brand/NotificationBell";
import notificationsService from "@/api/services/notifications";
import { Skeleton } from "@/components/brand/Skeleton";
import {
  Appear,
  PressableScale,
  SaveHeart,
  Reveal,
  RevealScrollView,
} from "@/components/anim";
import { tapLight, tapSelection } from "@/lib/haptics";
import { MODES, type Mode } from "@/mocks/home";
import listingsService from "@/api/services/listings";
import agentsService, { type PublicAgent } from "@/api/services/agents";
import type { Listing, ListingType } from "@/api/types";
import { useAuth } from "@/context/auth";
import { useSelectedLocation, labelForLocation } from "@/lib/location";
import { useRecentlyViewed } from "@/lib/recentlyViewed";
import { LocationSheet } from "@/components/LocationSheet";
import { AdSlot, SplashAd } from "@/components/AdSlot";

// The minimal shape the horizontal rail cards render — satisfied by both a full
// Listing and a stored RecentListing.
type RailListing = {
  id: string;
  title: string;
  location: string;
  priceLabel: string;
  period?: string | null;
  coverImage: string;
};

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

const PRIMARY = "#1f6f43"; // brand green — accent (was blue in the reference)
const ACCENT = "#b9842c"; // gold — rating stars only
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

// Rentals at/under this yearly price power the "Affordable rentals" rail.
const AFFORDABLE_MAX = 5_000_000;
// An agent needs at least this many listings to count as a "Top agent".
const TOP_AGENT_MIN_LISTINGS = 5;

const MODE_TO_TYPE: Record<Mode, ListingType> = {
  Rent: "RENT",
  Buy: "SALE",
  Shortlet: "SHORTLET",
};

const MODE_HEADING: Record<Mode, string> = {
  Rent: "Homes for rent",
  Buy: "Homes for sale",
  Shortlet: "Shortlet stays",
};

// ─────────────────────────────────────────────────────────────────
// Buyer home — photo-led 2-up grid, neutral (ink/white/cream) palette.
// ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>("Rent");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const location = useSelectedLocation();

  // Curated rails (independent of the active mode).
  const [recent, setRecent] = useState<Listing[]>([]);
  const [affordable, setAffordable] = useState<Listing[]>([]);
  const [topAgents, setTopAgents] = useState<PublicAgent[]>([]);
  // Personal "continue where you left off" — updates the instant a listing opens.
  const recentlyViewed = useRecentlyViewed();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listingsService
      .list({
        type: MODE_TO_TYPE[mode],
        sort: "newest",
        limit: 20,
        ...(location ? { location } : {}),
      })
      .then((res) => {
        if (active) setItems(res.items);
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
  }, [mode, reloadKey, location]);

  // Rails load once per location change — not on every mode tap.
  useEffect(() => {
    let on = true;
    const loc = location ? { location } : {};
    const empty = { items: [] as Listing[] };
    Promise.all([
      listingsService
        .list({ sort: "newest", limit: 10, ...loc })
        .catch(() => empty),
      listingsService
        .list({
          type: "RENT",
          maxPrice: AFFORDABLE_MAX,
          sort: "price_asc",
          limit: 10,
          ...loc,
        })
        .catch(() => empty),
      agentsService
        .list({ sort: "most_listings", limit: 12 })
        .catch(() => ({ items: [] as PublicAgent[] })),
    ]).then(([r, a, ag]) => {
      if (!on) return;
      setRecent(r.items ?? []);
      setAffordable(a.items ?? []);
      setTopAgents(
        (ag.items ?? [])
          .filter((x) => (x.listingsCount ?? 0) >= TOP_AGENT_MIN_LISTINGS)
          .slice(0, 10),
      );
    });
    return () => {
      on = false;
    };
  }, [location, reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <RevealScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <Header />
        <Greeting />
        <ServiceLoopEntry />
        <AdvertiseEntry />
        <SearchRow query={query} onChange={setQuery} />
        <ModeChips active={mode} onSelect={setMode} />

        {/* Paid brand banner — renders nothing when no campaign is live */}
        <AdSlot
          placement="HOME_BANNER"
          style={{ marginHorizontal: 20, marginTop: 16 }}
        />

        {/* Jump back in — recently viewed (returning users only) */}
        {recentlyViewed.length > 0 && (
          <>
            <SectionHeader title="Jump back in" />
            <ListingRail items={recentlyViewed} />
          </>
        )}

        <Text className="px-5 pt-5 text-[16px] font-sans-bold text-ink tracking-tight">
          {MODE_HEADING[mode]}
        </Text>

        {loading ? (
          <View className="flex-row flex-wrap px-5 pt-3.5" style={{ gap: 14 }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </View>
        ) : error ? (
          <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
        ) : filtered.length === 0 ? (
          <EmptyState query={query} mode={mode} />
        ) : (
          <View className="flex-row flex-wrap px-5 pt-3.5" style={{ gap: 14 }}>
            {filtered.map((h, i) => (
              <Fragment key={h.id}>
                {/* Sponsored card as its own grid cell after the 4th listing.
                    AdSlot renders null with no live campaign — no empty cell. */}
                {i === 4 && (
                  <AdSlot
                    placement="HOME_FEED"
                    variant="card"
                    style={{ width: "47.5%" }}
                  />
                )}
                <Reveal style={{ width: "47.5%" }}>
                  <HomeCard listing={h} />
                </Reveal>
              </Fragment>
            ))}
          </View>
        )}

        {/* Curated rails — only render when there's something to show. */}
        {recent.length > 0 && (
          <>
            <SectionHeader title="Recently added" />
            <ListingRail items={recent} />
          </>
        )}
        {affordable.length > 0 && (
          <>
            <SectionHeader title="Affordable rentals" />
            <ListingRail items={affordable} />
          </>
        )}
        {topAgents.length > 0 && (
          <>
            <SectionHeader
              title="Top agents"
              actionLabel="View more"
              onAction={() => {
                tapLight();
                router.push("/top-agents" as Href);
              }}
            />
            <AgentRail items={topAgents} />
          </>
        )}
      </RevealScrollView>

      {/* Full-screen sponsored interstitial — once per session, only when a
          SPLASH campaign is live. */}
      <SplashAd />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Header — location pill + bell + avatar
// ─────────────────────────────────────────────────────────────────
function Header() {
  const { user } = useAuth();
  const location = useSelectedLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const label = labelForLocation(location);

  // Keep the bell's count fresh each time the home tab regains focus.
  useFocusEffect(
    useCallback(() => {
      let on = true;
      notificationsService
        .unreadCount()
        .then((r) => on && setUnread(r.unread))
        .catch(() => {});
      return () => {
        on = false;
      };
    }, []),
  );
  return (
    <View className="px-5 pt-1 flex-row items-center justify-between">
      <Pressable
        onPress={() => {
          tapLight();
          setPickerOpen(true);
        }}
        hitSlop={8}
        className="flex-row items-center gap-2 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`Current location, ${label}. Tap to change.`}
      >
        <Ionicons name="location-outline" size={22} color={INK} />
        <View className="flex-row items-center gap-1.5 bg-ink rounded-full pl-3 pr-2.5 py-1.5">
          <Text className="text-[12.5px] font-sans-bold text-white">
            {label}
          </Text>
          <Ionicons name="chevron-down" size={13} color="#ffffff" />
        </View>
      </Pressable>

      <LocationSheet
        visible={pickerOpen}
        selected={location}
        onClose={() => setPickerOpen(false)}
      />

      <View className="flex-row items-center gap-2.5">
        <NotificationBell
          count={unread}
          onPress={() => {
            tapLight();
            router.push("/notifications" as Href);
          }}
          size={40}
          iconColor={INK}
          bgColor="#f0f0f0"
          badgeBorderColor="#ffffff"
        />
        <Pressable
          onPress={() => {
            tapLight();
            // The home feed is shared across roles, so send each role to its
            // own profile tab, not always the buyer account screen.
            const profileHref =
              user?.role === "AGENT"
                ? "/(agent-tabs)/profile"
                : user?.role === "VENDOR"
                  ? "/(vendor-tabs)/profile"
                  : "/(tabs)/account";
            router.push(profileHref as Href);
          }}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
        >
          <PLAvatar
            initials={initialsOf(user?.name)}
            uri={user?.avatarUrl}
            size={40}
            tone="primary"
          />
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Greeting — personal, time-aware. Replaces the generic "Discover" head.
// ─────────────────────────────────────────────────────────────────
function Greeting() {
  const { user } = useAuth();
  const first = (user?.name ?? "").trim().split(/\s+/)[0];
  const h = new Date().getHours();
  const tod =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <View className="px-5 pt-4">
      <Text
        className="font-serif text-ink"
        style={{ fontSize: 26, lineHeight: 30, letterSpacing: -0.5 }}
      >
        {tod}
        {first ? (
          <>
            , <Text className="font-serif-italic">{first}</Text>
          </>
        ) : null}
        .
      </Text>
      <Text className="text-[13px] text-ink-2 mt-1 font-sans-medium">
        Buy, Rent &amp; Hire Trusted Professionals.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Search + inline filter
// ─────────────────────────────────────────────────────────────────
function SearchRow({
  query,
  onChange,
}: {
  query: string;
  onChange: (q: string) => void;
}) {
  return (
    <View className="px-5 pt-4">
      <View
        className="rounded-2xl px-4 flex-row items-center gap-2.5"
        style={{ height: 52, backgroundColor: "#f0f0f0" }}
      >
        <Ionicons name="search" size={19} color={INK_3} />
        <TextInput
          value={query}
          onChangeText={onChange}
          placeholder="Search Lagos, Abuja, Lekki…"
          placeholderTextColor={INK_3}
          className="flex-1 text-[14.5px] text-ink font-sans-medium"
          style={{ paddingVertical: 0 }}
          returnKeyType="search"
          accessibilityLabel="Search by city or area"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => onChange("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={19} color={INK_3} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              tapLight();
              router.push("/filters" as Href);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Filters"
          >
            <Ionicons name="options-outline" size={20} color={INK} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mode chips — Rent / Buy / Shortlet
// ─────────────────────────────────────────────────────────────────
function ModeChips({
  active,
  onSelect,
}: {
  active: Mode;
  onSelect: (c: Mode) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5 pt-4 gap-2.5"
    >
      {MODES.map((c) => {
        const isOn = active === c;
        return (
          <Pressable
            key={c}
            onPress={() => {
              tapSelection();
              onSelect(c);
            }}
            className={`px-[18px] rounded-full items-center justify-center ${
              isOn ? "bg-ink" : "bg-cream-2"
            }`}
            style={{ height: 40 }}
            accessibilityRole="button"
            accessibilityState={{ selected: isOn }}
            accessibilityLabel={c}
          >
            <Text
              className={`text-[13.5px] font-sans-bold ${
                isOn ? "text-white" : "text-ink-3"
              }`}
            >
              {c}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Home card — photo with verified badge, price + save in one row.
// ─────────────────────────────────────────────────────────────────
// Compact the rent/shortlet period so the price pill stays short enough to sit
// beside the save button without crowding or clipping it ("/year" → "/yr").
function shortPeriod(period?: string | null) {
  if (!period) return "";
  return period
    .replace(/years?/i, "yr")
    .replace(/months?/i, "mo")
    .replace(/weeks?/i, "wk")
    .replace(/nights?/i, "nt");
}

function HomeCard({ listing }: { listing: Listing }) {
  const period = listing.period ?? "";
  const hasRating = (listing.rating ?? 0) > 0;
  return (
    <PressableScale
      onPress={() => {
        tapLight();
        router.push(`/property/${listing.id}` as Href);
      }}
      activeScale={0.95}
      className="rounded-[18px] overflow-hidden"
      style={{ width: "100%" }}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.location}, ${listing.priceLabel}${period}`}
    >
      <View style={{ height: 168 }} className="relative">
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />

        {/* Top row — verified (left) · price + save together (right) */}
        <View className="absolute top-2.5 left-2.5 right-2.5 flex-row items-center gap-2">
          <View>
            {listing.verified && (
              <View
                className="w-[26px] h-[26px] rounded-lg items-center justify-center"
                style={{ backgroundColor: PRIMARY }}
                accessibilityLabel="Verified listing"
              >
                <Ionicons name="checkmark-sharp" size={16} color="#ffffff" />
              </View>
            )}
          </View>
          {/* Right group shrinks so a long price can't push the save button off
              the card edge (which clips it under overflow-hidden). */}
          <View className="flex-1 flex-row items-center justify-end gap-1.5">
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(26,33,32,0.8)", flexShrink: 1 }}
            >
              <Text
                numberOfLines={1}
                className="text-[12.5px] font-sans-bold text-white"
              >
                {listing.priceLabel}
                {shortPeriod(listing.period)}
              </Text>
            </View>
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{
                backgroundColor: "rgba(26,33,32,0.72)",
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 3,
              }}
            >
              <SaveHeart id={listing.id} size={16} />
            </View>
          </View>
        </View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          locations={[0.4, 1]}
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Rating (only when there is one) + title + location */}
        <View className="absolute left-2.5 right-2.5 bottom-2.5">
          {hasRating && (
            <View className="flex-row items-center gap-1 mb-1">
              <Ionicons name="star" size={11} color={ACCENT} />
              <Text className="text-[11px] font-sans-bold text-white">
                {listing.rating}
              </Text>
            </View>
          )}
          <Text
            className="text-[14px] font-sans-bold text-white tracking-tight"
            numberOfLines={1}
          >
            {listing.title}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons
              name="location"
              size={11}
              color="rgba(255,255,255,0.85)"
            />
            <Text
              className="text-[11px] font-sans-medium text-white/85"
              numberOfLines={1}
            >
              {listing.location}
            </Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

// ─────────────────────────────────────────────────────────────────
// Service Loop — descriptive copy + an explicit "Explore Service" CTA.
// ─────────────────────────────────────────────────────────────────
function ServiceLoopEntry() {
  return (
    <Appear delay={60} style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      <PressableScale
        onPress={() => {
          tapLight();
          router.push("/services" as Href);
        }}
        activeScale={0.98}
        className="rounded-2xl px-4 py-3.5"
        style={{
          backgroundColor: "#e3efe7", // primary.soft
          borderWidth: 1,
          borderColor: "rgba(31,111,67,0.16)",
        }}
        accessibilityRole="button"
        accessibilityLabel="Service Loop — hire verified artisans, paid safely via escrow"
      >
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <Ionicons name="construct" size={19} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-sans-bold text-ink tracking-tight">
              Need an artisan or service provider?
            </Text>
            <Text className="text-[11.5px] text-ink-2 mt-0.5 leading-4">
              Hire verified electricians, plumbers &amp; more — payment via
              escrow.
            </Text>
          </View>
        </View>
        <View
          className="flex-row items-center justify-center gap-1.5 mt-3 rounded-full py-2.5"
          style={{ backgroundColor: PRIMARY }}
        >
          <Text className="text-white font-sans-bold text-[13px]">
            Explore Service
          </Text>
          <Ionicons name="arrow-forward" size={15} color="#ffffff" />
        </View>
      </PressableScale>
    </Appear>
  );
}

//_________________________________________________________________
// ADVERTISE WITH US _

// ─────────────────────────────────────────────────────────────────
// Advertise entry — brands can sponsor placements. Info-only in-app
// (booking + payment happen on the website); taps open the info screen.
// ─────────────────────────────────────────────────────────────────
function AdvertiseEntry() {
  return (
    <Appear delay={90} style={{ paddingHorizontal: 20, paddingTop: 10 }}>
      <PressableScale
        onPress={() => {
          tapLight();
          router.push("/advertise-info" as Href);
        }}
        activeScale={0.98}
        className="rounded-2xl px-4 py-3 flex-row items-center gap-3"
        style={{
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#e1dcd3",
        }}
        accessibilityRole="button"
        accessibilityLabel="Advertise with PropertyLoop — put your brand in front of home movers"
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: "#f5ead4" }}
        >
          <Ionicons name="megaphone" size={19} color="#6b4a16" />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-sans-bold text-ink tracking-tight">
            Advertise with us
          </Text>
          <Text className="text-[11.5px] text-ink-2 mt-0.5 leading-4">
            Put your brand in front of thousands of home movers.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#7f857f" />
      </PressableScale>
    </Appear>
  );
}

// ─────────────────────────────────────────────────────────────────
// Curated rails — section header + horizontal scrollers
// ─────────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="px-5 pt-6 flex-row items-baseline justify-between">
      <Text className="text-[16px] font-sans-bold text-ink tracking-tight">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-xs font-sans-bold text-primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ListingRail({ items }: { items: RailListing[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}
    >
      {items.map((l) => (
        <ListingRailCard key={l.id} listing={l} />
      ))}
    </ScrollView>
  );
}

function ListingRailCard({ listing }: { listing: RailListing }) {
  return (
    <PressableScale
      onPress={() => {
        tapLight();
        router.push(`/property/${listing.id}` as Href);
      }}
      activeScale={0.96}
      style={{ width: 178 }}
    >
      <View
        style={{ height: 120 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />
        <View
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(26,33,32,0.8)", maxWidth: 122 }}
        >
          <Text
            numberOfLines={1}
            className="text-[11.5px] font-sans-bold text-white"
          >
            {listing.priceLabel}
            {shortPeriod(listing.period)}
          </Text>
        </View>
        <View
          className="absolute top-2 left-2 w-7 h-7 rounded-full items-center justify-center"
          style={{
            backgroundColor: "rgba(26,33,32,0.72)",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 3,
          }}
        >
          <SaveHeart id={listing.id} size={15} />
        </View>
      </View>
      <Text
        className="text-[13px] font-sans-bold text-ink mt-1.5"
        numberOfLines={1}
      >
        {listing.title}
      </Text>
      <View className="flex-row items-center gap-1 mt-0.5">
        <Ionicons name="location" size={10} color={INK_3} />
        <Text className="text-[11px] text-ink-3 flex-1" numberOfLines={1}>
          {listing.location}
        </Text>
      </View>
    </PressableScale>
  );
}

function AgentRail({ items }: { items: PublicAgent[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}
    >
      {items.map((a) => (
        <AgentRailCard key={a.id} agent={a} />
      ))}
    </ScrollView>
  );
}

function AgentRailCard({ agent }: { agent: PublicAgent }) {
  const hasRating = (agent.rating ?? 0) > 0;
  return (
    <PressableScale
      onPress={() => {
        tapLight();
        router.push(`/agent-profile/${agent.id}` as Href);
      }}
      activeScale={0.96}
      className="rounded-2xl bg-cream-2 items-center px-3 py-4"
      style={{ width: 150 }}
    >
      <PLAvatar
        initials={initialsOf(agent.name)}
        uri={agent.avatarUrl ?? undefined}
        size={56}
        tone="primary"
      />
      <Text
        className="text-[13px] font-sans-bold text-ink mt-2 text-center"
        numberOfLines={1}
      >
        {agent.name}
      </Text>
      <View className="flex-row items-center gap-1 mt-1">
        {hasRating && (
          <>
            <Ionicons name="star" size={11} color={ACCENT} />
            <Text className="text-[11px] font-sans-bold text-ink">
              {agent.rating}
            </Text>
            <Text className="text-[11px] text-ink-3">·</Text>
          </>
        )}
        <Text className="text-[11px] font-sans-semibold text-ink-3">
          {agent.listingsCount} listings
        </Text>
      </View>
    </PressableScale>
  );
}

// ─────────────────────────────────────────────────────────────────
// Loading + empty states
// ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return <Skeleton style={{ width: "47.5%", height: 168 }} radius={18} />;
}

function EmptyState({ query, mode }: { query: string; mode: Mode }) {
  return (
    <View className="items-center px-6 py-10">
      <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name="home-outline" size={28} color={INK_2} />
      </View>
      <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
        {mode === "Buy"
          ? "No homes for sale yet"
          : mode === "Shortlet"
            ? "No shortlets yet"
            : "No rentals here yet"}
      </Text>
      <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
        {query.trim()
          ? `Nothing matches “${query.trim()}” right now. Try another area or filter.`
          : "New verified homes land here every week — check back soon."}
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center px-6 py-10">
      <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name="cloud-offline-outline" size={28} color={INK_2} />
      </View>
      <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
        Couldn’t load homes
      </Text>
      <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
        Check your connection and try again.
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
      >
        <Text className="text-white text-[13px] font-sans-bold">Try again</Text>
      </Pressable>
    </View>
  );
}
