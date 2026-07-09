// Sponsored-content slots for the mobile app.
//
// <AdSlot placement="HOME_BANNER" /> — inline banner/card. Renders nothing at
// all when no campaign is live, so screens carry zero layout cost by default.
// Impression counts once when the ad first renders; a tap records the click
// and opens the brand's landing page in the browser.
//
// <SplashAd /> — full-screen interstitial for the SPLASH placement, shown at
// most once per app session (module-level latch survives remounts).
import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import adsService, { type AdPlacement, type PublicAd } from "@/api/services/ads";

const INK = "#1a2120";
const INK_3 = "#7f857f";

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
        className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
        style={[{ borderWidth: 0.5 }, style]}
        accessibilityRole="button"
        accessibilityLabel={`Sponsored: ${ad.headline}`}
      >
        <View className="relative" style={{ height: 110 }}>
          <Image source={ad.imageUrl} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          <View
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(26,33,32,0.65)" }}
          >
            <Text className="text-[9px] font-sans-bold text-white tracking-widest uppercase">
              Sponsored
            </Text>
          </View>
        </View>
        <View className="px-3 py-2.5">
          <Text className="text-[10.5px] font-sans-semibold" style={{ color: INK_3 }} numberOfLines={1}>
            {ad.brandName}
          </Text>
          <Text className="text-[12.5px] font-sans-bold mt-0.5" style={{ color: INK }} numberOfLines={2}>
            {ad.headline}
          </Text>
          <View className="flex-row items-center gap-1 mt-1.5">
            <Text className="text-[11.5px] font-sans-bold text-primary">{ad.ctaLabel}</Text>
            <Ionicons name="open-outline" size={11} color="#1f6f43" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={open}
      className="rounded-2xl overflow-hidden active:opacity-90"
      style={[{ height: 120 }, style]}
      accessibilityRole="button"
      accessibilityLabel={`Sponsored: ${ad.headline}`}
    >
      <Image source={ad.imageUrl} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      {/* Left-anchored scrim so the copy reads on any creative */}
      <View
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(10,20,14,0.45)" }}
      />
      <View className="absolute left-4 right-4 top-0 bottom-0 justify-center">
        <Text className="text-[9px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.75)" }}>
          Sponsored · {ad.brandName}
        </Text>
        <Text className="text-[15px] font-sans-bold text-white mt-1" numberOfLines={2}>
          {ad.headline}
        </Text>
        <View className="flex-row mt-2">
          <View className="bg-white rounded-full px-3.5 py-1.5 flex-row items-center gap-1">
            <Text className="text-[11.5px] font-sans-bold" style={{ color: INK }}>
              {ad.ctaLabel}
            </Text>
            <Ionicons name="open-outline" size={11} color={INK} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// Shown at most once per cold start, and only when a SPLASH campaign is live.
let splashShownThisSession = false;

export function SplashAd() {
  const insets = useSafeAreaInsets();
  // Latch once per cold start: after it has shown, later mounts fetch nothing.
  const armed = useRef(!splashShownThisSession);
  const { ad, open, markSeen } = useAd("SPLASH", armed.current);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ad && armed.current && !splashShownThisSession) {
      splashShownThisSession = true;
      setVisible(true);
      markSeen(); // the interstitial is now actually on screen
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  if (!armed.current || !ad) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
      <View className="flex-1" style={{ backgroundColor: "rgba(10,14,11,0.96)" }}>
        <Pressable
          onPress={() => setVisible(false)}
          className="absolute z-10 w-9 h-9 rounded-full items-center justify-center"
          style={{ top: insets.top + 10, right: 16, backgroundColor: "rgba(255,255,255,0.15)" }}
          hitSlop={8}
          accessibilityLabel="Close ad"
        >
          <Ionicons name="close" size={18} color="#ffffff" />
        </Pressable>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[10px] font-sans-bold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            Sponsored · {ad.brandName}
          </Text>
          <Pressable
            onPress={() => {
              setVisible(false);
              open();
            }}
            className="w-full rounded-3xl overflow-hidden active:opacity-90"
          >
            <Image
              source={ad.imageUrl}
              style={{ width: "100%", aspectRatio: 4 / 5 }}
              contentFit="cover"
            />
          </Pressable>
          <Text className="text-[17px] font-sans-bold text-white mt-4 text-center">{ad.headline}</Text>
          {!!ad.body && (
            <Text className="text-[12.5px] mt-1.5 text-center leading-5" style={{ color: "rgba(255,255,255,0.7)" }}>
              {ad.body}
            </Text>
          )}
          <Pressable
            onPress={() => {
              setVisible(false);
              open();
            }}
            className="bg-white rounded-full px-8 mt-5 active:opacity-85"
            style={{ paddingVertical: 14 }}
          >
            <Text className="text-[14px] font-sans-bold" style={{ color: INK }}>
              {ad.ctaLabel}
            </Text>
          </Pressable>
          <Pressable onPress={() => setVisible(false)} className="mt-3 py-2 px-4 active:opacity-70" hitSlop={6}>
            <Text className="text-[12px] font-sans-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
              Continue to PropertyLoop
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
