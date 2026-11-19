import { Fragment, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useListings } from "@/api/hooks/useListings";
import type { ListListingsParams } from "@/api/services/listings";
import {
  clearSearchFilters,
  describeFilters,
  patchSearchFilters,
  removeFilter,
  useSearchFilters,
} from "@/lib/searchFilters";
import {
  labelForLocation,
  setSelectedLocation,
  useSelectedLocation,
} from "@/lib/location";
import type { Listing, ListingType } from "@/api/types";
import { AdSlot } from "@/components/AdSlot";
import { LocationSheet } from "@/components/LocationSheet";
import { tapLight, tapSelection } from "@/lib/haptics";
import { SaveSearchButton } from "@/components/SaveSearchButton";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const PRIMARY_SOFT = "#e3efe7";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TYPE_TAG: Record<Listing["type"], string> = {
  SALE: "For sale",
  RENT: "For rent",
  SHORTLET: "Shortlet",
};

// Same order and words as Explore, so the two screens teach one vocabulary.
const TYPE_CHIPS: { label: string; value?: ListingType }[] = [
  { label: "All" },
  { label: "Buy", value: "SALE" },
  { label: "Rent", value: "RENT" },
  { label: "Shortlet", value: "SHORTLET" },
];

type Sort = NonNullable<ListListingsParams["sort"]>;

const SORTS: {
  label: string;
  short: string;
  value: Sort;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Newest", short: "Newest", value: "newest", icon: "sparkles-outline" },
  { label: "Price: low to high", short: "Price ↑", value: "price_asc", icon: "arrow-up-outline" },
  { label: "Price: high to low", short: "Price ↓", value: "price_desc", icon: "arrow-down-outline" },
  { label: "Top rated", short: "Top rated", value: "top_rated", icon: "star-outline" },
];

/** "24 homes for rent" — the count says what was filtered, not just how many. */
function headline(total: number, type?: ListingType) {
  const n = total.toLocaleString("en-NG");
  if (type === "SHORTLET") return `${n} shortlet${total === 1 ? "" : "s"}`;
  const homes = `home${total === 1 ? "" : "s"}`;
  if (type === "SALE") return `${n} ${homes} for sale`;
  if (type === "RENT") return `${n} ${homes} for rent`;
  return `${n} ${homes}`;
}

/**
 * Search and filter results — and nothing else.
 *
 * Every filter in force is on screen: the listing type as an always-visible
 * row, everything else as a chip that removes itself on tap, the area as a
 * chip that reopens the picker. People used to apply a filter from Home and see
 * the list below the sponsored rail barely move, so they couldn't tell whether
 * it had taken. Here there's nothing between the filters and their results.
 */
export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{ q?: string; focus?: string; savedSearchId?: string; sort?: Sort }>();
  const [query, setQuery] = useState(params.q ?? "");
  // What's actually queried: follows typing after a pause (as Explore does) and
  // jumps straight away on the keyboard's search key.
  const [search, setSearch] = useState((params.q ?? "").trim());
  const [sort, setSort] = useState<Sort>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    if (!params.savedSearchId) return;
    setQuery(params.q ?? '');
    setSearch((params.q ?? '').trim());
    setSort(SORTS.some(option => option.value === params.sort) ? params.sort! : 'newest');
  }, [params.savedSearchId, params.q, params.sort]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Shared stores — the Filters modal and the area picker write, this screen
  // subscribes and refetches. (Route params went stale on a second apply.)
  const filters = useSearchFilters();
  const location = useSelectedLocation();
  const applied = describeFilters(filters);
  // Type has its own always-visible row, so the chip row carries the rest.
  const chips = applied.filter((c) => c.key !== "type");
  const hasFilters = applied.length > 0;
  const narrowed = hasFilters || !!search || !!location;

  const {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
  } = useListings({
    search: search || undefined,
    type: filters.type,
    propertyType: filters.propertyType,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minBeds: filters.minBeds,
    minBaths: filters.minBaths,
    // Was missing: results ignored the area chosen on Home, so picking Lekki
    // quietly returned homes from everywhere.
    location: location || undefined,
    sort,
    limit: 20,
  });

  const sortOption = SORTS.find((o) => o.value === sort) ?? SORTS[0];

  const clearSearch = () => {
    setQuery("");
    setSearch("");
  };

  const clearAll = () => {
    tapLight();
    clearSearchFilters();
    clearSearch();
  };

  const context = [
    location ? `in ${labelForLocation(location)}` : null,
    search ? `“${search}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const emptyScope = [
    ...applied.map((c) => c.label),
    location ? labelForLocation(location) : null,
    search ? `“${search}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SaveSearchButton filters={{ ...filters, location: location || undefined, search: query.trim() || undefined, sort }} />

      {/* Tap-away layer for the sort menu: above the list, below the menu. */}
      {sortOpen && (
        <Pressable
          onPress={() => setSortOpen(false)}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
          accessibilityLabel="Close sort menu"
        />
      )}

      {/* Search header */}
      <View className="px-4 pt-1 pb-1">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-cream-2 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <View
            className="flex-1 bg-white rounded-full px-3.5 flex-row items-center gap-2"
            style={{ height: 44, borderWidth: 1, borderColor: LINE }}
          >
            <Ionicons name="search" size={16} color={INK_2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => setSearch(query.trim())}
              autoFocus={params.focus === "1"}
              placeholder="Area, estate or property"
              placeholderTextColor={INK_3}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 text-[14px] font-sans-semibold text-ink"
              style={{ paddingVertical: 0 }}
              accessibilityLabel="Search properties"
            />
            {query.length > 0 && (
              <Pressable
                onPress={clearSearch}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={17} color={INK_3} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => {
              tapLight();
              router.push(
                `/filters?from=results&q=${encodeURIComponent(search)}` as Href,
              );
            }}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: INK }}
            accessibilityRole="button"
            accessibilityLabel={`Filters${hasFilters ? `, ${applied.length} applied` : ""}`}
          >
            <Ionicons name="options-outline" size={17} color="#ffffff" />
            {hasFilters && (
              <View
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  minWidth: 17,
                  height: 17,
                  borderRadius: 9,
                  backgroundColor: PRIMARY,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 3,
                  borderWidth: 1.5,
                  borderColor: "#fffbf4",
                }}
              >
                <Text className="text-white font-sans-bold" style={{ fontSize: 9 }}>
                  {applied.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Listing type — always visible, one tap to switch. flexGrow 0 stops a
          horizontal ScrollView from swallowing the column's spare height. */}
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 8 }}
      >
        {TYPE_CHIPS.map((chip) => {
          const active =
            filters.type === chip.value || (!filters.type && !chip.value);
          return (
            <Pressable
              key={chip.label}
              onPress={() => {
                tapSelection();
                patchSearchFilters({ type: chip.value });
              }}
              className="h-9 px-4 rounded-full items-center justify-center"
              style={{
                backgroundColor: active ? INK : "#ffffff",
                borderWidth: active ? 0 : 1,
                borderColor: LINE,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                className="text-[13px] font-sans-bold"
                style={{ color: active ? "#ffffff" : INK_2 }}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Everything else in force: area, then each filter as a removable chip. */}
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 2,
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => {
            tapLight();
            setLocationOpen(true);
          }}
          className="h-8 pl-2.5 pr-3 rounded-full flex-row items-center gap-1"
          style={{
            backgroundColor: location ? PRIMARY_SOFT : "#ffffff",
            borderWidth: location ? 0 : 1,
            borderColor: LINE,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Area: ${labelForLocation(location)}. Change area`}
        >
          <Ionicons name="location" size={12} color={location ? PRIMARY : INK_2} />
          <Text
            className="text-[12px] font-sans-bold"
            style={{ color: location ? PRIMARY_INK : INK_2 }}
            numberOfLines={1}
          >
            {labelForLocation(location)}
          </Text>
          <Ionicons name="chevron-down" size={11} color={location ? PRIMARY : INK_3} />
        </Pressable>

        {chips.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => {
              tapLight();
              removeFilter(c.key);
            }}
            className="h-8 pl-3 pr-2 rounded-full flex-row items-center gap-1"
            style={{ backgroundColor: PRIMARY_SOFT }}
            accessibilityRole="button"
            accessibilityLabel={`Remove filter: ${c.label}`}
          >
            <Text className="text-[12px] font-sans-bold" style={{ color: PRIMARY_INK }}>
              {c.label}
            </Text>
            <Ionicons name="close" size={13} color={PRIMARY} />
          </Pressable>
        ))}

        {hasFilters && (
          <Pressable
            onPress={clearAll}
            hitSlop={6}
            className="h-8 px-2 justify-center"
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text className="text-[12px] font-sans-bold text-primary">Clear all</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Result summary + sort. zIndex lifts the sort menu over the list. */}
      <View
        className="px-4 pt-3 pb-2.5 flex-row items-center"
        style={{ zIndex: 20, borderBottomWidth: 0.5, borderBottomColor: LINE }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-[14.5px] font-sans-bold text-ink" numberOfLines={1}>
            {loading ? "Searching…" : headline(total, filters.type)}
          </Text>
          {!!context && (
            <Text className="text-[11.5px] font-sans-medium text-ink-3 mt-0.5" numberOfLines={1}>
              {context}
            </Text>
          )}
        </View>

        <View style={{ position: "relative" }}>
          <Pressable
            onPress={() => {
              tapLight();
              setSortOpen((open) => !open);
            }}
            className="h-9 px-3 rounded-full flex-row items-center gap-1.5 bg-cream-2"
            accessibilityRole="button"
            accessibilityLabel={`Sort, currently ${sortOption.label}`}
            accessibilityState={{ expanded: sortOpen }}
          >
            <Text className="text-[12px] font-sans-bold text-ink-2">{sortOption.short}</Text>
            <Ionicons name={sortOpen ? "chevron-up" : "chevron-down"} size={12} color={INK_2} />
          </Pressable>

          {sortOpen && (
            <View
              className="absolute right-0 bg-white rounded-2xl overflow-hidden"
              style={{
                top: 42,
                width: 210,
                borderWidth: 0.5,
                borderColor: LINE,
                shadowColor: "#000000",
                shadowOpacity: 0.14,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 12,
              }}
            >
              {SORTS.map((o, i) => {
                const active = o.value === sort;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      tapSelection();
                      setSort(o.value);
                      setSortOpen(false);
                    }}
                    className="px-3.5 py-3 flex-row items-center gap-2.5 active:bg-cream-2"
                    style={{ borderTopWidth: i ? 0.5 : 0, borderTopColor: LINE }}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons name={o.icon} size={16} color={active ? PRIMARY : INK_2} />
                    <Text
                      className="flex-1 text-[12.5px] font-sans-semibold"
                      style={{ color: active ? PRIMARY : INK }}
                    >
                      {o.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={16} color={PRIMARY} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : error ? (
        <Empty
          icon="cloud-offline-outline"
          title="Couldn’t load results"
          body="Check your connection and try again."
          actionLabel="Try again"
          onAction={reload}
        />
      ) : items.length === 0 ? (
        narrowed ? (
          <Empty
            icon="funnel-outline"
            title="No homes match"
            body={`Nothing fits ${emptyScope}. Loosen a filter to see more.`}
            actionLabel={
              hasFilters ? "Clear filters" : location ? "Search all areas" : "Clear search"
            }
            onAction={
              hasFilters
                ? clearAll
                : location
                  ? () => setSelectedLocation(null)
                  : clearSearch
            }
          />
        ) : (
          <Empty
            icon="home-outline"
            title="No homes listed yet"
            body="New verified homes land every week — check back soon."
          />
        )
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {items.map((c, i) => (
            <Fragment key={c.id}>
              {/* Sponsored card after the 3rd result — renders nothing when
                  no campaign is live for this slot. */}
              {i === 3 && <AdSlot placement="SEARCH_INLINE" />}
              <ResultCard listing={c} />
            </Fragment>
          ))}
          {loadingMore && <BouncyLoader color={PRIMARY} style={{ marginTop: 4 }} />}
          {!hasMore && (
            <Text className="text-center text-[12px] text-ink-3 font-sans-semibold pt-1">
              That’s all {total} home{total === 1 ? "" : "s"}
            </Text>
          )}
        </ScrollView>
      )}

      <LocationSheet
        visible={locationOpen}
        selected={location}
        onClose={() => setLocationOpen(false)}
      />
    </SafeAreaView>
  );
}

function ResultCard({ listing }: { listing: Listing }) {
  return (
    <Pressable
      onPress={() => router.push(`/property/${listing.id}` as Href)}
      className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View style={{ height: 170 }} className="relative">
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-full">
          <Text className="text-[10.5px] font-sans-bold text-ink tracking-wider uppercase">
            {TYPE_TAG[listing.type]}
          </Text>
        </View>
        {listing.verified && (
          <View className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 items-center justify-center">
            <Ionicons name="shield-checkmark" size={15} color={PRIMARY} />
          </View>
        )}
      </View>
      <View className="px-3.5 py-3">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="font-serif text-ink"
            style={{ fontSize: 20, letterSpacing: -0.4 }}
          >
            {listing.priceLabel}
            <Text style={{ fontSize: 12 }}>{listing.period ?? ""}</Text>
          </Text>
          {(listing.rating ?? 0) > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={12} color="#b9842c" />
              <Text className="text-[11px] font-sans-bold text-ink-2">
                {listing.rating}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-[14px] font-sans-bold text-ink mt-0.5">
          {listing.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">
          {listing.location}
        </Text>
        <View className="flex-row gap-3 mt-2">
          <Stat icon="bed-outline" value={`${listing.beds} bed`} />
          <Stat icon="water-outline" value={`${listing.baths} bath`} />
          {!!listing.sqft && (
            <Stat icon="resize-outline" value={`${listing.sqft} m²`} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function Stat({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={13} color={INK_2} />
      <Text className="text-[11.5px] font-sans-semibold text-ink-2">
        {value}
      </Text>
    </View>
  );
}

function Empty({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={28} color={INK_2} />
      </View>
      <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
        {title}
      </Text>
      <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
        {body}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
