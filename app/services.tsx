import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function ServicesScreen() {
  const [selected, setSelected] = useState(SERVICE_CATEGORIES_GRID[0]?.id ?? "");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCat = SERVICE_CATEGORIES_GRID.find((c) => c.id === selected);

  useEffect(() => {
    let on = true;
    setLoading(true);
    vendorsService
      .list({ category: selectedCat?.label, limit: 30 })
      .then((res) => on && setVendors(res.items))
      .catch(() => on && setVendors([]))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
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

        {/* Search pill */}
        <View className="px-5 pt-3.5">
          <View
            className="bg-white rounded-full px-3.5 py-3 flex-row items-center gap-2.5 border-line"
            style={{ borderWidth: 1 }}
          >
            <Ionicons name="search" size={17} color={INK_2} />
            <Text className="flex-1 text-[14px] text-ink-3 font-sans-medium">
              Search "leaking tap", "deep clean"…
            </Text>
            <View className="bg-cream-2 px-2 py-1 rounded-full">
              <Text className="text-[11px] font-sans-bold text-ink-2">
                Lekki
              </Text>
            </View>
          </View>
        </View>

        {/* Category grid (4×2) */}
        <View
          className="px-5 pt-3 flex-row flex-wrap"
          style={{ gap: 8 }}
        >
          {SERVICE_CATEGORIES_GRID.map((c) => {
            const isOn = selected === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelected(c.id)}
                className={`items-center justify-center gap-1 rounded-2xl ${
                  isOn ? "bg-ink" : "bg-white"
                }`}
                style={{
                  width: "23%",
                  paddingTop: 10,
                  paddingBottom: 9,
                  borderWidth: isOn ? 0 : 1,
                  borderColor: "#e1dcd3",
                }}
              >
                <Ionicons
                  name={c.icon}
                  size={20}
                  color={isOn ? "#ffffff" : PRIMARY}
                />
                <Text
                  className={`text-[10.5px] font-sans-bold ${
                    isOn ? "text-white" : "text-ink"
                  }`}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Vendors header */}
        <View className="px-5 pt-4 flex-row items-baseline justify-between">
          <Text className="text-[14px] font-sans-bold text-ink tracking-tight">
            {selectedCat?.label ?? "Vendors"} · top rated
          </Text>
        </View>

        {/* Vendor rows */}
        {loading ? (
          <View className="py-10 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : vendors.length === 0 ? (
          <Text className="px-5 pt-3 text-[12.5px] text-ink-3">
            No {selectedCat?.label?.toLowerCase() ?? "vendors"} available yet.
          </Text>
        ) : (
          <View className="px-4 pt-2.5 gap-2.5">
            {vendors.map((v) => (
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
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <Text className="text-[14px] font-sans-bold text-ink">{vendor.name}</Text>
          {vendor.verified && <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />}
        </View>
        <Text className="text-xs text-ink-3 mt-0.5">{vendor.category ?? "Service"}</Text>
        <View className="flex-row items-center gap-3 mt-1.5">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={11} color={ACCENT} />
            <Text className="text-[11.5px] font-sans-semibold text-ink">{vendor.rating ?? 0}</Text>
          </View>
          <Text className="text-[11.5px] font-sans-semibold text-ink-3">{vendor.jobsCount ?? 0} jobs</Text>
          {!!vendor.serviceArea && (
            <Text className="ml-auto text-[11.5px] font-sans-semibold text-ink-3" numberOfLines={1}>{vendor.serviceArea}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
