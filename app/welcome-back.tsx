import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";

// ─── "Since X" update rows ────────────────────────────────────
type UpdateTone = "primary" | "accent" | "neutral";
type UpdateRow = {
  icon: keyof typeof Ionicons.glyphMap;
  tone: UpdateTone;
  title: string;
  detail: string;
  cta: string;
  href: string;
};

const TONE_BG: Record<UpdateTone, string> = {
  primary: "#e3efe7",
  accent: "#f5ead4",
  neutral: "#f0f0f0",
};
const TONE_FG: Record<UpdateTone, string> = {
  primary: PRIMARY_INK,
  accent: ACCENT_INK,
  neutral: INK_2,
};

const UPDATES: UpdateRow[] = [
  {
    icon: "notifications-outline",
    tone: "primary",
    title: "3 new matches in Lekki",
    detail: "₦2.4M – ₦5.6M · all verified",
    cta: "View",
    href: "/(tabs)",
  },
  {
    icon: "trending-down-outline",
    tone: "accent",
    title: "Price dropped on 1 saved home",
    detail: "The Loom House · ₦12M → ₦10.8M",
    cta: "Open",
    href: "/(tabs)/saved",
  },
  {
    icon: "chatbubble-outline",
    tone: "primary",
    title: "Chinwe replied to your message",
    detail: "Sandbridge Court · 2 hrs ago",
    cta: "Open",
    href: "/conversation/chinwe",
  },
  {
    icon: "calendar-outline",
    tone: "neutral",
    title: "Viewing tomorrow, 10:00 AM",
    detail: "Sandbridge Court, Lekki Phase 1",
    cta: "Details",
    href: "/book-viewing",
  },
];

// ─── Pick-up cards ─────────────────────────────────────────────
const PICKUP_CARDS = [
  { id: "pu-1", price: "₦4.8M", title: "Sandbridge Court", area: "Lekki Phase 1", tag: "You viewed", imageSeed: "feat-1" },
  { id: "pu-2", price: "₦2.4M", title: "Marlin Studios",   area: "V.I.",          tag: "Saved",      imageSeed: "feat-3" },
];

// Curated, on-brand property photos (Unsplash). Picked deterministically per
// seed so a given card always shows the same home.
const PROPERTY_PHOTOS = [
  "1564013799919-ab600027ffc6",
  "1568605114967-8130f3a36994",
  "1600596542815-ffad4c1539a9",
  "1600585154340-be6161a56a0c",
  "1583608205776-bfd35f0d9f83",
];

function picsum(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const id = PROPERTY_PHOTOS[Math.abs(h) % PROPERTY_PHOTOS.length];
  return `https://images.unsplash.com/photo-${id}?w=400&h=250&fit=crop&auto=format&q=70`;
}

export default function WelcomeBackScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting hero */}
        <View className="mx-4">
          <LinearGradient
            colors={["#e3efe7", "#fbf8f5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              borderRadius: 22,
              paddingVertical: 20,
              paddingHorizontal: 18,
              overflow: "hidden",
            }}
          >
            <Text
              className="text-[11px] font-sans-bold tracking-widest uppercase"
              style={{ color: PRIMARY_INK, letterSpacing: 1.3 }}
            >
              Signed in
            </Text>
            <Text
              className="font-serif text-ink mt-1.5"
              style={{ fontSize: 30, lineHeight: 32, letterSpacing: -0.6 }}
            >
              Welcome back, <Text className="font-serif-italic">Adebayo</Text>.
            </Text>
            <Text className="text-[13.5px] text-ink-2 mt-1 leading-5">
              3 new homes match your Lekki search since you last looked.
            </Text>
          </LinearGradient>
        </View>

        {/* Updates */}
        <Text className="px-5 pt-5 text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase">
          Since 2 days ago
        </Text>
        <View className="px-4 pt-2.5 gap-2">
          {UPDATES.map((u, i) => (
            <UpdateRowView key={i} update={u} />
          ))}
        </View>

        {/* Pick up where you left off */}
        <Text className="px-5 pt-4 text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase">
          Pick up where you left off
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}
        >
          {PICKUP_CARDS.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/property/${c.id}` as Href)}
              className="bg-white rounded-2xl overflow-hidden active:opacity-90"
              style={{
                width: 220,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
              }}
            >
              <View style={{ height: 110 }} className="relative">
                <Image
                  source={picsum(c.imageSeed)}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                <View
                  className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full"
                >
                  <Text className="text-[10px] font-sans-bold text-ink tracking-widest uppercase">
                    {c.tag}
                  </Text>
                </View>
              </View>
              <View className="px-3 py-3">
                <View className="flex-row items-baseline gap-1">
                  <Text
                    className="font-serif text-ink"
                    style={{ fontSize: 17, letterSpacing: -0.3 }}
                  >
                    {c.price}
                  </Text>
                  <Text className="text-[11px] font-sans-semibold text-ink-3">
                    /yr
                  </Text>
                </View>
                <Text
                  className="text-[13px] font-sans-semibold text-ink mt-0.5"
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
                <Text className="text-[11px] text-ink-3 mt-0.5">{c.area}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 border-line"
        style={{
          backgroundColor: "rgba(245,240,235,0.96)",
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 30,
        }}
      >
        <Pressable
          onPress={() => router.replace("/(tabs)" as Href)}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 17 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Continue to home
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function UpdateRowView({ update }: { update: UpdateRow }) {
  return (
    <Pressable
      onPress={() => router.push(update.href as Href)}
      className="flex-row items-center gap-3 px-3.5 py-3 bg-white rounded-2xl border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View
        className="w-9 h-9 rounded-[10px] items-center justify-center"
        style={{ backgroundColor: TONE_BG[update.tone] }}
      >
        <Ionicons name={update.icon} size={18} color={TONE_FG[update.tone]} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[13.5px] font-sans-bold text-ink"
          numberOfLines={1}
        >
          {update.title}
        </Text>
        <Text className="text-xs text-ink-3 mt-0.5" numberOfLines={1}>
          {update.detail}
        </Text>
      </View>
      <Text className="text-[12.5px] font-sans-bold text-primary">
        {update.cta}
      </Text>
    </Pressable>
  );
}

