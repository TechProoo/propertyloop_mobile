import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { SERVICE_CATEGORIES_GRID } from "@/mocks/services";
import vendorsService from "@/api/services/vendors";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type IonName = keyof typeof Ionicons.glyphMap;

// Filter chips = "All" + the 8 service categories. "All" views every vendor.
const FILTERS: { id: string; label: string; icon: IonName }[] = [
  { id: "all", label: "All", icon: "apps-outline" },
  ...SERVICE_CATEGORIES_GRID,
];

// Vendor `serviceCategory` is free text entered at signup ("Electrical",
// "Air Conditioning", "AC repair"…), so an exact match drops valid vendors.
// We match leniently on keywords instead, client-side.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  plumbing: ["plumb"],
  electric: ["electric"],
  cleaning: ["clean"],
  carpentry: ["carpentr", "carpenter", "wood", "furnitur"],
  painting: ["paint"],
  ac: ["a/c", "air condition", "hvac", "cooling", "aircon"],
  garden: ["garden", "landscap", "lawn"],
  movers: ["mov", "relocat", "haul"],
};

function matchesCategory(vendor: any, catId: string) {
  if (catId === "all") return true;
  const cat = (vendor.category ?? "").toLowerCase();
  const kws = CATEGORY_KEYWORDS[catId] ?? [catId];
  return kws.some((k) => cat.includes(k));
}

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function ServicesScreen() {
  const [selected, setSelected] = useState("all");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      // Fetch the marketplace once, then filter/sort on-device — instant chips,
      // no refetch per tap, and robust to free-text category values.
      const res = await vendorsService.list({ limit: 100 });
      return res.items ?? [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let on = true;
    setLoading(true);
    load()
      .then((items) => on && setVendors(items))
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const items = await load();
    setVendors(items);
    setRefreshing(false);
  }, [load]);

  const countFor = useCallback(
    (catId: string) => vendors.filter((v) => matchesCategory(v, catId)).length,
    [vendors],
  );

  const selectedFilter = FILTERS.find((f) => f.id === selected) ?? FILTERS[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors
      .filter((v) => matchesCategory(v, selected))
      .filter(
        (v) =>
          !q ||
          [v.name, v.category, v.serviceArea]
            .filter(Boolean)
            .some((s: string) => s.toLowerCase().includes(q)),
      )
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [vendors, selected, query]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-1">
          <Text
            className="text-[11px] font-sans-bold text-primary tracking-widest uppercase"
            style={{ letterSpacing: 1.3 }}
          >
            Service Loop
          </Text>
          <Text
            className="font-serif text-ink mt-1"
            style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}
          >
            People who <Text className="font-serif-italic">fix things</Text>.
          </Text>
          <Text className="text-[12.5px] text-ink-2 mt-1.5 leading-5">
            Verified vendors. Pay through escrow — released only when the job
            is done.
          </Text>
        </View>

        {/* Search */}
        <View className="px-5 pt-3.5">
          <View
            className="bg-white rounded-full px-3.5 py-3 flex-row items-center gap-2.5 border-line"
            style={{ borderWidth: 1 }}
          >
            <Ionicons name="search" size={17} color={INK_2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search vendors by name, trade or area…"
              placeholderTextColor={INK_3}
              className="flex-1 text-[14px] text-ink font-sans-medium"
              style={{ paddingVertical: 0 }}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={INK_3} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category filter chips — horizontal, with live counts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {FILTERS.map((c) => {
            const isOn = selected === c.id;
            const n = countFor(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelected(c.id)}
                className={`flex-row items-center gap-1.5 rounded-full px-3.5 ${
                  isOn ? "bg-ink" : "bg-white"
                }`}
                style={{
                  height: 38,
                  borderWidth: isOn ? 0 : 1,
                  borderColor: "#e1dcd3",
                }}
              >
                <Ionicons
                  name={c.icon}
                  size={15}
                  color={isOn ? "#ffffff" : PRIMARY}
                />
                <Text
                  className={`text-[12.5px] font-sans-bold ${
                    isOn ? "text-white" : "text-ink"
                  }`}
                >
                  {c.label}
                </Text>
                {!loading && n > 0 && (
                  <View
                    className="rounded-full px-1.5"
                    style={{
                      minWidth: 18,
                      alignItems: "center",
                      backgroundColor: isOn ? "rgba(255,255,255,0.22)" : "#eef0ec",
                    }}
                  >
                    <Text
                      className={`text-[10px] font-sans-bold ${
                        isOn ? "text-white" : "text-ink-3"
                      }`}
                    >
                      {n}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Vendors header */}
        <View className="px-5 pt-4 flex-row items-baseline justify-between">
          <Text className="text-[14px] font-sans-bold text-ink tracking-tight">
            {selected === "all" ? "All vendors" : selectedFilter.label}
          </Text>
          {!loading && filtered.length > 0 && (
            <Text className="text-[12px] font-sans-semibold text-ink-3">
              {filtered.length} {filtered.length === 1 ? "vendor" : "vendors"}
            </Text>
          )}
        </View>

        {/* Vendor rows */}
        {loading ? (
          <View className="py-10 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center px-8 pt-9">
            <View className="w-14 h-14 rounded-2xl bg-cream-2 items-center justify-center">
              <Ionicons name="search-outline" size={24} color={INK_3} />
            </View>
            <Text className="text-[14px] font-sans-bold text-ink mt-3">
              No vendors found
            </Text>
            <Text className="text-[12.5px] text-ink-3 mt-1 text-center leading-5">
              {query.trim()
                ? `Nothing matches “${query.trim()}”.`
                : `No ${selectedFilter.label.toLowerCase()} vendors are available yet.`}
            </Text>
            {(selected !== "all" || !!query.trim()) && (
              <Pressable
                onPress={() => {
                  setSelected("all");
                  setQuery("");
                }}
                className="mt-4 bg-ink rounded-full px-5 py-2.5 active:opacity-90"
              >
                <Text className="text-white font-sans-bold text-[12.5px]">
                  View all services
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View className="px-4 pt-2.5 gap-2.5">
            {filtered.map((v) => (
              <VendorRow key={v.id} vendor={v} />
            ))}
          </View>
        )}

        {/* Escrow trust strip */}
        <Pressable
          onPress={() => router.push("/escrow-info" as Href)}
          className="mx-4 mt-3.5 bg-ink rounded-2xl px-3.5 py-3.5 flex-row items-center gap-3 active:opacity-90"
        >
          <View
            className="w-9 h-9 rounded-[10px] items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
          >
            <Ionicons name="shield-checkmark" size={18} color="#7ad296" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-sans-bold text-white">
              Escrow-protected payments
            </Text>
            <Text
              className="text-[11px] mt-0.5 leading-4"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Money's locked until you confirm the job is done.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#ffffff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function VendorRow({ vendor }: { vendor: any }) {
  const priceLabel = vendor.priceLabel ?? vendor.price;
  return (
    <Pressable
      onPress={() => router.push(`/vendor/${vendor.id}` as Href)}
      className="flex-row gap-3 p-3 bg-white rounded-2xl border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      {vendor.avatarUrl ? (
        <Image source={vendor.avatarUrl} style={{ width: 52, height: 52, borderRadius: 26 }} contentFit="cover" />
      ) : (
        <PLAvatar initials={initialsOf(vendor.name)} size={52} tone="primary" />
      )}
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[14px] font-sans-bold text-ink flex-shrink" numberOfLines={1}>
            {vendor.name}
          </Text>
          {vendor.verified && <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />}
          {!!priceLabel && (
            <Text className="ml-auto text-[12px] font-sans-bold text-primary" numberOfLines={1}>
              {priceLabel}
            </Text>
          )}
        </View>
        <Text className="text-xs text-ink-3 mt-0.5" numberOfLines={1}>
          {vendor.category ?? "Service"}
        </Text>
        <View className="flex-row items-center gap-3 mt-1.5">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={11} color={ACCENT} />
            <Text className="text-[11.5px] font-sans-semibold text-ink">{vendor.rating ?? 0}</Text>
          </View>
          <Text className="text-[11.5px] font-sans-semibold text-ink-3">{vendor.jobsCount ?? 0} jobs</Text>
          {!!vendor.serviceArea && (
            <View className="ml-auto flex-row items-center gap-1 flex-shrink">
              <Ionicons name="location-outline" size={11} color={INK_3} />
              <Text className="text-[11.5px] font-sans-semibold text-ink-3" numberOfLines={1}>
                {vendor.serviceArea}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
