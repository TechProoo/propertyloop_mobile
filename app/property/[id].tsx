import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { tapLight, tapMedium } from "@/lib/haptics";
import { toggleSaved, useIsSaved } from "@/lib/favourites";
import listingsService from "@/api/services/listings";
import messagesService, { type ConversationRole } from "@/api/services/messages";
import { useAuth } from "@/context/auth";
import type { Listing } from "@/api/types";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

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

function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return Math.max(0, d);
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
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
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="home-outline" size={36} color={INK_3} />
        <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
          This listing isn’t available
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

  return <ListingDetail listing={listing} listingId={id!} />;
}

function ListingDetail({
  listing,
  listingId,
}: {
  listing: Listing;
  listingId: string;
}) {
  const { user } = useAuth();
  const saved = useIsSaved(listing.id);
  const [startingChat, setStartingChat] = useState(false);
  const period = listing.period ?? "";
  const photoCount = listing.images?.length || 1;

  const messageAgent = async () => {
    if (!listing.agent || !user || startingChat) return;
    setStartingChat(true);
    try {
      const conv = await messagesService.createOrFind({
        recipientId: listing.agent.id,
        recipientRole: "AGENT",
        senderRole: user.role as ConversationRole,
        listingId: listing.id,
      });
      router.push(`/conversation/${conv.conversationId}` as Href);
    } catch (e: any) {
      Alert.alert(
        "Couldn't start chat",
        e?.response?.data?.message ?? "Please try again.",
      );
    } finally {
      setStartingChat(false);
    }
  };

  const stats: { icon: keyof typeof Ionicons.glyphMap; n: string; l: string }[] =
    [
      { icon: "bed-outline", n: String(listing.beds), l: "Beds" },
      { icon: "water-outline", n: String(listing.baths), l: "Baths" },
      ...(listing.sqft
        ? [
            {
              icon: "resize-outline" as const,
              n: `${listing.sqft}`,
              l: "m²",
            },
          ]
        : []),
      ...(listing.yearBuilt
        ? [
            {
              icon: "calendar-outline" as const,
              n: `${listing.yearBuilt}`,
              l: "Built",
            },
          ]
        : []),
    ];

  const handleShare = () => {
    tapLight();
    Share.share({
      title: listing.title,
      message: `${listing.title} — ${listing.priceLabel} · ${listing.location}`,
    }).catch(() => {});
  };

  const primaryCta =
    listing.type === "SALE"
      ? { label: "Make an offer", pathname: "/make-offer" }
      : listing.type === "SHORTLET"
        ? { label: "Book stay", pathname: "/shortlet-request" }
        : { label: "Apply to rent", pathname: "/rental-application" };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={{ height: 360 }} className="relative">
          <Image
            source={listing.coverImage}
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

          {/* Top chrome */}
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
                onPress={() => toggleSaved(listing.id)}
                hitSlop={8}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                accessibilityRole="button"
                accessibilityLabel={saved ? "Remove from saved" : "Save this home"}
                accessibilityState={{ selected: saved }}
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
              className="absolute right-4 px-2.5 py-1 rounded-full"
              style={{ bottom: 56, backgroundColor: "rgba(0,0,0,0.55)" }}
            >
              <Text className="text-[11px] font-sans-bold text-white">
                {photoCount} photos
              </Text>
            </View>
          )}
        </View>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <View
          className="bg-cream px-5 pt-6"
          style={{
            marginTop: -24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          {/* Tag row */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="bg-accent-soft px-2.5 py-1.5 rounded-full flex-row items-center gap-1">
              <Ionicons name="star" size={12} color={ACCENT} />
              <Text
                className="text-[12.5px] font-sans-bold"
                style={{ color: "#6b4a16" }}
              >
                {listing.rating}
              </Text>
            </View>
            <View className="bg-cream-2 px-3 py-1.5 rounded-full">
              <Text className="text-[12px] font-sans-bold text-ink-2">
                {listing.propertyType}
              </Text>
            </View>
            {listing.verified && (
              <View className="ml-auto bg-primary-soft px-2.5 py-1.5 rounded-full flex-row items-center gap-1">
                <Ionicons name="shield-checkmark" size={11} color={PRIMARY} />
                <Text
                  className="text-[10px] font-sans-bold tracking-widest uppercase"
                  style={{ color: PRIMARY_INK }}
                >
                  Verified
                </Text>
              </View>
            )}
          </View>

          {/* Title + address */}
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

          {/* Price */}
          <View className="mt-4 bg-primary-soft rounded-2xl px-4 py-3.5">
            <View className="flex-row items-baseline justify-between">
              <Text
                className="font-serif"
                style={{ fontSize: 32, letterSpacing: -1, color: PRIMARY_INK }}
              >
                {listing.priceLabel}
                <Text style={{ fontSize: 15 }}>{period}</Text>
              </Text>
              <Text
                className="text-[11px] font-sans-semibold"
                style={{ color: PRIMARY_INK, opacity: 0.7 }}
              >
                Listed {daysAgo(listing.createdAt)} days ago
              </Text>
            </View>
            {listing.type === "SALE" && (
              <View className="mt-1.5 flex-row items-center justify-between">
                <Text
                  className="text-[12.5px]"
                  style={{ color: PRIMARY_INK, opacity: 0.8 }}
                >
                  Open to <Text className="font-sans-bold">offers</Text>
                </Text>
                <Pressable
                  onPress={() => {
                    tapLight();
                    router.push(`/comps?id=${listingId}` as Href);
                  }}
                  hitSlop={8}
                  className="flex-row items-center gap-1"
                  accessibilityRole="button"
                  accessibilityLabel="See comparable sales"
                >
                  <Text
                    className="text-[12.5px] font-sans-bold"
                    style={{ color: PRIMARY_INK }}
                  >
                    Comps
                  </Text>
                  <Ionicons name="arrow-forward" size={11} color={PRIMARY_INK} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Stats grid */}
          <View className="flex-row gap-2 mt-3.5">
            {stats.map((s) => (
              <View
                key={s.l}
                className="flex-1 bg-cream-2 rounded-xl items-center"
                style={{ paddingVertical: 10 }}
              >
                <Ionicons name={s.icon} size={16} color={INK_2} />
                <Text
                  className="text-[15px] font-sans-bold text-ink mt-1"
                  style={{ letterSpacing: -0.3 }}
                >
                  {s.n}
                </Text>
                <Text className="text-[10px] font-sans-semibold text-ink-3 tracking-widest uppercase mt-0.5">
                  {s.l}
                </Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {!!listing.description && (
            <>
              <Text className="text-[15px] font-sans-bold text-ink mt-6 mb-2">
                About this home
              </Text>
              <Text className="text-[13.5px] text-ink-2 leading-6">
                {listing.description}
              </Text>
            </>
          )}

          {/* Features */}
          {listing.features?.length > 0 && (
            <>
              <Text className="text-[15px] font-sans-bold text-ink mt-6 mb-2.5">
                Features
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {listing.features.map((f) => (
                  <View
                    key={f}
                    className="bg-cream-2 px-3 py-2 rounded-full flex-row items-center gap-1.5"
                  >
                    <Ionicons name="checkmark-circle" size={13} color={PRIMARY} />
                    <Text className="text-[12.5px] font-sans-medium text-ink-2">
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Listed by */}
          {listing.agent && (
            <>
              <Text className="text-[14px] font-sans-bold text-ink mt-6 mb-2.5">
                Listed by
              </Text>
              <Pressable
                onPress={() =>
                  router.push(`/agent-profile/${listing.agent!.id}` as Href)
                }
                className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line active:opacity-90"
                style={{ borderWidth: 1 }}
              >
                <PLAvatar initials={initialsOf(listing.agent.name)} size={46} tone="primary" />
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[14px] font-sans-bold text-ink">
                      {listing.agent.name}
                    </Text>
                    {listing.agent.verified && (
                      <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
                    )}
                  </View>
                  <Text className="text-xs font-sans-semibold text-ink-3 mt-0.5">
                    {[
                      listing.agent.agency,
                      `${listing.agent.soldRentedCount} deals`,
                      `⭐ ${listing.agent.rating}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    messageAgent();
                  }}
                  disabled={startingChat}
                  hitSlop={8}
                  className="w-10 h-10 rounded-full bg-primary-soft items-center justify-center active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Message agent"
                >
                  {startingChat ? (
                    <ActivityIndicator size="small" color={PRIMARY} />
                  ) : (
                    <Ionicons name="chatbubble-ellipses" size={17} color={PRIMARY} />
                  )}
                </Pressable>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky dual CTA ─────────────────────────────────────────── */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-white/95 border-line"
        style={{
          borderTopWidth: 0.5,
          paddingTop: 14,
          paddingBottom: 30,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              tapLight();
              router.push({
                pathname: "/book-viewing",
                params: { listingId: listing.id },
              } as Href);
            }}
            className="flex-1 bg-cream-2 rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 15 }}
            accessibilityRole="button"
            accessibilityLabel="Book a viewing"
          >
            <Text className="text-[14px] font-sans-bold text-ink">
              Book a viewing
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              tapMedium();
              router.push({
                pathname: primaryCta.pathname,
                params: { listingId: listing.id },
              } as Href);
            }}
            className="flex-1 bg-primary rounded-full flex-row items-center justify-center gap-1.5 active:opacity-80"
            style={{ paddingVertical: 15 }}
            accessibilityRole="button"
            accessibilityLabel={primaryCta.label}
          >
            <Text className="text-[14px] font-sans-bold text-white">
              {primaryCta.label}
            </Text>
            <Ionicons name="arrow-forward" size={15} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
