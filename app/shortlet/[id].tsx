import { useEffect, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PLAvatar } from "@/components/brand/PLAvatar";
import listingsService from "@/api/services/listings";
import type { Listing } from "@/api/types";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const SHORTLET_PURPLE = "#3c2d5c";

// Example stay window shown in the booking widget — the guest picks real
// dates on the request screen. Nightly price + total are derived from the
// listing.
const NIGHTS = 2;
const CHECK_IN = "Fri 12 Jun";
const CHECK_OUT = "Sun 14 Jun";

function naira(n?: number | null) {
  return n != null ? `₦${Math.round(n).toLocaleString("en-NG")}` : "—";
}
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

export default function ShortletDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    listingsService
      .getById(id)
      .then((l) => active && setListing(l))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <BouncyLoader color={PRIMARY} />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="bed-outline" size={36} color={INK_3} />
        <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
          This shortlet isn’t available
        </Text>
        <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
          It may have been removed or is no longer active.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-5 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return <ShortletDetail listing={listing} />;
}

function ShortletDetail({ listing }: { listing: Listing }) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const { requireAuth } = useAuth();
  const [guests, setGuests] = useState(2);
  const [saved, setSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  // `images` already includes the cover as its first element; dedupe so a
  // repeated cover doesn't create a phantom slide.
  const gallery = Array.from(
    new Set(
      (listing.images?.length ? listing.images : [listing.coverImage]).filter(
        Boolean,
      ),
    ),
  );
  const photoCount = gallery.length;

  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / screenW);
    if (i !== activePhoto) setActivePhoto(i);
  };

  const agent = listing.agent;
  const hostBadge =
    [
      agent?.verified ? "Verified host" : null,
      agent?.agency,
      agent?.yearsExperience
        ? `${agent.yearsExperience} yr${agent.yearsExperience === 1 ? "" : "s"} on PropertyLoop`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Verified host";
  const features = listing.features?.slice(0, 6) ?? [];
  const totalLabel = naira(listing.priceNaira * NIGHTS);

  const handleShare = () =>
    Share.share({
      title: listing.title,
      message: `${listing.title} — ${listing.priceLabel}/night · ${listing.address}`,
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
          <FlatList
            data={gallery}
            keyExtractor={(uri, i) => `${i}-${uri}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
            scrollEnabled={photoCount > 1}
            renderItem={({ item }) => (
              <Image
                source={item}
                style={{ width: screenW, height: 360 }}
                contentFit="cover"
              />
            )}
          />
          <View
            pointerEvents="none"
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

          {/* Photo counter */}
          {photoCount > 1 && (
            <View
              className="absolute right-4 flex-row items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ bottom: 56, backgroundColor: "rgba(0,0,0,0.55)" }}
            >
              <Ionicons name="image" size={11} color="#ffffff" />
              <Text className="text-[11px] font-sans-bold text-white">
                {activePhoto + 1} / {photoCount}
              </Text>
            </View>
          )}

          {/* Page indicator dots */}
          {photoCount > 1 && photoCount <= 10 && (
            <View
              className="absolute left-0 right-0 flex-row items-center justify-center gap-1.5"
              style={{ bottom: 58 }}
              pointerEvents="none"
            >
              {gallery.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === activePhoto ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                      i === activePhoto ? "#ffffff" : "rgba(255,255,255,0.55)",
                  }}
                />
              ))}
            </View>
          )}
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
            {listing.verified && (
              <View className="bg-primary-soft px-2 py-1 rounded-full flex-row items-center gap-1">
                <Ionicons name="shield-checkmark" size={10} color={PRIMARY} />
                <Text
                  className="text-[10px] font-sans-bold tracking-widest uppercase"
                  style={{ color: PRIMARY_INK }}
                >
                  Verified
                </Text>
              </View>
            )}
            {listing.rating > 0 && (
              <View className="ml-auto flex-row items-center gap-1">
                <Ionicons name="star" size={12} color={ACCENT} />
                <Text className="text-[11px] font-sans-bold text-ink">
                  {listing.rating}
                </Text>
              </View>
            )}
          </View>

          <Text
            className="font-sans-bold text-ink tracking-tight"
            style={{ fontSize: 22, lineHeight: 26 }}
          >
            {listing.title}
          </Text>
          <View className="flex-row items-center gap-1 mt-1.5">
            <Ionicons name="location-outline" size={14} color={INK_2} />
            <Text className="text-[13.5px] font-sans-medium text-ink-2">
              {listing.address}
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
                {listing.priceLabel}
              </Text>
              <Text className="text-xs text-ink-3 font-sans-semibold">
                {listing.period ?? "/ night"}
              </Text>
            </View>

            <View className="mt-3 flex-row gap-2">
              <DatePick label="Check-in" value={CHECK_IN} />
              <DatePick label="Check-out" value={CHECK_OUT} />
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
            <PLAvatar
              initials={initialsOf(agent?.name)}
              uri={agent?.avatarUrl}
              size={46}
              tone="primary"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[14px] font-sans-bold text-ink">
                  {agent?.name ?? "PropertyLoop host"}
                </Text>
                {agent?.verified && (
                  <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
                )}
              </View>
              <Text className="text-xs font-sans-semibold text-ink-3 mt-0.5">
                {hostBadge}
              </Text>
            </View>
          </View>

          {/* What's included */}
          {features.length > 0 && (
            <>
              <Text className="text-[14px] font-sans-bold text-ink mt-6 mb-2.5">
                What&apos;s included
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {features.map((f) => (
                  <View
                    key={f}
                    className="bg-white rounded-xl border-line flex-row items-center gap-2.5"
                    style={{
                      width: "48%",
                      paddingHorizontal: 12,
                      paddingVertical: 11,
                      borderWidth: 0.5,
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={PRIMARY} />
                    <Text
                      className="text-[12.5px] font-sans-semibold text-ink flex-1"
                      numberOfLines={1}
                    >
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
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
          paddingBottom: Math.max(insets.bottom, 20) + 10,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
              {NIGHTS} nights total
            </Text>
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 22, letterSpacing: -0.4, lineHeight: 24 }}
            >
              {totalLabel}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (!requireAuth("book this stay")) return;
              router.push({
                pathname: "/shortlet-request",
                params: { shortletId: listing.id },
              } as Href);
            }}
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
