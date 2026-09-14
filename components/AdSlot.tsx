// Sponsored-content slots for the mobile app.
//
// <AdSlot placement="HOME_BANNER" /> — inline banner/card. Renders nothing at
// all when no campaign is live, so screens carry zero layout cost by default.
// Impression counts once when the ad first renders; a tap records the click
// and opens the brand's landing page in the browser.
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import adsService, { type AdPlacement, type PublicAd } from "@/api/services/ads";

const INK = "#1a2120";
const INK_3 = "#7f857f";
const MINT = "#6ee7b7"; // the "live campaign" dot on the Sponsored chip

/**
 * Every live campaign for a placement, for slots that show more than one.
 * useAd below keeps its single-pick behaviour for the slots that show one.
 */
function useAds(placement: AdPlacement) {
  const [ads, setAds] = useState<PublicAd[]>([]);
  const counted = useRef<Set<string>>(new Set());

  useEffect(() => {
    let on = true;
    adsService
      .serve(placement)
      .then((list) => on && setAds(list))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [placement]);

  // One impression per ad per mount, fired when the card is actually on
  // screen — a rail can hold more ads than the viewer ever scrolls to, so
  // counting on render would bill advertisers for views that never happened.
  const markSeen = (id: string) => {
    if (counted.current.has(id)) return;
    counted.current.add(id);
    adsService.impression(id);
  };

  const open = (ad: PublicAd) => {
    adsService.click(ad.id);
    Linking.openURL(ad.ctaUrl).catch(() => {});
  };

  return { ads, markSeen, open };
}

function useAd(placement: AdPlacement, enabled = true) {
  const [ad, setAd] = useState<PublicAd | null>(null);
  const counted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let on = true;
    adsService
      .serve(placement)
      .then((ads) => {
        if (!on || ads.length === 0) return;
        // Cheap rotation: campaigns sharing a slot take turns per mount.
        setAd(ads[Math.floor(Math.random() * ads.length)]);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [placement, enabled]);

  // Impression is explicit — callers count only when the ad actually shows
  // (inline slots: on render; splash: when the modal opens).
  const markSeen = () => {
    if (ad && !counted.current) {
      counted.current = true;
      adsService.impression(ad.id);
    }
  };

  const open = () => {
    if (!ad) return;
    adsService.click(ad.id);
    Linking.openURL(ad.ctaUrl).catch(() => {});
  };

  return { ad, open, markSeen };
}

/** The little glassy "● SPONSORED" pill that sits on every creative. */
function SponsoredChip({ dark = false }: { dark?: boolean }) {
  return (
    <View
      className="flex-row items-center self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: dark ? "rgba(8,16,11,0.6)" : "rgba(255,255,255,0.18)" }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: MINT, marginRight: 5 }} />
      <Text className="text-[9px] font-sans-bold text-white tracking-widest uppercase">
        Sponsored
      </Text>
    </View>
  );
}

export function AdSlot({
  placement,
  variant = "banner",
  style,
}: {
  placement: AdPlacement;
  /** banner = wide strip; card = grid-item sized (in-feed) */
  variant?: "banner" | "card";
  style?: object;
}) {
  const { ad, open, markSeen } = useAd(placement);
  // Inline slots are visible as soon as they render — count then.
  useEffect(() => {
    if (ad) markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);
  if (!ad) return null;

  if (variant === "card") {
    return (
      <Pressable
        onPress={open}
        className="bg-white rounded-2xl overflow-hidden active:opacity-90"
        style={[{ borderWidth: 0.5, borderColor: "rgba(26,33,32,0.08)" }, style]}
        accessibilityRole="button"
        accessibilityLabel={`Sponsored by ${ad.brandName}: ${ad.headline}`}
      >
        <View className="relative" style={{ height: 124 }}>
          <Image
            source={ad.imageUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={250}
          />
          <LinearGradient
            colors={["transparent", "rgba(8,16,11,0.30)"]}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View className="absolute top-2 left-2">
            <SponsoredChip dark />
          </View>
        </View>
        <View className="px-3 py-2.5">
          <Text className="text-[10.5px] font-sans-semibold" style={{ color: INK_3 }} numberOfLines={1}>
            {ad.brandName}
          </Text>
          <Text className="text-[12.5px] font-sans-bold mt-0.5" style={{ color: INK }} numberOfLines={2}>
            {ad.headline}
          </Text>
          <View className="flex-row items-center mt-1.5">
            <Text className="text-[11.5px] font-sans-bold text-primary mr-1">{ad.ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={11} color="#1f6f43" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={open}
      className="rounded-3xl overflow-hidden active:opacity-95"
      style={[{ height: 134 }, style]}
      accessibilityRole="button"
      accessibilityLabel={`Sponsored by ${ad.brandName}: ${ad.headline}`}
    >
      <BannerCreative ad={ad} />
    </Pressable>
  );
}

/** The banner artwork, wash and copy — shared by AdSlot and AdRail. */
function BannerCreative({ ad }: { ad: PublicAd }) {
  return (
    <>
      <Image
        source={ad.imageUrl}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        transition={250}
      />
      {/* Left-to-right wash keeps the copy legible on any creative; a gentle
          bottom lift seats the CTA. */}
      <LinearGradient
        colors={["rgba(8,16,11,0.86)", "rgba(8,16,11,0.34)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.2 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "rgba(8,16,11,0.5)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute left-4 right-4 top-0 bottom-0 justify-center">
        <SponsoredChip />
        <Text
          className="text-[10.5px] font-sans-semibold mt-2"
          style={{ color: "rgba(255,255,255,0.75)" }}
          numberOfLines={1}
        >
          {ad.brandName}
        </Text>
        <Text className="text-[15.5px] font-sans-bold text-white mt-0.5" numberOfLines={2}>
          {ad.headline}
        </Text>
        <View className="flex-row mt-2">
          <View className="bg-white rounded-full px-3.5 py-1.5 flex-row items-center">
            <Text className="text-[11.5px] font-sans-bold mr-1" style={{ color: INK }}>
              {ad.ctaLabel}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={INK} />
          </View>
        </View>
      </View>
    </>
  );
}

/**
 * A horizontally scrolling row of every live campaign in one placement.
 *
 * The single-ad AdSlot picks one at random and discards the rest, so with
 * several advertisers sharing a slot each one only surfaces a fraction of the
 * time they paid for. A rail shows all of them and lets the viewer scroll.
 *
 * Renders nothing at all when no campaign is live — header included — so the
 * home screen carries no empty section by default.
 *
 * Cards are a little narrower than the screen so the next one peeks, which is
 * what tells people the row scrolls at all.
 */
export function AdRail({
  placement,
  title = "Sponsored",
}: {
  placement: AdPlacement;
  title?: string;
}) {
  const { ads, markSeen, open } = useAds(placement);

  // Held in refs: React Native throws if either identity changes between
  // renders on a mounted FlatList.
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 400,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      for (const v of viewableItems) {
        const ad = v.item as PublicAd;
        if (ad?.id) markSeen(ad.id);
      }
    },
  ).current;

  if (ads.length === 0) return null;

  const CARD_W = Math.min(Dimensions.get("window").width - 68, 360);

  return (
    <View>
      <View className="px-5 pt-6">
        <Text className="text-[16px] font-sans-bold text-ink tracking-tight">
          {title}
        </Text>
      </View>

      <FlatList
        data={ads}
        keyExtractor={(a) => a.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}
        // Snapping makes a two-ad rail feel deliberate rather than loose.
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        snapToAlignment="start"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            className="rounded-3xl overflow-hidden active:opacity-95"
            style={{ width: CARD_W, height: 134 }}
            accessibilityRole="button"
            accessibilityLabel={`Sponsored by ${item.brandName}: ${item.headline}`}
          >
            <BannerCreative ad={item} />
          </Pressable>
        )}
      />
    </View>
  );
}
