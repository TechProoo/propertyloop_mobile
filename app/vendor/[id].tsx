import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  VENDOR,
  VENDOR_REVIEWS,
  VENDOR_SERVICES,
  VENDOR_WORK_GALLERY,
} from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function PublicVendorProfileScreen() {
  useLocalSearchParams<{ id?: string }>();
  const services = VENDOR_SERVICES.filter((s) => !s.archived);
  const firstReview = VENDOR_REVIEWS[0];

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover */}
        <View style={{ height: 170, backgroundColor: "#f0f0f0" }} className="relative">
          <Image
            source="https://picsum.photos/seed/clean-cover/1200/600"
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <SafeAreaView
            edges={["top"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            pointerEvents="box-none"
          >
            <View className="flex-row items-center justify-between px-4 pt-2">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <Ionicons name="chevron-back" size={18} color="#ffffff" />
              </Pressable>
              <Pressable
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <Ionicons name="heart-outline" size={17} color="#ffffff" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Header card */}
        <View className="px-5" style={{ marginTop: -34 }}>
          <View
            className="self-start rounded-full overflow-hidden"
            style={{ borderWidth: 4, borderColor: "#ffffff", backgroundColor: "#ffffff" }}
          >
            <PLAvatar initials={VENDOR.initials} size={72} tone="primary" />
          </View>

          <View className="flex-row items-center gap-1.5 mt-2.5">
            <Text className="text-[21px] font-sans-bold text-ink">{VENDOR.name}</Text>
            {VENDOR.verified && (
              <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
            )}
            {VENDOR.topRated && (
              <View
                className="ml-auto px-2 py-1 rounded-full"
                style={{ backgroundColor: "#f5ead4" }}
              >
                <Text
                  className="text-[10px] font-sans-bold tracking-widest uppercase"
                  style={{ color: ACCENT_INK }}
                >
                  Top rated
                </Text>
              </View>
            )}
          </View>
          <Text className="text-[13px] font-sans-semibold text-ink-2 mt-1">
            {VENDOR.category} crew · {VENDOR.tagline}
          </Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Ionicons name="location-outline" size={13} color={INK_3} />
            <Text className="text-[12.5px] text-ink-3">
              {VENDOR.area} · responds in {VENDOR.responseTime}
            </Text>
          </View>

          {/* Stat strip */}
          <View
            className="mt-4 rounded-2xl overflow-hidden border-line flex-row"
            style={{ borderWidth: 0.5, backgroundColor: "#ffffff" }}
          >
            {[
              { n: `${VENDOR.rating}`, l: "Rating", star: true },
              { n: `${VENDOR.reviews}`, l: "Jobs" },
              { n: `${VENDOR.yearsExperience} yr`, l: "Exp." },
              { n: VENDOR.completionRate, l: "Done" },
            ].map((s, i) => (
              <View
                key={s.l}
                className="flex-1 items-center py-3"
                style={{
                  borderLeftWidth: i > 0 ? 0.5 : 0,
                  borderLeftColor: "#ece6df",
                }}
              >
                <View className="flex-row items-center gap-1">
                  {s.star && <Ionicons name="star" size={11} color={ACCENT} />}
                  <Text className="font-serif text-ink" style={{ fontSize: 17 }}>
                    {s.n}
                  </Text>
                </View>
                <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
                  {s.l}
                </Text>
              </View>
            ))}
          </View>

          {/* Bio */}
          <Text className="text-[13.5px] text-ink-2 mt-4 leading-5">
            <Text className="font-serif-italic">"</Text>
            {VENDOR.bio}
            <Text className="font-serif-italic">"</Text>
          </Text>

          {/* Services */}
          <Text className="text-[16px] font-sans-bold text-ink mt-5 mb-2">Services</Text>
          <View className="gap-2">
            {services.map((s) => (
              <View
                key={s.id}
                className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line"
                style={{ borderWidth: 0.5 }}
              >
                <View className="flex-1">
                  <Text className="text-[13.5px] font-sans-bold text-ink">{s.name}</Text>
                  <Text className="text-[11px] text-ink-3 mt-0.5">{s.duration}</Text>
                </View>
                <Text className="font-serif text-ink" style={{ fontSize: 16, letterSpacing: -0.3 }}>
                  {s.price}
                </Text>
              </View>
            ))}
          </View>

          {/* Recent work */}
          <Text className="text-[16px] font-sans-bold text-ink mt-5 mb-2">Recent work</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {VENDOR_WORK_GALLERY.map((seed) => (
            <Image
              key={seed}
              source={`https://picsum.photos/seed/${seed}/400/400`}
              style={{ width: 130, height: 130, borderRadius: 14 }}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        {/* Reviews preview */}
        <View className="px-5 mt-5">
          <Text className="text-[16px] font-sans-bold text-ink mb-2">
            Reviews · {VENDOR.reviews}
          </Text>
          <View
            className="bg-white rounded-2xl p-3.5 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <View className="flex-row items-center gap-2">
              <PLAvatar
                initials={firstReview.customer.initials}
                size={30}
                tone={firstReview.customer.tone}
              />
              <Text className="flex-1 text-[13px] font-sans-bold text-ink">
                {firstReview.customer.name}
              </Text>
              <View className="flex-row gap-0.5">
                {Array.from({ length: firstReview.rating }).map((_, i) => (
                  <Ionicons key={i} name="star" size={11} color={ACCENT} />
                ))}
              </View>
            </View>
            <Text
              className="font-serif-italic text-ink-2 mt-2"
              style={{ fontSize: 13.5, lineHeight: 20 }}
            >
              "{firstReview.body}"
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky hire */}
      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        pointerEvents="box-none"
      >
        <View
          className="bg-cream border-line flex-row items-center gap-3 px-4"
          style={{ borderTopWidth: 0.5, paddingTop: 14, paddingBottom: 14 }}
        >
          <View className="flex-1">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
              From
            </Text>
            <Text className="font-serif text-ink" style={{ fontSize: 20, letterSpacing: -0.4 }}>
              {services[0]?.price ?? "₦18,000"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/book-service" as Href)}
            className="bg-primary rounded-full px-6 py-3.5 active:opacity-80"
          >
            <Text className="text-white font-sans-bold text-[14px]">
              Hire {VENDOR.name}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

void INK_2;
