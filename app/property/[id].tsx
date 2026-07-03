import { useEffect, useRef, useState } from "react";
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
import { Alert } from "@/lib/dialog";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  Appear,
  PressableScale,
  SaveHeart,
  stagger,
} from "@/components/anim";
import { PhotoViewer } from "@/components/PhotoViewer";
import { RichText } from "@/lib/richText";
import { tapLight, tapMedium } from "@/lib/haptics";
import listingsService from "@/api/services/listings";
import messagesService, { type ConversationRole } from "@/api/services/messages";
import bookmarksService from "@/api/services/bookmarks";
import { hydrateOne } from "@/lib/favourites";
import { recordListingView } from "@/lib/recentlyViewed";
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
      .then((l) => {
        if (!active) return;
        setListing(l);
        // Remember it for the Home "Jump back in" rail.
        recordListingView({
          id: l.id,
          title: l.title,
          location: l.location,
          priceLabel: l.priceLabel,
          period: l.period,
          coverImage: l.coverImage,
          verified: l.verified,
        });
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    // Sync this listing's saved state with the server so the heart reflects
    // the truth even if the global launch-sync was skipped or failed.
    bookmarksService
      .checkProperty(id)
      .then((res) => active && hydrateOne(id, !!res?.bookmarked))
      .catch(() => {});
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
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [startingChat, setStartingChat] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const period = listing.period ?? "";

  // `images` already includes the cover as its first element; fall back to the
  // cover alone when the array is missing. Dedupe so a duplicated cover doesn't
  // create a phantom slide.
  const gallery = Array.from(
    new Set(
      (listing.images?.length ? listing.images : [listing.coverImage]).filter(
        Boolean,
      ),
    ),
  );
  const photoCount = gallery.length;

  // Videos attached to the listing. `videoUrls` is the source of truth;
  // `videoUrl` is the legacy single-video field. Dedupe and drop empties.
  const videos = Array.from(
    new Set(
      (listing.videoUrls?.length
        ? listing.videoUrls
        : listing.videoUrl
          ? [listing.videoUrl]
          : []
      ).filter(Boolean),
    ),
  );

  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / screenW);
    if (i !== activePhoto) setActivePhoto(i);
  };

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

  // An agent viewing their own listing can't book a viewing or make an
  // offer/apply on it — those are buyer actions. Public profile ids equal the
  // owner's user id (same convention as the vendor profile screen), so a direct
  // id match identifies the owner. Show a manage shortcut instead of the CTAs.
  const isOwnListing = !!user && !!listing.agent && user.id === listing.agent.id;

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
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
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  setViewerIndex(index);
                  setViewerOpen(true);
                }}
              >
                {index === 0 ? (
                  <HeroImage source={item} width={screenW} />
                ) : (
                  <Image
                    source={item}
                    style={{ width: screenW, height: 360 }}
                    contentFit="cover"
                  />
                )}
              </Pressable>
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
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <SaveHeart id={listing.id} size={18} />
              </View>
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
            {/* Rating badge hidden until the listing actually has a rating —
                a bare "★ 0" reads as a bad score, not "not yet rated". */}
            {(listing.rating ?? 0) > 0 && (
              <View className="bg-accent-soft px-2.5 py-1.5 rounded-full flex-row items-center gap-1">
                <Ionicons name="star" size={12} color={ACCENT} />
                <Text
                  className="text-[12.5px] font-sans-bold"
                  style={{ color: "#6b4a16" }}
                >
                  {listing.rating}
                </Text>
              </View>
            )}
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
          <Appear delay={40}>
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
          </Appear>

          {/* Price */}
          <Appear delay={110}>
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
          </Appear>

          {/* Stats grid — each tile pops in on a short cascade */}
          <View className="flex-row gap-2 mt-3.5">
            {stats.map((s, i) => (
              <Appear key={s.l} delay={180 + i * 70} style={{ flex: 1 }}>
              <View
                className="bg-cream-2 rounded-xl items-center"
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
              </Appear>
            ))}
          </View>

          {/* Description */}
          {!!listing.description && (
            <Appear delay={stagger(5, 200)}>
              <>
                <Text className="text-[15px] font-sans-bold text-ink mt-6 mb-2">
                  About this home
                </Text>
                <RichText
                  html={listing.description}
                  style={{
                    fontSize: 13.5,
                    lineHeight: 22,
                    color: INK_2,
                    fontFamily: "Inter_400Regular",
                  }}
                  boldStyle={{ fontFamily: "Inter_700Bold", color: "#1a2120" }}
                />
              </>
            </Appear>
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

          {/* Video tour */}
          {videos.length > 0 && (
            <>
              <Text className="text-[15px] font-sans-bold text-ink mt-6 mb-2.5">
                {videos.length > 1 ? "Video tours" : "Video tour"}
              </Text>
              <View className="gap-3">
                {videos.map((uri) => (
                  <ListingVideo key={uri} uri={uri} />
                ))}
              </View>
            </>
          )}

          {/* Listed by */}
          {listing.agent && (
            <Appear delay={stagger(6, 200)}>
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
                        listing.agent.soldRentedCount > 0
                          ? `${listing.agent.soldRentedCount} deals`
                          : null,
                        listing.agent.rating > 0
                          ? `⭐ ${listing.agent.rating}`
                          : null,
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
                      <BouncyLoader size="small" color={PRIMARY} />
                    ) : (
                      <Ionicons name="chatbubble-ellipses" size={17} color={PRIMARY} />
                    )}
                  </Pressable>
                </Pressable>
              </>
            </Appear>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky dual CTA ─────────────────────────────────────────── */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-white/95 border-line"
        style={{
          borderTopWidth: 0.5,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 20) + 10,
          paddingHorizontal: 16,
        }}
      >
        {isOwnListing ? (
          <PressableScale
            onPress={() => {
              tapLight();
              router.push(`/agent-listing/${listing.id}` as Href);
            }}
            style={{ paddingVertical: 15 }}
            className="bg-ink rounded-full flex-row items-center justify-center gap-1.5"
            accessibilityRole="button"
            accessibilityLabel="Manage your listing"
          >
            <Ionicons name="create-outline" size={16} color="#ffffff" />
            <Text className="text-[14px] font-sans-bold text-white">
              Manage your listing
            </Text>
          </PressableScale>
        ) : (
          <View className="flex-row gap-2">
            <PressableScale
              onPress={() => {
                tapLight();
                router.push({
                  pathname: "/book-viewing",
                  params: { listingId: listing.id },
                } as Href);
              }}
              style={{ flex: 1, paddingVertical: 15 }}
              className="bg-cream-2 rounded-full items-center"
              accessibilityRole="button"
              accessibilityLabel="Book a viewing"
            >
              <Text className="text-[14px] font-sans-bold text-ink">
                Book a viewing
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                tapMedium();
                router.push({
                  pathname: primaryCta.pathname,
                  params: { listingId: listing.id },
                } as Href);
              }}
              style={{ flex: 1, paddingVertical: 15 }}
              className="bg-primary rounded-full flex-row items-center justify-center gap-1.5"
              accessibilityRole="button"
              accessibilityLabel={primaryCta.label}
            >
              <Text className="text-[14px] font-sans-bold text-white">
                {primaryCta.label}
              </Text>
              <Ionicons name="arrow-forward" size={15} color="#ffffff" />
            </PressableScale>
          </View>
        )}
      </View>

      {/* Full-screen photo viewer */}
      <PhotoViewer
        visible={viewerOpen}
        images={gallery}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

/**
 * Hero entrance for the first gallery image: a gentle fade-in with a subtle
 * zoom-settle (1.06 → 1) so the detail page "arrives" rather than snapping in.
 * `FadeIn` guarantees the image ends fully visible even if the scale worklet
 * never runs, so the hero can never get stuck invisible.
 */
function HeroImage({
  source,
  width,
}: {
  source: string;
  width: number;
}) {
  const scale = useSharedValue(1.06);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(360)} style={style}>
      <Image
        source={source}
        style={{ width, height: 360 }}
        contentFit="cover"
      />
    </Animated.View>
  );
}

/**
 * A single listing video. Doesn't autoplay — the buyer taps play, so opening a
 * listing never blasts audio. Native controls give scrub/fullscreen for free.
 */
function ListingVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={{
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 16,
        backgroundColor: "#000000",
      }}
      nativeControls
      allowsFullscreen
      contentFit="contain"
    />
  );
}
