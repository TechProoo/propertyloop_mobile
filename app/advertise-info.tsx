import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import adsService, { type AdPricing } from "@/api/services/ads";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const ACCENT_BG = "#f5ead4";
const ACCENT_FG = "#6b4a16";

const WEBSITE_URL = "https://propertyloop.ng/advertise";

const PLACEMENTS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}[] = [
  {
    icon: "phone-portrait-outline",
    title: "App open",
    detail: "A full-screen spot the moment the app opens — maximum visibility.",
  },
  {
    icon: "megaphone-outline",
    title: "Home banner",
    detail: "A wide banner at the top of the home screen, seen by every user.",
  },
  {
    icon: "search-outline",
    title: "Search results",
    detail: "A native card inside property search results.",
  },
  {
    icon: "albums-outline",
    title: "In-feed card",
    detail: "A sponsored card between listings as people browse.",
  },
];

export default function AdvertiseInfoScreen() {
  const insets = useSafeAreaInsets();
  // App Store 3.1.1 — on iOS this screen must stay silent about paying
  // elsewhere: no pricing, no "book on the website" copy, no external link.
  const showBooking = Platform.OS !== "ios";
  const [pricing, setPricing] = useState<AdPricing | null>(null);

  useEffect(() => {
    adsService.pricing().then(setPricing).catch(() => {});
  }, []);

  const openAdvertise = () => {
    void WebBrowser.openBrowserAsync(WEBSITE_URL, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="close" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[14px] font-sans-bold text-ink">Advertise with us</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Emblem */}
        <View className="items-center mt-3">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <Ionicons name="megaphone" size={30} color="#ffffff" />
          </View>
          <Text
            className="font-serif text-ink text-center mt-4"
            style={{ fontSize: 26, letterSpacing: -0.5, lineHeight: 30 }}
          >
            Put your brand in front of{" "}
            <Text className="font-serif-italic">home movers</Text>
          </Text>
          <Text className="text-[13.5px] text-ink-2 text-center mt-2 leading-5">
            Buyers, renters, agents and homeowners use PropertyLoop every day.
            Reach them with a sponsored placement across the app and website.
          </Text>
        </View>

        {/* Placements */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-7 mb-2">
          Where your brand shows
        </Text>
        <View className="gap-2">
          {PLACEMENTS.map((p) => (
            <View
              key={p.title}
              className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line"
              style={{ borderWidth: 0.5 }}
            >
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Ionicons name={p.icon} size={17} color={PRIMARY} />
              </View>
              <View className="flex-1">
                <Text className="text-[13.5px] font-sans-bold text-ink">{p.title}</Text>
                <Text className="text-[11.5px] text-ink-3 mt-0.5 leading-4">{p.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {showBooking && (
          <>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-7 mb-2">
              Simple campaign pricing
            </Text>
            <View className="bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
              {PLACEMENTS.slice(0, 3).map((p, index) => {
                const key = ["SPLASH", "HOME_BANNER", "SEARCH_INLINE"][index] as keyof AdPricing["weeklyRates"];
                const rate = pricing?.weeklyRates[key];
                return (
                  <View key={p.title} className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: index === 2 ? 0 : 0.5, borderBottomColor: "#ece6df" }}>
                    <View>
                      <Text className="text-[13px] font-sans-bold text-ink">{p.title}</Text>
                      <Text className="text-[11px] text-ink-3 mt-0.5">One-week placement</Text>
                    </View>
                    <Text className="text-[13px] font-sans-bold text-primary">
                      {rate ? `From ₦${rate.toLocaleString("en-NG")}` : "See rate"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View className="mt-5 rounded-2xl p-4" style={{ backgroundColor: "#e3efe7" }}>
          <Text className="text-[13px] font-sans-bold" style={{ color: PRIMARY_INK }}>Built for high-intent home movers</Text>
          <Text className="text-[12px] leading-5 mt-1" style={{ color: PRIMARY_INK }}>
            Put your brand in front of buyers, renters, agents, and property owners while they actively browse and make decisions.
          </Text>
        </View>

        {/* How it works — on iOS the steps stay generic (no pricing/payment talk) */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-7 mb-2">
          How it works
        </Text>
        <View className="bg-white rounded-2xl px-4 py-3.5 border-line gap-3" style={{ borderWidth: 0.5 }}>
          {(showBooking
            ? [
                "Pick a placement and how long it runs — simple flat weekly pricing.",
                "Upload your creative and pay securely online.",
                "Our team reviews it, and it goes live to thousands of users.",
              ]
            : [
                "Pick a placement and how long your campaign runs.",
                "Upload your creative and submit your campaign.",
                "Our team reviews it, and it goes live to thousands of users.",
              ]
          ).map((t, i) => (
            <View key={i} className="flex-row gap-2.5">
              <View
                className="w-5 h-5 rounded-full items-center justify-center mt-0.5"
                style={{ backgroundColor: PRIMARY }}
              >
                <Text className="text-[10px] font-sans-bold text-white">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-[12.5px] text-ink-2 leading-5">{t}</Text>
            </View>
          ))}
        </View>

        {/* Website note */}
        {showBooking && (
          <View
            className="mt-6 rounded-2xl px-4 py-3.5 flex-row gap-2.5 items-start"
            style={{ backgroundColor: ACCENT_BG }}
          >
            <Ionicons name="globe-outline" size={17} color={ACCENT_FG} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[12px] leading-5" style={{ color: ACCENT_FG }}>
              Booking and payment for adverts are handled on our website. Visit{" "}
              <Text className="font-sans-bold">propertyloop.ng/advertise</Text> to see full
              details, pricing, and to book a campaign.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      {showBooking && (
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
            onPress={openAdvertise}
            className="bg-primary rounded-full items-center justify-center flex-row gap-2 active:opacity-80"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              View advertising packages
            </Text>
            <Ionicons name="open-outline" size={16} color="#ffffff" />
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-2">
            Opens securely inside PropertyLoop
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
