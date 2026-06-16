import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { Skeleton } from "@/components/brand/Skeleton";
import { Appear, PressableScale, SaveHeart, Reveal, RevealScrollView } from "@/components/anim";
import { tapLight, tapSelection } from "@/lib/haptics";
import { MODES, type Mode } from "@/mocks/home";
import listingsService from "@/api/services/listings";
import type { Listing, ListingType } from "@/api/types";
import { useAuth } from "@/context/auth";

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listingsService
      .list({ type: MODE_TO_TYPE[mode], sort: "newest", limit: 20 })
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
  }, [mode, reloadKey]);

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
        <Heading />
        <SearchRow query={query} onChange={setQuery} />
        <ModeChips active={mode} onSelect={setMode} />

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
            {filtered.map((h) => (
              <Reveal key={h.id} style={{ width: "47.5%" }}>
                <HomeCard listing={h} />
              </Reveal>
            ))}
          </View>
        )}

        <ServiceLoopBanner />
      </RevealScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Header — location pill + bell + avatar
// ─────────────────────────────────────────────────────────────────
function Header() {
  const { user } = useAuth();
  return (
    <View className="px-5 pt-1 flex-row items-center justify-between">
      <Pressable
        onPress={tapLight}
        hitSlop={8}
        className="flex-row items-center gap-2 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Current location, Lekki, Lagos. Tap to change."
      >
        <Ionicons name="location-outline" size={22} color={INK} />
        <View className="flex-row items-center gap-1.5 bg-ink rounded-full pl-3 pr-2.5 py-1.5">
          <Text className="text-[12.5px] font-sans-bold text-white">
            Lekki, Lagos
          </Text>
          <Ionicons name="chevron-down" size={13} color="#ffffff" />
        </View>
      </Pressable>

      <View className="flex-row items-center gap-2.5">
        <Pressable
          onPress={() => {
            tapLight();
            router.push("/notifications" as Href);
          }}
          hitSlop={8}
          className="w-10 h-10 rounded-full bg-cream-2 items-center justify-center active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={19} color={INK} />
          <View
            className="absolute top-2 right-2.5 w-[7px] h-[7px] rounded-full"
            style={{ backgroundColor: PRIMARY, borderWidth: 2, borderColor: "#ffffff" }}
          />
        </Pressable>
        <PLAvatar initials={initialsOf(user?.name)} uri={user?.avatarUrl} size={40} tone="primary" />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Heading
// ─────────────────────────────────────────────────────────────────
function Heading() {
  return (
    <View className="px-5 pt-4">
      <Text
        className="font-sans-bold text-ink"
        style={{ fontSize: 28, lineHeight: 32, letterSpacing: -0.6 }}
      >
        Discover{"\n"}your new home
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
          placeholder="Search place…"
          placeholderTextColor={INK_3}
          className="flex-1 text-[14.5px] text-ink font-sans-medium"
          style={{ paddingVertical: 0 }}
          returnKeyType="search"
          accessibilityLabel="Search place"
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
// Category chips — Rental House / Apartment / Houses / Rooms
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
// Home card — photo with verified badge, price pill, rating overlay
// ─────────────────────────────────────────────────────────────────
function HomeCard({ listing }: { listing: Listing }) {
  const period = listing.period ?? "";
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

        {/* Verified badge (brand green, like the reference's blue) */}
        {listing.verified && (
          <View
            className="absolute top-2.5 left-2.5 w-[26px] h-[26px] rounded-lg items-center justify-center"
            style={{ backgroundColor: PRIMARY }}
            accessibilityLabel="Verified listing"
          >
            <Ionicons name="checkmark-sharp" size={16} color="#ffffff" />
          </View>
        )}

        {/* Price pill */}
        <View
          className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(26,33,32,0.62)" }}
        >
          <Text className="text-[11px] font-sans-bold text-white">
            {listing.priceLabel}
            {period}
          </Text>
        </View>

        {/* Save heart (bottom-right) — pops + ring-bursts on save */}
        <View
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(26,33,32,0.45)" }}
        >
          <SaveHeart id={listing.id} size={16} />
        </View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          locations={[0.4, 1]}
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Rating + title + location */}
        <View className="absolute left-2.5 right-2.5 bottom-2.5">
          <View className="flex-row items-center gap-1 mb-1">
            <Ionicons name="star" size={11} color={ACCENT} />
            <Text className="text-[11px] font-sans-bold text-white">
              {listing.rating}
            </Text>
          </View>
          <Text
            className="text-[14px] font-sans-bold text-white tracking-tight"
            numberOfLines={1}
          >
            {listing.title}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons name="location" size={11} color="rgba(255,255,255,0.85)" />
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
// Service Loop — slim neutral entry (preserves the marketplace link)
// ─────────────────────────────────────────────────────────────────
function ServiceLoopBanner() {
  return (
    <Appear delay={120} style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <PressableScale
        onPress={() => {
          tapLight();
          router.push("/services" as Href);
        }}
        className="bg-primary rounded-2xl flex-row items-center gap-3 px-4 py-3.5"
        accessibilityRole="button"
        accessibilityLabel="Service Loop — hire verified pros, paid safely via escrow"
      >
        <View className="w-11 h-11 rounded-xl bg-white/15 items-center justify-center">
          <Text style={{ fontSize: 22 }}>🛠️</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-sans-bold text-white tracking-tight">
            Need a plumber or cleaner?
          </Text>
          <Text className="text-[11.5px] text-white/70 mt-0.5">
            Service Loop · verified pros, paid safely via escrow
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
      </PressableScale>
    </Appear>
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
