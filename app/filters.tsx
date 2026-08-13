import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  getSearchFilters,
  setSearchFilters,
  type SearchFilters,
} from "@/lib/searchFilters";

const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const LISTING_TYPES = ["Any", "Sale", "Rent", "Shortlet"];
const PROPERTY_TYPES = [
  "Any",
  "Flat / Apartment",
  "Apartment",
  "House",
  "Duplex",
  "Bungalow",
  "Terrace",
  "Penthouse",
  "Studio",
  "Land",
  "Commercial",
];
const BEDS = ["Any", "1+", "2+", "3+", "4+", "5+"];
const BATHS = ["Any", "1+", "2+", "3+", "4+"];

function fmtNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

// Reverse-map the stored filters back to the chip labels so reopening the
// modal shows what's actually applied (previously it always showed defaults).
function listingTypeFromStore(f: SearchFilters): string {
  if (f.type === "SALE") return "Sale";
  if (f.type === "RENT") return "Rent";
  if (f.type === "SHORTLET") return "Shortlet";
  return "Any";
}

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  // A `from` param (e.g. `results` from search-results, `explore` from the
  // Explore tab) means the opener is already mounted underneath and subscribes
  // to the shared filter store, so applying just goes back to it. With no
  // `from` (Home), applying navigates on to search-results.
  const params = useLocalSearchParams<{ from?: string }>();
  const applied = getSearchFilters();

  const [listingType, setListingType] = useState(listingTypeFromStore(applied));
  const [propertyType, setPropertyType] = useState(
    applied.propertyType ?? "Any",
  );
  const [beds, setBeds] = useState(
    applied.minBeds ? `${applied.minBeds}+` : "Any",
  );
  const [baths, setBaths] = useState(
    applied.minBaths ? `${applied.minBaths}+` : "Any",
  );
  const [minPrice, setMinPrice] = useState(
    applied.minPrice ? String(applied.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    applied.maxPrice ? String(applied.maxPrice) : "",
  );
  const reset = () => {
    setListingType("Any");
    setPropertyType("Any");
    setBeds("Any");
    setBaths("Any");
    setMinPrice("");
    setMaxPrice("");
  };

  const apply = () => {
    // Commit to the shared store — search-results subscribes and refetches the
    // moment this changes. Filters used to travel as route params, but
    // replacing/pushing to an already-mounted search-results didn't refresh
    // its useLocalSearchParams, so a second "Show homes" kept stale results.
    const next: SearchFilters = {};
    if (listingType === "Sale") next.type = "SALE";
    else if (listingType === "Rent") next.type = "RENT";
    else if (listingType === "Shortlet") next.type = "SHORTLET";
    if (propertyType !== "Any") next.propertyType = propertyType;
    if (beds !== "Any") next.minBeds = parseInt(beds, 10);
    if (baths !== "Any") next.minBaths = parseInt(baths, 10);
    if (minPrice) next.minPrice = Number(minPrice);
    if (maxPrice) next.maxPrice = Number(maxPrice);
    setSearchFilters(next);

    if (params.from) router.back();
    else router.replace("/search-results" as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Drag handle */}
      <View className="items-center pt-2 pb-1">
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#d3cdc1",
          }}
        />
      </View>

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-ink-2">Close</Text>
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Filters</Text>
        <Pressable onPress={reset} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-primary">Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Price */}
        <SectionLabel>Price range</SectionLabel>
        <View className="flex-row gap-2.5 mt-2">
          <PriceField
            label="Min"
            value={minPrice}
            onChange={setMinPrice}
            placeholder="₦0"
          />
          <PriceField
            label="Max"
            value={maxPrice}
            onChange={setMaxPrice}
            placeholder="₦ any"
          />
        </View>
        <Text className="text-[11.5px] text-ink-3 mt-2">
          {minPrice ? fmtNaira(Number(minPrice)) : "₦0"} —{" "}
          {maxPrice ? fmtNaira(Number(maxPrice)) : "any"}
        </Text>

        {/* Listing type */}
        <SectionLabel className="mt-6">Listing type</SectionLabel>
        <ChipRow
          values={LISTING_TYPES}
          selected={listingType}
          onSelect={setListingType}
        />

        {/* Property type */}
        <SectionLabel className="mt-6">Property type</SectionLabel>
        <ChipRow
          values={PROPERTY_TYPES}
          selected={propertyType}
          onSelect={setPropertyType}
        />

        {/* Beds */}
        <SectionLabel className="mt-6">Bedrooms</SectionLabel>
        <ChipRow values={BEDS} selected={beds} onSelect={setBeds} />

        {/* Baths */}
        <SectionLabel className="mt-6">Bathrooms</SectionLabel>
        <ChipRow values={BATHS} selected={baths} onSelect={setBaths} />
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 20) + 10,
        }}
      >
        <Pressable
          onPress={apply}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Show homes
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
      className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}

function PriceField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] font-sans-bold text-ink-3 mb-1.5">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        placeholderTextColor={INK_3}
        keyboardType="number-pad"
        className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px] font-sans-bold"
      />
    </View>
  );
}

function ChipRow({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingTop: 8 }}
    >
      {values.map((v) => {
        const on = selected === v;
        return (
          <Pressable
            key={v}
            onPress={() => onSelect(v)}
            className="px-4 py-2.5 rounded-full"
            style={{
              backgroundColor: on ? INK : "#ffffff",
              borderWidth: on ? 0 : 1,
              borderColor: "#e1dcd3",
            }}
          >
            <Text
              className="text-[13px] font-sans-bold"
              style={{ color: on ? "#ffffff" : INK_2 }}
            >
              {v}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
