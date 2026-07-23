import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { SERVICE_CATEGORIES_GRID } from "@/mocks/services";
import vendorsService from "@/api/services/vendors";
import bookmarksService from "@/api/services/bookmarks";
import { useAuth } from "@/context/auth";
import { tapLight } from "@/lib/haptics";

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
  const { requireAuth, status } = useAuth();
  const insets = useSafeAreaInsets();
  // Clear the edge-to-edge Android nav bar (falls back to 48dp before the
  // inset resolves) so the escrow strip isn't tucked under the nav buttons.
  const bottomPad =
    (insets.bottom > 0 ? insets.bottom : Platform.OS === "android" ? 48 : 0) + 20;
  const [selected, setSelected] = useState("all");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  // Vendor userIds the signed-in user has saved to favourites.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

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
    // Seed saved favourites in one call. Skipped for guests — favourites are
    // account-based, so there's nothing to seed and the request would only 401.
    if (status === "authed") {
      bookmarksService
        .listVendorIds()
        .then((ids) => on && setSavedIds(new Set(ids)))
        .catch(() => {});
    }
    return () => {
      on = false;
    };
  }, [load, status]);

  // Optimistic favourite toggle, reconciled by reverting if the request fails.
  const toggleSave = useCallback(
    (id: string) => {
      tapLight();
      if (!requireAuth("save this vendor")) return;
      const willSave = !savedIds.has(id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.add(id);
        else next.delete(id);
        return next;
      });
      bookmarksService.toggleVendor(id).catch(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (willSave) next.delete(id);
          else next.add(id);
          return next;
        });
      });
    },
    [savedIds, requireAuth],
  );

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
        contentContainerStyle={{ paddingBottom: bottomPad }}
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
            style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 32 }}
          >
            Hire <Text className="font-serif-italic">trusted</Text> professionals.
          </Text>
          <Text className="text-[12.5px] text-ink-2 mt-1.5 leading-5">
            Hire verified artisans and professionals with secure escrow payment.
          </Text>
          <View className="mt-4 rounded-2xl px-3.5 py-3 flex-row items-center gap-3" style={{ backgroundColor: "#e3efe7", borderWidth: 0.5, borderColor: "#cfe5d8" }}>
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: PRIMARY }}>
              <Ionicons name="shield-checkmark" size={19} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-[12.5px] font-sans-bold text-ink">Pay only when the work is done</Text>
              <Text className="text-[11.5px] text-ink-2 mt-0.5 leading-4">Every booking is protected by PropertyLoop escrow.</Text>
            </View>
            <Ionicons name="lock-closed" size={15} color={PRIMARY} />
          </View>
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
              placeholder="Search by trade or company name"
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
              <VendorCard
                key={v.id}
                vendor={v}
                saved={savedIds.has(v.id)}
                onToggleSave={() => toggleSave(v.id)}
              />
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

function VendorCard({
  vendor,
  saved,
  onToggleSave,
}: {
  vendor: any;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const priceLabel = vendor.priceLabel ?? vendor.price;
  const rating = Number(vendor.rating ?? 0);
  const jobs = Number(vendor.jobsCount ?? 0);
  // The public directory only lists vendors who are open for hire, so this is
  // effectively always true here — shown as a reassurance badge, not a filter.
  const available = vendor.availableForHire !== false;
  const goToProfile = () => router.push(`/vendor/${vendor.id}` as Href);

  return (
    <Pressable
      onPress={goToProfile}
      className="bg-white rounded-[20px] border-line active:opacity-95"
      style={{ borderWidth: 0.5, padding: 13 }}
    >
      {/* Top row — avatar, name/category, favourite heart */}
      <View className="flex-row gap-3">
        {vendor.avatarUrl ? (
          <Image source={vendor.avatarUrl} style={{ width: 54, height: 54, borderRadius: 27 }} contentFit="cover" />
        ) : (
          <PLAvatar initials={initialsOf(vendor.name)} size={54} tone="primary" />
        )}

        <View className="flex-1">
          <View className="flex-row items-start gap-2">
            <View className="flex-1">
              <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={2} style={{ lineHeight: 18 }}>
                {vendor.name}
              </Text>
              <Text className="text-[12px] text-ink-3 mt-0.5" numberOfLines={1}>
                {vendor.category ?? "Service provider"}
              </Text>
            </View>

            {/* Save to favourites */}
            <Pressable
              onPress={onToggleSave}
              hitSlop={10}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: saved ? "#fdecec" : "#f3f1ec" }}
            >
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={18}
                color={saved ? "#e1483b" : INK_3}
              />
            </Pressable>
          </View>

          {/* Badges — verified + availability */}
          <View className="flex-row flex-wrap items-center gap-1.5 mt-2">
            {vendor.verified && (
              <View
                className="flex-row items-center gap-1 rounded-full px-2 py-1"
                style={{ backgroundColor: "#e7f3ec" }}
              >
                <Ionicons name="shield-checkmark" size={11} color={PRIMARY} />
                <Text className="text-[10.5px] font-sans-bold" style={{ color: PRIMARY }}>
                  Verified business
                </Text>
              </View>
            )}
            <View
              className="flex-row items-center gap-1 rounded-full px-2 py-1"
              style={{ backgroundColor: available ? "#e7f3ec" : "#f0eee9" }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 6,
                  backgroundColor: available ? "#2f9e61" : "#9a948b",
                }}
              />
              <Text
                className="text-[10.5px] font-sans-bold"
                style={{ color: available ? "#1f6f43" : INK_3 }}
              >
                {available ? "Available for work" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Meta row — rating (hidden when none), jobs, service area */}
      <View className="flex-row items-center gap-3 mt-2.5">
        {rating > 0 && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color={ACCENT} />
            <Text className="text-[12px] font-sans-bold text-ink">{rating.toFixed(1)}</Text>
            <Text className="text-[11px] text-ink-3">({jobs || 0} reviews)</Text>
          </View>
        )}
        {jobs > 0 && (
          <Text className="text-[12px] font-sans-semibold text-ink-3">
            {jobs} {jobs === 1 ? "job" : "jobs"} done
          </Text>
        )}
        {!!vendor.serviceArea && (
          <View className="flex-row items-center gap-1 flex-shrink">
            <Ionicons name="location-outline" size={12} color={INK_3} />
            <Text className="text-[12px] font-sans-semibold text-ink-3 flex-shrink" numberOfLines={1}>
              {vendor.serviceArea}
            </Text>
          </View>
        )}
      </View>

      {/* Footer — price + View profile CTA */}
      <View className="flex-row items-center justify-between mt-3 pt-3" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
        {priceLabel ? (
          <View>
            <Text className="text-[10px] font-sans-bold text-ink-3 tracking-wider uppercase">From</Text>
            <Text className="text-[14px] font-sans-bold text-primary" numberOfLines={1}>{priceLabel}</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable
          onPress={goToProfile}
          className="flex-row items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 active:opacity-85"
        >
          <Text className="text-white text-[12.5px] font-sans-bold">View profile</Text>
          <Ionicons name="arrow-forward" size={13} color="#ffffff" />
        </Pressable>
      </View>
    </Pressable>
  );
}
