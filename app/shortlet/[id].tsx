import { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PLAvatar } from "@/components/brand/PLAvatar";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const SHORTLET_PURPLE = "#3c2d5c";

// Mock — the only shortlet so far. Re-wire to real listing service.
const SHORTLET = {
  id: "marlin-studios",
  imageSeed: "short-1",
  title: "Marlin Studios · 1-bed with sea view",
  address: "Eko Atlantic, Victoria Island, Lagos",
  rating: "4.92",
  stays: 184,
  nightlyPrice: "₦85,000",
  checkIn: "Fri 12 Jun",
  checkOut: "Sun 14 Jun",
  nights: 2,
  totalLabel: "₦170,000",
  host: { initials: "FB", name: "Folake B.", badge: "Superhost · 2 years on PropertyLoop" },
  amenities: [
    { icon: "wifi-outline",       label: "Fast Wi-Fi · 500Mbps" },
    { icon: "car-outline",        label: "Free parking" },
    { icon: "shield-outline",     label: "24/7 security" },
    { icon: "water-outline",      label: "Shared pool & gym" },
  ] as const,
} as const;

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/1200/900`;
}

export default function ShortletDetailScreen() {
  useLocalSearchParams<{ id?: string }>();
  const [guests, setGuests] = useState(2);
  const [saved, setSaved] = useState(false);

  const handleShare = () =>
    Share.share({
      title: SHORTLET.title,
      message: `${SHORTLET.title} — ${SHORTLET.nightlyPrice}/night · ${SHORTLET.address}`,
    }).catch(() => {});

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ height: 360 }} className="relative">
          <Image
            source={picsum(SHORTLET.imageSeed)}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 140,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />
          <View
            className="absolute left-4 right-4 flex-row items-center justify-between"
            style={{ top: 56 }}
          >
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            >
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <Ionicons name="share-outline" size={18} color="#ffffff" />
              </Pressable>
              <Pressable
                onPress={() => setSaved((s) => !s)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <Ionicons
                  name={saved ? "heart" : "heart-outline"}
                  size={18}
                  color={saved ? "#ff5a5f" : "#ffffff"}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Body */}
        <View
          className="bg-cream px-5 pt-6"
          style={{ marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {/* Tag row */}
          <View className="flex-row items-center gap-1.5 mb-2.5">
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: SHORTLET_PURPLE }}
            >
              <Text className="text-[10px] font-sans-bold text-white tracking-widest uppercase">
                Shortlet
              </Text>
            </View>
            <View className="bg-primary-soft px-2 py-1 rounded-full flex-row items-center gap-1">
              <Ionicons name="shield-checkmark" size={10} color={PRIMARY} />
              <Text
                className="text-[10px] font-sans-bold tracking-widest uppercase"
                style={{ color: PRIMARY_INK }}
              >
                Verified
              </Text>
            </View>
            <View className="ml-auto flex-row items-center gap-1">
              <Ionicons name="star" size={12} color={ACCENT} />
              <Text className="text-[11px] font-sans-bold text-ink">
                {SHORTLET.rating} · {SHORTLET.stays} stays
              </Text>
            </View>
          </View>

          <Text
            className="font-sans-bold text-ink tracking-tight"
            style={{ fontSize: 22, lineHeight: 26 }}
          >
            {SHORTLET.title}
          </Text>
          <View className="flex-row items-center gap-1 mt-1.5">
            <Ionicons name="location-outline" size={14} color={INK_2} />
            <Text className="text-[13.5px] font-sans-medium text-ink-2">
              {SHORTLET.address}
            </Text>
          </View>

          {/* Booking widget */}
          <View
            className="mt-4 bg-white rounded-[18px] p-3.5 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <View className="flex-row items-baseline gap-1.5">
              <Text
                className="font-serif text-ink"
                style={{ fontSize: 28, letterSpacing: -0.6 }}
              >
                {SHORTLET.nightlyPrice}
              </Text>
              <Text className="text-xs text-ink-3 font-sans-semibold">
                / night
              </Text>
            </View>

            <View className="mt-3 flex-row gap-2">
              <DatePick label="Check-in" value={SHORTLET.checkIn} />
              <DatePick label="Check-out" value={SHORTLET.checkOut} />
            </View>

            <View className="mt-2 bg-cream-2 rounded-xl px-3 py-2.5 flex-row items-center gap-2">
              <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
                Guests
              </Text>
              <Text className="text-[13px] font-sans-bold text-ink">
                {guests} {guests === 1 ? "adult" : "adults"}
              </Text>
              <View className="ml-auto flex-row items-center gap-1.5">
                <QtyBtn
                  glyph="−"
                  onPress={() => setGuests((g) => Math.max(1, g - 1))}
                />
                <Text
                  className="font-sans-bold text-ink"
                  style={{ fontSize: 14, minWidth: 14, textAlign: "center" }}
                >
                  {guests}
                </Text>
                <QtyBtn
                  glyph="+"
                  onPress={() => setGuests((g) => Math.min(8, g + 1))}
                />
              </View>
            </View>
          </View>

          {/* Host */}
          <Text className="text-[14px] font-sans-bold text-ink mt-6 mb-2.5">
            Hosted by
          </Text>
          <View
            className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <PLAvatar initials={SHORTLET.host.initials} size={46} tone="primary" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[14px] font-sans-bold text-ink">
                  {SHORTLET.host.name}
                </Text>
                <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
              </View>
              <Text className="text-xs font-sans-semibold text-ink-3 mt-0.5">
                {SHORTLET.host.badge}
              </Text>
            </View>
          </View>

          {/* Amenities */}
          <Text className="text-[14px] font-sans-bold text-ink mt-6 mb-2.5">
            What's included
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {SHORTLET.amenities.map((a) => (
              <View
                key={a.label}
                className="bg-white rounded-xl border-line flex-row items-center gap-2.5"
                style={{
                  width: "48%",
                  paddingHorizontal: 12,
                  paddingVertical: 11,
                  borderWidth: 0.5,
                }}
              >
                <Ionicons name={a.icon} size={18} color={INK_2} />
                <Text
                  className="text-[12.5px] font-sans-semibold text-ink flex-1"
                  numberOfLines={1}
                >
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 border-line"
        style={{
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTopWidth: 0.5,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 30,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
              {SHORTLET.nights} nights total
            </Text>
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 22, letterSpacing: -0.4, lineHeight: 24 }}
            >
              {SHORTLET.totalLabel}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/shortlet-request",
                params: { shortletId: SHORTLET.id },
              } as Href)
            }
            className="bg-primary rounded-full active:opacity-80"
            style={{ paddingHorizontal: 22, paddingVertical: 15 }}
          >
            <Text className="text-[14px] font-sans-bold text-white">
              Reserve
            </Text>
          </Pressable>
        </View>
      </View>

    </View>
  );
}

function DatePick({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-cream-2 rounded-xl px-3 py-2.5">
      <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase">
        {label}
      </Text>
      <Text className="text-[13px] font-sans-bold text-ink mt-0.5">
        {value}
      </Text>
    </View>
  );
}

function QtyBtn({ glyph, onPress }: { glyph: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[26px] h-[26px] rounded-full bg-white border-line items-center justify-center"
      style={{ borderWidth: 1 }}
    >
      <Text className="font-sans-bold text-ink" style={{ fontSize: 14, lineHeight: 16 }}>
        {glyph}
      </Text>
    </Pressable>
  );
}
