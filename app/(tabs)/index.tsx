import { Fragment, useCallback, useEffect, useState } from "react";
import { ARTISAN_CORNER, PRODUCT_MARKETPLACE } from "@/config/features";
import {
  Linking,
  Pressable,
  Share,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { activeFilterCount, useSearchFilters } from "@/lib/searchFilters";
import { useRecentlyViewed } from "@/lib/recentlyViewed";
import { LocationSheet } from "@/components/LocationSheet";
import { AdRail, AdSlot } from "@/components/AdSlot";
import { ProductCard } from "@/components/marketplace/ProductCard";
import marketplaceService, {
  type ProductWithStore,
} from "@/api/services/marketplace";

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

// "yinusa" → "Yinusa" so the greeting always reads properly cased, whatever
// casing the name was entered in.
function titleCase(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

type IonName = keyof typeof Ionicons.glyphMap;

const PRIMARY = "#1f6f43"; // brand green — accent (was blue in the reference)
const ACCENT = "#b9842c"; // gold — rating stars only
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

// Rentals at/under this yearly price power the "Affordable rentals" rail.
const AFFORDABLE_MAX = 5_000_000;
// An agent needs at least this many listings to count as a "Top agent".
const TOP_AGENT_MIN_LISTINGS = 5;

// PL stock filters on who owns the listing, not on rent/sale/shortlet.
const MODE_TO_TYPE: Partial<Record<Mode, ListingType>> = {
  Rent: "RENT",
  Buy: "SALE",
  Shortlet: "SHORTLET",
};

const MODE_HEADING: Record<Mode, string> = {
  Rent: "Homes for rent",
  Buy: "Homes for sale",
  Shortlet: "Shortlet stays",
  "PL stock": "PropertyLoop stock",
};

// ─────────────────────────────────────────────────────────────────
// Buyer home — photo-led 2-up grid, neutral (ink/white/cream) palette.
// ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>("Rent");
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
        ...(mode === "PL stock"
          ? { ownership: "HOUSE" as const }
          : { type: MODE_TO_TYPE[mode] }),
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

  return (
    <View className="flex-1 bg-white">
      <RevealScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Dark hero — mirrors the website: greeting, headline, search and
            category shortcuts on a deep-green field that bleeds under the
            status bar. */}
        <HomeHero mode={mode} onSelectMode={setMode} />
        <QuickActions />

        {/* Paid brand rail — every live HOME_BANNER campaign, scrollable.
            Was a single banner that picked one at random and dropped the
            rest; renders nothing (header included) when none are live. */}
        <AdRail placement="HOME_BANNER" />

        {/* Jump back in — recently viewed (returning users only) */}
        {recentlyViewed.length > 0 && (
          <>
            <SectionHeader title="Jump back in" />
            <ListingRail items={recentlyViewed} />
          </>
        )}

        {/* The Rent/Buy/Shortlet chips sit directly on the grid they switch. They
            used to sit at the top of the screen, above the sponsored rail and
            "Jump back in", so a tap changed a grid the viewer couldn't see and
            read as if nothing had happened. */}
        <Text className="px-5 pt-6 text-[16px] font-sans-bold text-ink tracking-tight">
          {MODE_HEADING[mode]}
        </Text>
        <ModeChips active={mode} onSelect={setMode} />
        {mode === "PL stock" && <PLStockNote />}

        {loading ? (
          <View className="flex-row flex-wrap px-5 pt-3.5" style={{ gap: 14 }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </View>
        ) : error ? (
          <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
        ) : items.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          <View className="flex-row flex-wrap px-5 pt-3.5" style={{ gap: 14 }}>
            {items.map((h, i) => (
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

        {/* Shop the marketplace — furniture, materials and décor. */}
        <MarketplaceSection />

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

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// HomeHero — the dark-green hero: location + bell + avatar, a headline,
// the search launcher and category shortcuts. Mirrors the website hero and
// bleeds under the status bar.
// ─────────────────────────────────────────────────────────────────
const HERO_BG = "#0f2e1b";

const HERO_PILLS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  mode?: Mode;
  href?: Href;
}[] = [
  { label: "Buy", icon: "home-outline", mode: "Buy" },
  { label: "Rent", icon: "key-outline", mode: "Rent" },
  { label: "Shortlet", icon: "bed-outline", mode: "Shortlet" },
  { label: "Find agent", icon: "person-outline", href: "/top-agents" as Href },
  ...(PRODUCT_MARKETPLACE
    ? [
        {
          label: "Marketplace",
          icon: "cart-outline" as keyof typeof Ionicons.glyphMap,
          href: "/marketplace" as Href,
        },
      ]
    : []),
];

function HomeHero({
  mode,
  onSelectMode,
}: {
  mode: Mode;
  onSelectMode: (m: Mode) => void;
}) {
  const insets = useSafeAreaInsets();
  const { user, status } = useAuth();
  const location = useSelectedLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const label = labelForLocation(location);
  const first = titleCase((user?.name ?? "").trim().split(/\s+/)[0] ?? "");
  const count = activeFilterCount(useSearchFilters());

  useFocusEffect(
    useCallback(() => {
      if (status !== "authed") {
        setUnread(0);
        return;
      }
      let on = true;
      notificationsService
        .unreadCount()
        .then((r) => on && setUnread(r.unread))
        .catch(() => {});
      return () => {
        on = false;
      };
    }, [status]),
  );

  return (
    <View
      style={{ paddingTop: insets.top + 8, backgroundColor: HERO_BG }}
      className="rounded-b-[28px] overflow-hidden"
    >
      <LinearGradient
        colors={[HERO_BG, "#123a23"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Top row */}
      <View className="px-5 pt-1 flex-row items-center justify-between">
        <Pressable
          onPress={() => {
            tapLight();
            setPickerOpen(true);
          }}
          hitSlop={8}
          className="flex-row items-center gap-1.5 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={`Current location, ${label}. Tap to change.`}
        >
          <Ionicons name="location-outline" size={18} color="#ffffff" />
          <View className="flex-row items-center gap-1.5 bg-white/15 rounded-full pl-3 pr-2.5 py-1.5">
            <Text className="text-[12.5px] font-sans-bold text-white">{label}</Text>
            <Ionicons name="chevron-down" size={13} color="#ffffff" />
          </View>
        </Pressable>

        <View className="flex-row items-center gap-2.5">
          <NotificationBell
            count={unread}
            onPress={() => {
              tapLight();
              router.push("/notifications" as Href);
            }}
            size={40}
            iconColor="#ffffff"
            bgColor="rgba(255,255,255,0.15)"
            badgeBorderColor={HERO_BG}
          />
          <Pressable
            onPress={() => {
              tapLight();
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

      <LocationSheet
        visible={pickerOpen}
        selected={location}
        onClose={() => setPickerOpen(false)}
      />

      {/* Headline */}
      <View className="px-5 pt-5">
        <Text
          className="font-serif text-white"
          style={{ fontSize: 30, lineHeight: 35, letterSpacing: -0.6 }}
        >
          {first ? `Hi ${first}, find your` : "Find your next"}
          {"\n"}
          <Text className="font-serif-italic" style={{ color: "#a3e635" }}>
            home — and shop for it.
          </Text>
        </Text>
        <Text className="text-[13px] text-white/60 mt-2 font-sans-medium">
          Verified listings, trusted agents, and everything for your home.
        </Text>
      </View>

      {/* Search launcher */}
      <View className="px-5 pt-4">
        <Pressable
          onPress={() => {
            tapLight();
            router.push("/search-results?focus=1" as Href);
          }}
          className="rounded-2xl pl-4 pr-1.5 flex-row items-center gap-2.5 bg-white active:opacity-95"
          style={{ height: 52 }}
          accessibilityRole="search"
          accessibilityLabel="Search properties by city or area"
        >
          <Ionicons name="search" size={19} color={INK_3} />
          <Text
            numberOfLines={1}
            className="flex-1 text-[14px] font-sans-medium"
            style={{ color: "#5f655f" }}
          >
            Search area, city or landmark…
          </Text>
          <Pressable
            onPress={() => {
              tapLight();
              router.push("/filters" as Href);
            }}
            hitSlop={6}
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: count > 0 ? PRIMARY : "#f0f0f0" }}
            accessibilityRole="button"
            accessibilityLabel={`Filters${count ? `, ${count} applied` : ""}`}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={count > 0 ? "#ffffff" : INK}
            />
          </Pressable>
        </Pressable>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-5 py-4"
      >
        {HERO_PILLS.map((p) => {
          const active = p.mode && p.mode === mode;
          return (
            <Pressable
              key={p.label}
              onPress={() => {
                tapSelection();
                if (p.mode) onSelectMode(p.mode);
                else if (p.href) router.push(p.href);
              }}
              className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 border ${
                active
                  ? "bg-white border-white"
                  : "bg-white/10 border-white/20"
              }`}
            >
              <Ionicons
                name={p.icon}
                size={14}
                color={active ? HERO_BG : "#ffffff"}
              />
              <Text
                className={`text-[12.5px] font-sans-semibold ${
                  active ? "text-primary-ink" : "text-white"
                }`}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

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
// Quick actions — the five non-property entry points
// ─────────────────────────────────────────────────────────────────
//
// These were five stacked full-width cards, each with its own filled CTA
// button, sitting between the greeting and the search field — roughly 700px
// of promo before a buyer could search for a home. They are one horizontal
// rail now: same five destinations, ~110px of height, and search moved above
// them where it belongs.
//
// The button inside each old card was redundant anyway — the whole card was
// already pressable.

// wa.me rather than the whatsapp:// scheme deliberately: the scheme would
// need LSApplicationQueriesSchemes in Info.plist to be checkable on iOS, and
// falls flat when WhatsApp isn't installed. wa.me opens the app when it's
// there and the web client when it isn't.
const SELL_WHATSAPP = "2347053053040";
const SELL_MESSAGE =
  "Hi, I'm a registered buyer on PropertyLoop and I'd like to list a property. Can we discuss?";

interface QuickAction {
  id: string;
  icon: IonName;
  tint: string;
  title: string;
  caption: string;
  a11y: string;
  /** Buyers only — agents and vendors share these tabs. */
  buyerOnly?: boolean;
  onPress: () => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "services",
    icon: "construct",
    tint: PRIMARY,
    title: "Services",
    caption: "Hire artisans",
    a11y: "Service Loop — hire verified artisans, paid safely via escrow",
    onPress: () => router.push("/services" as Href),
  },
  {
    id: "sell",
    icon: "logo-whatsapp",
    tint: "#25D366",
    title: "Sell",
    caption: "List with us",
    a11y: "Have a property to sell? Chat with us on WhatsApp to get it listed",
    buyerOnly: true,
    onPress: () => {
      Linking.openURL(
        `https://wa.me/${SELL_WHATSAPP}?text=${encodeURIComponent(SELL_MESSAGE)}`,
      ).catch(() => {});
    },
  },
  {
    id: "community",
    icon: "chatbubbles",
    tint: "#245a82",
    title: "Community",
    caption: "Market feed",
    a11y: "Community feed — updates, insights and projects from agents",
    onPress: () => router.push("/feed" as Href),
  },
  {
    id: "facility",
    icon: "business",
    tint: "#1f6f43",
    title: "Facilities",
    caption: "Whole buildings",
    a11y: "Facility management — HVAC, plumbing, fire and electrical for whole buildings",
    onPress: () => router.push("/facility-management" as Href),
  },
  {
    id: "advertise",
    // Info-only in-app: /advertise-info hides pricing and the external payment
    // link, keeping it App Store 3.1.1-safe on iOS.
    icon: "megaphone",
    tint: "#6b4a16",
    title: "Advertise",
    caption: "For brands",
    a11y: "Advertise with PropertyLoop — put your brand in front of home movers",
    onPress: () => router.push("/advertise-info" as Href),
  },
];

function QuickActions() {
  const { user } = useAuth();
  const actions = QUICK_ACTIONS.filter(
    (a) =>
      (!a.buyerOnly || user?.role === "BUYER") &&
      (ARTISAN_CORNER || a.id !== "services"),
  );

  return (
    <Appear delay={60} style={{ paddingTop: 18 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      >
        {actions.map((a) => (
          <QuickTile key={a.id} action={a} />
        ))}
      </ScrollView>
    </Appear>
  );
}

function QuickTile({ action }: { action: QuickAction }) {
  return (
    <PressableScale
      onPress={() => {
        tapLight();
        action.onPress();
      }}
      activeScale={0.96}
      className="rounded-2xl px-3 py-3"
      style={{
        width: 118,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e1dcd3",
      }}
      accessibilityRole="button"
      accessibilityLabel={action.a11y}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        // 14% tint of the action's colour — enough to read as a chip without
        // five saturated blocks competing down the rail.
        style={{ backgroundColor: `${action.tint}24` }}
      >
        <Ionicons name={action.icon} size={18} color={action.tint} />
      </View>
      <Text
        className="text-[13px] font-sans-bold text-ink tracking-tight mt-2.5"
        numberOfLines={1}
      >
        {action.title}
      </Text>
      <Text className="text-[11px] text-ink-3 mt-0.5" numberOfLines={1}>
        {action.caption}
      </Text>
    </PressableScale>
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

const PARTNER_URL = "https://propertyloop.ng/realtors/partners";

/**
 * Share the partner programme with an agent. Anybody on the home screen might
 * know one — a buyer's cousin, a vendor's client — and an agent can sell
 * PropertyLoop stock without listing anything of their own.
 */
function shareWithAgent() {
  void Share.share({
    message:
      "PropertyLoop lets agents sell its own property listings and earn " +
      `commission — free to join:\n\n${PARTNER_URL}`,
  }).catch(() => {
    // Dismissed the share sheet. Nothing to report.
  });
}

/** Sits above the PL stock grid: what these listings are, and who can sell them. */
function PLStockNote() {
  return (
    <PressableScale
      onPress={() => {
        tapLight();
        shareWithAgent();
      }}
      className="mx-5 mt-3 rounded-2xl px-4 py-3 flex-row items-center gap-3"
      style={{ backgroundColor: "#e3efe7" }}
    >
      <Ionicons name="business-outline" size={18} color={PRIMARY} />
      <View className="flex-1">
        <Text className="text-[12.5px] font-sans-bold" style={{ color: "#134a2d" }}>
          Listed by PropertyLoop
        </Text>
        <Text className="text-[11.5px] mt-0.5" style={{ color: INK_2, lineHeight: 16 }}>
          Know an agent? They can sell these and earn commission. Tap to share.
        </Text>
      </View>
      <Ionicons name="share-social-outline" size={17} color={PRIMARY} />
    </PressableScale>
  );
}

function EmptyState({ mode }: { mode: Mode }) {
  if (mode === "PL stock") {
    return (
      <View className="items-center px-6 py-10">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <Ionicons name="business-outline" size={28} color={PRIMARY} />
        </View>
        <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
          No PropertyLoop stock yet
        </Text>
        <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
          PropertyLoop&apos;s own properties land here first. Know an agent? They
          can sell them and earn commission.
        </Text>
        <Pressable
          onPress={() => {
            tapLight();
            shareWithAgent();
          }}
          className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80 flex-row items-center gap-2"
        >
          <Ionicons name="share-social-outline" size={15} color="#ffffff" />
          <Text className="text-white text-[13px] font-sans-bold">Share with an agent</Text>
        </Pressable>
      </View>
    );
  }

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
        {"New verified homes land here every week — check back soon."}
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

// ─────────────────────────────────────────────────────────────────
// MarketplaceSection — the shopping half of the home: shop-by-category
// tiles plus a rail of fresh products, linking into the full catalogue.
// Renders nothing until there's stock, so the home never shows an empty shop.
// ─────────────────────────────────────────────────────────────────
const SHOP_CATEGORIES: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}[] = [
  { label: "Furniture", icon: "bed-outline", tint: "#e3efe7" },
  { label: "Lighting & Decor", icon: "bulb-outline", tint: "#f5ead4" },
  { label: "Building Materials", icon: "construct-outline", tint: "#e7eef5" },
  { label: "Smart Home", icon: "home-outline", tint: "#efe7f5" },
  { label: "Tools & Hardware", icon: "hammer-outline", tint: "#f5e7e7" },
  { label: "Landscaping", icon: "leaf-outline", tint: "#e7f5ea" },
];

function MarketplaceSection() {
  const [products, setProducts] = useState<ProductWithStore[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!PRODUCT_MARKETPLACE) {
      setLoaded(true);
      return;
    }
    let on = true;
    marketplaceService
      .listProducts({ limit: 10, sort: "newest" })
      .then((res) => on && setProducts(res.items))
      .catch(() => {})
      .finally(() => on && setLoaded(true));
    return () => {
      on = false;
    };
  }, []);

  if (!PRODUCT_MARKETPLACE || (loaded && products.length === 0)) return null;

  return (
    <View className="pt-8">
      <View className="mx-5 overflow-hidden rounded-[28px] bg-[#0f2e1b]">
        <LinearGradient
          colors={["#173f29", "#0f2e1b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View className="flex-row items-center justify-between gap-3 px-5 pt-5">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="sparkles" size={13} color="#a3e635" />
              <Text className="text-[10px] font-sans-bold uppercase tracking-[1.7px] text-[#c6e79d]">
                The home edit
              </Text>
            </View>
            <Text className="mt-2 font-serif text-[23px] leading-[28px] text-white">
              Find your place.{" "}
              <Text className="font-serif-italic text-[#c3e890]">Make it yours.</Text>
            </Text>
            <Text className="mt-1.5 max-w-[280px] text-[12px] leading-[18px] text-white/65">
              Thoughtful pieces for every room, from trusted local stores.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              tapLight();
              router.push("/marketplace" as Href);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Explore the marketplace"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2.5 px-5 pt-5"
        >
          {SHOP_CATEGORIES.map((c) => (
            <Pressable
              key={c.label}
              onPress={() => {
                tapLight();
                router.push({
                  pathname: "/marketplace",
                  params: { category: c.label },
                } as Href);
              }}
              className="items-center"
              style={{ width: 72 }}
              accessibilityRole="button"
              accessibilityLabel={`Shop ${c.label}`}
            >
              <View
                className="items-center justify-center rounded-[20px] border border-white/10"
                style={{ width: 58, height: 58, backgroundColor: "rgba(255,255,255,0.10)" }}
              >
                <Ionicons
                  name={c.icon}
                  size={23}
                  color={c.tint === "#f5ead4" ? "#e5c27b" : "#d9e9d5"}
                />
              </View>
              <Text
                numberOfLines={2}
                className="mt-1.5 text-center text-[10px] font-sans-medium leading-[13px] text-white/75"
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 px-5 pb-5 pt-5"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} width={164} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
