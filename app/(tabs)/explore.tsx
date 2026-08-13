import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useListings } from "@/api/hooks/useListings";
import type { ListListingsParams } from "@/api/services/listings";
import type { Listing, ListingType } from "@/api/types";
import {
  activeFilterCount,
  clearSearchFilters,
  setSearchFilters,
  useSearchFilters,
} from "@/lib/searchFilters";
import {
  labelForLocation,
  useSelectedLocation,
} from "@/lib/location";
import { LocationSheet } from "@/components/LocationSheet";
import {
  Appear,
  PressableScale,
  SaveHeart,
  stagger,
} from "@/components/anim";
import { Skeleton } from "@/components/brand/Skeleton";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  PropertyMap,
  type MapLayer,
  type PropertyMapHandle,
} from "@/components/explore/PropertyMap";
import { tapLight, tapSelection } from "@/lib/haptics";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const CREAM_2 = "#f0f0f0";
const LINE = "#e1dcd3";

type ViewMode = "list" | "map";
type Sort = NonNullable<ListListingsParams["sort"]>;

const TYPE_TAG: Record<ListingType, string> = {
  SALE: "For sale",
  RENT: "For rent",
  SHORTLET: "Shortlet",
};

const TYPE_CHIPS: { label: string; value?: ListingType }[] = [
  { label: "All" },
  { label: "Buy", value: "SALE" },
  { label: "Rent", value: "RENT" },
  { label: "Shortlet", value: "SHORTLET" },
];

const PROPERTY_CHIPS: {
  label: string;
  value?: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "All homes", icon: "grid-outline" },
  {
    label: "Flats",
    value: "Flat / Apartment",
    icon: "business-outline",
  },
  { label: "Apartments", value: "Apartment", icon: "business-outline" },
  { label: "House", value: "House", icon: "home-outline" },
  { label: "Duplex", value: "Duplex", icon: "home-outline" },
  { label: "Bungalow", value: "Bungalow", icon: "home-outline" },
  { label: "Terrace", value: "Terrace", icon: "copy-outline" },
  { label: "Penthouse", value: "Penthouse", icon: "business-outline" },
  { label: "Studio", value: "Studio", icon: "business-outline" },
  { label: "Land", value: "Land", icon: "map-outline" },
  { label: "Commercial", value: "Commercial", icon: "storefront-outline" },
];

const SORTS: { label: string; value: Sort; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Newest", value: "newest", icon: "sparkles-outline" },
  { label: "Price: low to high", value: "price_asc", icon: "arrow-up-outline" },
  { label: "Price: high to low", value: "price_desc", icon: "arrow-down-outline" },
  { label: "Top rated", value: "top_rated", icon: "star-outline" },
];

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ExploreScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<ViewMode>("list");
  const [mapType, setMapType] = useState<MapLayer>("standard");
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const mapRef = useRef<PropertyMapHandle | null>(null);
  const loadMoreGate = useRef(false);

  const filters = useSearchFilters();
  const location = useSelectedLocation();
  const filterCount = activeFilterCount(filters);
  const sortLabel = SORTS.find((option) => option.value === sort)?.label ?? "Newest";

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
  };

  const query = useMemo<ListListingsParams>(
    () => ({
      type: filters.type,
      propertyType: filters.propertyType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minBeds: filters.minBeds,
      minBaths: filters.minBaths,
      search: debouncedSearch || undefined,
      location: location || undefined,
      sort,
      limit: 20,
    }),
    [filters, debouncedSearch, location, sort],
  );

  const {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
  } = useListings(query);

  useEffect(() => {
    if (selectedPin && !items.some((item) => item.id === selectedPin)) {
      setSelectedPin(null);
    }
  }, [items, selectedPin]);

  useEffect(() => {
    if (!loadingMore) loadMoreGate.current = false;
  }, [loadingMore]);

  const requestMore = () => {
    if (!hasMore || loading || loadingMore || loadMoreGate.current) return;
    loadMoreGate.current = true;
    loadMore();
  };

  const setType = (type?: ListingType) => {
    tapSelection();
    setSearchFilters({ ...filters, type });
  };

  const setPropertyType = (propertyType?: string) => {
    tapSelection();
    setSearchFilters({ ...filters, propertyType });
  };

  const resetDiscovery = () => {
    tapLight();
    clearSearchFilters();
    setSearch("");
    setDebouncedSearch("");
    setSort("newest");
    setSortMenuOpen(false);
  };

  const openListing = (id: string) => {
    tapLight();
    router.push(`/property/${id}` as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ExploreHeader
        search={search}
        onSearchChange={setSearch}
        onClearSearch={clearSearch}
        filters={filters}
        filterCount={filterCount}
        locationLabel={labelForLocation(location)}
        onOpenLocation={() => {
          tapLight();
          setLocationSheetOpen(true);
        }}
        onSetType={setType}
        onSetPropertyType={setPropertyType}
      />

      {sortMenuOpen ? (
        <Pressable
          onPress={() => setSortMenuOpen(false)}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 10,
          }}
          accessibilityRole="button"
          accessibilityLabel="Close sort menu"
        />
      ) : null}

      <View
        className="px-5 py-2.5 flex-row items-center border-line"
        style={{ borderBottomWidth: 0.5, zIndex: 20, elevation: 20 }}
      >
        <View className="flex-1">
          <Text className="text-[13.5px] font-sans-bold text-ink">
            {loading ? "Finding homes…" : `${total} home${total === 1 ? "" : "s"}`}
          </Text>
          {!loading && (debouncedSearch || location) ? (
            <Text className="text-[10.5px] font-sans-medium text-ink-3 mt-0.5" numberOfLines={1}>
              {[debouncedSearch ? `“${debouncedSearch}”` : null, location ? labelForLocation(location) : null]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : null}
        </View>

        <View style={{ position: "relative" }}>
          <Pressable
            onPress={() => {
              tapLight();
              setSortMenuOpen((open) => !open);
            }}
            className="h-11 px-3 flex-row items-center gap-1.5 rounded-full bg-cream-2"
            accessibilityRole="button"
            accessibilityLabel={`Sort listings, currently ${sortLabel}`}
            accessibilityState={{ expanded: sortMenuOpen }}
          >
            <Text className="text-[11.5px] font-sans-bold text-ink-2">
              {sortLabel === "Price: low to high"
                ? "Price ↑"
                : sortLabel === "Price: high to low"
                  ? "Price ↓"
                  : sortLabel}
            </Text>
            <Ionicons
              name={sortMenuOpen ? "chevron-up" : "chevron-down"}
              size={12}
              color={INK_2}
            />
          </Pressable>

          {sortMenuOpen ? (
            <SortMenu
              selected={sort}
              onSelect={(next) => {
                tapSelection();
                setSort(next);
                setSortMenuOpen(false);
              }}
            />
          ) : null}
        </View>

        <View className="ml-2 flex-row rounded-full bg-cream-2 p-0.5">
          <ViewToggle
            active={view === "list"}
            icon="list-outline"
            label="List view"
            onPress={() => {
              tapSelection();
              setView("list");
              setSortMenuOpen(false);
            }}
          />
          <ViewToggle
            active={view === "map"}
            icon="map-outline"
            label="Map view"
            onPress={() => {
              tapSelection();
              setView("map");
              setSortMenuOpen(false);
            }}
          />
        </View>
      </View>

      {loading && items.length === 0 ? (
        <ExploreSkeleton />
      ) : error ? (
        <StateView
          icon="cloud-offline-outline"
          title="Couldn’t load homes"
          body="Check your connection and try again."
          actionLabel="Try again"
          onAction={reload}
        />
      ) : items.length === 0 ? (
        <StateView
          icon="search-outline"
          title="No homes match your search"
          body="Try another area, broaden your filters, or start again."
          actionLabel="Clear filters"
          onAction={resetDiscovery}
        />
      ) : view === "list" ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Appear delay={stagger(Math.min(index, 6), 20)}>
              <ExploreListCard listing={item} onPress={() => openListing(item.id)} />
            </Appear>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 15 }}
          showsVerticalScrollIndicator={false}
          onEndReached={requestMore}
          onEndReachedThreshold={0.45}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            loadingMore ? (
              <BouncyLoader color={PRIMARY} style={{ alignSelf: "center", marginVertical: 10 }} />
            ) : !hasMore ? (
              <Text className="text-center text-[11.5px] font-sans-semibold text-ink-3 py-2">
                You’ve seen all {total} home{total === 1 ? "" : "s"}
              </Text>
            ) : null
          }
        />
      ) : (
        <MapResults
          mapRef={mapRef}
          items={items}
          mapType={mapType}
          selectedPin={selectedPin}
          onSelectPin={setSelectedPin}
          onOpenListing={openListing}
          onRecenter={() => mapRef.current?.recenter()}
          onToggleLayer={() =>
            setMapType((current) =>
              current === "standard" ? "satellite" : "standard",
            )
          }
          onLoadMore={requestMore}
          loadingMore={loadingMore}
        />
      )}

      <LocationSheet
        visible={locationSheetOpen}
        selected={location}
        onClose={() => setLocationSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function ExploreHeader({
  search,
  onSearchChange,
  onClearSearch,
  filters,
  filterCount,
  locationLabel,
  onOpenLocation,
  onSetType,
  onSetPropertyType,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  filters: ReturnType<typeof useSearchFilters>;
  filterCount: number;
  locationLabel: string;
  onOpenLocation: () => void;
  onSetType: (type?: ListingType) => void;
  onSetPropertyType: (type?: string) => void;
}) {
  return (
    <View className="bg-cream pt-1 pb-2">
      <View className="px-5 flex-row items-center gap-2.5">
        <Text className="font-serif text-ink flex-1" style={{ fontSize: 29, letterSpacing: -0.8 }}>
          Explore
        </Text>
        <Pressable
          onPress={onOpenLocation}
          className="h-11 max-w-[150px] px-3 flex-row items-center gap-1.5 rounded-full"
          style={{ backgroundColor: INK }}
          accessibilityRole="button"
          accessibilityLabel={`Location: ${locationLabel}`}
        >
          <Ionicons name="location" size={13} color="#ffffff" />
          <Text className="text-white text-[11px] font-sans-bold flex-shrink" numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.72)" />
        </Pressable>
        <Pressable
          onPress={() => {
            tapLight();
            router.push("/filters?from=explore" as Href);
          }}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: INK }}
          accessibilityRole="button"
          accessibilityLabel={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
        >
          <Ionicons name="options-outline" size={18} color="#ffffff" />
          {filterCount > 0 ? (
            <View
              className="absolute items-center justify-center"
              style={{
                top: -3,
                right: -3,
                minWidth: 17,
                height: 17,
                paddingHorizontal: 3,
                borderRadius: 9,
                backgroundColor: PRIMARY,
                borderWidth: 1.5,
                borderColor: "#ffffff",
              }}
            >
              <Text className="text-white font-sans-bold" style={{ fontSize: 9 }}>
                {filterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View className="mx-5 mt-3 h-[50px] rounded-2xl bg-cream-2 px-4 flex-row items-center gap-2.5">
        <Ionicons name="search" size={18} color={INK_2} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search area, estate or property"
          placeholderTextColor={INK_3}
          returnKeyType="search"
          autoCapitalize="none"
          className="flex-1 text-[13.5px] font-sans-medium text-ink"
          style={{ paddingVertical: 0 }}
          accessibilityLabel="Search properties"
        />
        {search ? (
          <Pressable
            onPress={onClearSearch}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={19} color={INK_3} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 12 }}
      >
        {TYPE_CHIPS.map((chip) => {
          const active = filters.type === chip.value || (!filters.type && !chip.value);
          return (
            <FilterChip
              key={chip.label}
              label={chip.label}
              active={active}
              onPress={() => onSetType(chip.value)}
            />
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 2 }}
      >
        {PROPERTY_CHIPS.map((chip) => {
          const active =
            filters.propertyType === chip.value ||
            (!filters.propertyType && !chip.value);
          return (
            <PropertyChip
              key={chip.label}
              {...chip}
              active={active}
              onPress={() => onSetPropertyType(chip.value)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-9 px-4 rounded-full items-center justify-center"
      style={{
        backgroundColor: active ? INK : "#ffffff",
        borderWidth: active ? 0 : 1,
        borderColor: LINE,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text className="text-[12.5px] font-sans-bold" style={{ color: active ? "#ffffff" : INK_2 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function PropertyChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="h-9 px-3.5 rounded-full flex-row items-center gap-1.5"
      style={{ backgroundColor: active ? "#e3efe7" : CREAM_2 }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={13} color={active ? PRIMARY : INK_2} />
      <Text className="text-[11.5px] font-sans-bold" style={{ color: active ? "#134a2d" : INK_2 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SortMenu({ selected, onSelect }: { selected: Sort; onSelect: (sort: Sort) => void }) {
  return (
    <View
      className="absolute right-0 top-11 bg-white rounded-2xl overflow-hidden"
      style={{
        width: 210,
        borderWidth: 0.5,
        borderColor: LINE,
        shadowColor: "#000000",
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
    >
      {SORTS.map((option, index) => {
        const active = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            className="px-3.5 py-3 flex-row items-center gap-2.5 active:bg-cream-2"
            style={{ borderTopWidth: index ? 0.5 : 0, borderTopColor: LINE }}
            accessibilityRole="menuitem"
            accessibilityState={{ selected: active }}
          >
            <Ionicons name={option.icon} size={16} color={active ? PRIMARY : INK_2} />
            <Text className="flex-1 text-[12.5px] font-sans-semibold" style={{ color: active ? PRIMARY : INK }}>
              {option.label}
            </Text>
            {active ? <Ionicons name="checkmark" size={16} color={PRIMARY} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ViewToggle({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-11 h-11 rounded-full items-center justify-center"
      style={{ backgroundColor: active ? INK : "transparent" }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={15} color={active ? "#ffffff" : INK_3} />
    </Pressable>
  );
}

function ExploreListCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const agent = listing.agent;
  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.985}
      className="bg-white rounded-3xl overflow-hidden"
      style={{ borderWidth: 0.5, borderColor: LINE }}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.priceLabel}, ${listing.location}`}
    >
      <View style={{ height: 194 }}>
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: "100%", backgroundColor: CREAM_2 }}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
          accessibilityLabel={listing.title}
        />
        <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white">
          <Text className="text-[9.5px] font-sans-bold text-ink tracking-wider uppercase">
            {TYPE_TAG[listing.type]}
          </Text>
        </View>
        <View
          className="absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(20,26,24,0.76)" }}
        >
          <SaveHeart id={listing.id} size={18} hitSlop={8} />
        </View>
        {listing.verified ? (
          <View
            className="absolute left-3 bottom-3 px-2.5 py-1.5 rounded-full flex-row items-center gap-1"
            style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
          >
            <Ionicons name="shield-checkmark" size={12} color={PRIMARY} />
            <Text className="text-[9.5px] font-sans-bold text-primary">Verified home</Text>
          </View>
        ) : null}
      </View>

      <View className="px-4 pt-3.5 pb-3.5">
        <View className="flex-row items-start gap-2">
          <ListingPrice listing={listing} size={22} periodSize={11} />
          {(listing.rating ?? 0) > 0 ? (
            <View className="flex-row items-center gap-1 pt-1.5">
              <Ionicons name="star" size={12} color={ACCENT} />
              <Text className="text-[11px] font-sans-bold text-ink-2">{listing.rating}</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-[14px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
          {listing.title}
        </Text>
        <View className="flex-row items-center gap-1 mt-1">
          <Ionicons name="location-outline" size={12} color={INK_3} />
          <Text className="flex-1 text-[11.5px] font-sans-medium text-ink-3" numberOfLines={1}>
            {listing.location}
          </Text>
        </View>

        <View className="flex-row items-center gap-3.5 mt-3">
          <Stat icon="bed-outline" value={`${listing.beds} bed`} />
          <Stat icon="water-outline" value={`${listing.baths} bath`} />
          {listing.sqft ? <Stat icon="resize-outline" value={`${listing.sqft} m²`} /> : null}
        </View>

        {agent ? (
          <View className="mt-3 pt-3 flex-row items-center gap-2.5 border-line" style={{ borderTopWidth: 0.5 }}>
            <PLAvatar initials={initialsOf(agent.name)} uri={agent.avatarUrl} size={30} />
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-[11.5px] font-sans-bold text-ink" numberOfLines={1}>
                  {agent.name}
                </Text>
                {agent.verified ? <Ionicons name="checkmark-circle" size={12} color={PRIMARY} /> : null}
              </View>
              <Text className="text-[9.5px] font-sans-medium text-ink-3" numberOfLines={1}>
                {agent.agency || "PropertyLoop agent"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={INK_3} />
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

function Stat({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={13} color={INK_2} />
      <Text className="text-[11px] font-sans-semibold text-ink-2">{value}</Text>
    </View>
  );
}

function ListingPrice({
  listing,
  size,
  periodSize,
}: {
  listing: Listing;
  size: number;
  periodSize: number;
}) {
  const hasNairaSymbol = listing.priceLabel.startsWith("₦");

  return (
    <View
      className="flex-1 flex-row items-baseline"
      style={{ minWidth: 0 }}
      accessibilityLabel={`${listing.priceLabel}${listing.period ?? ""}`}
    >
      {hasNairaSymbol ? (
        <Text
          className="text-ink"
          style={{
            fontSize: Math.max(12, size - 6),
            fontWeight: "700",
            marginRight: 1,
          }}
        >
          ₦
        </Text>
      ) : null}
      <Text
        className="font-serif text-ink"
        style={{ fontSize: size, letterSpacing: -0.4, flexShrink: 1 }}
        numberOfLines={1}
      >
        {hasNairaSymbol ? listing.priceLabel.slice(1) : listing.priceLabel}
      </Text>
      {listing.period ? (
        <Text
          className="font-sans-semibold text-ink-3 ml-1"
          style={{ fontSize: periodSize }}
          numberOfLines={1}
        >
          {listing.period}
        </Text>
      ) : null}
    </View>
  );
}

function MapResults({
  mapRef,
  items,
  mapType,
  selectedPin,
  onSelectPin,
  onOpenListing,
  onRecenter,
  onToggleLayer,
  onLoadMore,
  loadingMore,
}: {
  mapRef: React.RefObject<PropertyMapHandle | null>;
  items: Listing[];
  mapType: MapLayer;
  selectedPin: string | null;
  onSelectPin: (id: string) => void;
  onOpenListing: (id: string) => void;
  onRecenter: () => void;
  onToggleLayer: () => void;
  onLoadMore: () => void;
  loadingMore: boolean;
}) {
  return (
    <View className="flex-1">
      <PropertyMap
        ref={mapRef}
        items={items}
        mapType={mapType}
        selectedPin={selectedPin}
        onSelectPin={onSelectPin}
      />

      <View className="absolute right-4 top-4 gap-2">
        <MapControl icon="locate-outline" label="Recenter map" color={PRIMARY} onPress={onRecenter} />
        <MapControl
          icon={mapType === "standard" ? "layers-outline" : "layers"}
          label="Toggle map layer"
          color={INK}
          onPress={onToggleLayer}
        />
      </View>

      <View className="absolute left-0 right-0 bottom-3">
        <FlatList
          data={items}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 14 }}
          keyExtractor={(listing) => listing.id}
          renderItem={({ item: listing }) => (
            <ExploreMapCard
              listing={listing}
              selected={selectedPin === listing.id}
              onPress={() => {
                onSelectPin(listing.id);
                onOpenListing(listing.id);
              }}
            />
          )}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="w-12 items-center justify-center">
                <BouncyLoader color={PRIMARY} size={18} />
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}

function ExploreMapCard({
  listing,
  selected,
  onPress,
}: {
  listing: Listing;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.98}
      className="bg-white rounded-2xl overflow-hidden flex-row"
      style={{
        width: 286,
        height: 112,
        borderWidth: selected ? 2 : 0.5,
        borderColor: selected ? PRIMARY : LINE,
        shadowColor: "#000000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.priceLabel}`}
    >
      <View style={{ width: 104, height: "100%" }}>
        <Image
          source={listing.coverImage}
          style={{ width: "100%", height: "100%", backgroundColor: CREAM_2 }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
        <View
          className="absolute top-2 left-2 px-2 py-1 rounded-full"
          style={{ backgroundColor: "rgba(26,33,32,0.82)" }}
        >
          <Text className="text-[9px] font-sans-bold text-white">{TYPE_TAG[listing.type]}</Text>
        </View>
      </View>
      <View className="flex-1 px-3 py-2.5">
        <View className="flex-row items-start gap-1">
          <ListingPrice listing={listing} size={17} periodSize={9} />
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: CREAM_2 }}
          >
            <SaveHeart id={listing.id} size={15} color={INK_2} hitSlop={7} />
          </View>
        </View>
        <Text className="text-[12px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
          {listing.title}
        </Text>
        <Text className="text-[10px] font-sans-medium text-ink-3 mt-0.5" numberOfLines={1}>
          {listing.location}
        </Text>
        <View className="flex-row items-center gap-2.5 mt-2">
          <Stat icon="bed-outline" value={`${listing.beds}`} />
          <Stat icon="water-outline" value={`${listing.baths}`} />
          {listing.verified ? <Ionicons name="shield-checkmark" size={12} color={PRIMARY} /> : null}
        </View>
      </View>
    </PressableScale>
  );
}

function MapControl({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapLight();
        onPress();
      }}
      className="w-11 h-11 rounded-full bg-white items-center justify-center"
      style={{
        shadowColor: "#000000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}

function ExploreSkeleton() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 15 }} showsVerticalScrollIndicator={false}>
      {[0, 1, 2].map((key) => (
        <View key={key} className="bg-white rounded-3xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
          <Skeleton style={{ width: "100%", height: 194 }} radius={0} />
          <View className="p-4 gap-9">
            <Skeleton style={{ width: "48%", height: 23 }} radius={7} />
            <Skeleton style={{ width: "72%", height: 14 }} radius={5} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function StateView({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 pb-12">
      <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={27} color={INK_2} />
      </View>
      <Text className="text-[17px] font-sans-bold text-ink mt-4 text-center">{title}</Text>
      <Text className="text-[12.5px] font-sans-medium text-ink-3 mt-1.5 leading-5 text-center">
        {body}
      </Text>
      <Pressable
        onPress={onAction}
        className="mt-5 px-6 py-3 rounded-full bg-primary active:opacity-85"
        accessibilityRole="button"
      >
        <Text className="text-white text-[13px] font-sans-bold">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
