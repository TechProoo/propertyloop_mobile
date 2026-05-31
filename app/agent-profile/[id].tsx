import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { AGENT, AGENT_LISTINGS } from "@/mocks/agent";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const REVIEWS = [
  { id: "r-1", buyer: "Adebayo O.", initials: "AO", tone: "primary" as const, rating: 5, when: "Apr 2026", body: "Patient, prompt, and refused to over-promise on the title search timeline. Closed our 3-bed in 6 weeks." },
  { id: "r-2", buyer: "Bilkisu I.",  initials: "BI", tone: "accent"  as const, rating: 5, when: "Feb 2026", body: "Knew every block in Lekki — found us a quiet street with great schools. Would recommend." },
  { id: "r-3", buyer: "Tope B.",     initials: "TB", tone: "neutral" as const, rating: 4, when: "Dec 2025", body: "Solid agent. Took a bit longer to respond on weekends but always followed up." },
];

export default function PublicAgentProfileScreen() {
  useLocalSearchParams<{ id?: string }>();
  const liveListings = AGENT_LISTINGS.filter((l) => l.status === "live" || l.status === "under_offer").slice(0, 4);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Agent profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="bg-primary-soft px-5 pt-3 pb-5">
          <View className="flex-row items-center gap-3">
            <PLAvatar initials={AGENT.initials} size={72} tone="primary" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[18px] font-sans-bold text-ink">
                  {AGENT.name}
                </Text>
                {AGENT.verified && (
                  <Ionicons name="shield-checkmark" size={15} color={PRIMARY} />
                )}
              </View>
              <Text className="text-[12.5px] mt-0.5" style={{ color: PRIMARY_INK }}>
                {AGENT.agency}
              </Text>
              <View className="flex-row items-center gap-2 mt-1">
                <Ionicons name="star" size={12} color={ACCENT} />
                <Text className="text-[12px] font-sans-bold text-ink">
                  {AGENT.rating}
                </Text>
                <Text className="text-[12px] text-ink-3">· {AGENT.reviews} reviews</Text>
              </View>
            </View>
          </View>

          {/* Stat strip */}
          <View className="flex-row gap-2 mt-4">
            <Stat n={`${AGENT.yearsExperience}y`}        l="Experience" />
            <Stat n={`${AGENT.closingsThisYear}`}        l="Closed '26" tone="primary" />
            <Stat n={AGENT.languages.split(",").length.toString()} l="Languages" />
            <Stat n={`'${String(AGENT.joinedYear).slice(2)}`} l="On PL since" />
          </View>
        </View>

        {/* Bio */}
        <View className="px-5 pt-5">
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2">
            About
          </Text>
          <Text className="text-[13.5px] text-ink-2 leading-5">
            {AGENT.bio}
          </Text>

          {/* Specialties */}
          <View className="flex-row gap-2 flex-wrap mt-4">
            {AGENT.specialties.map((s) => (
              <View
                key={s}
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Text className="text-[11.5px] font-sans-bold" style={{ color: PRIMARY_INK }}>
                  {s}
                </Text>
              </View>
            ))}
            <View className="px-3 py-1.5 rounded-full bg-cream-2">
              <Text className="text-[11.5px] font-sans-bold text-ink-2">
                Speaks {AGENT.languages}
              </Text>
            </View>
          </View>

          {/* Active listings */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
            {liveListings.length} active listings
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {liveListings.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => router.push(`/property/${l.id}` as Href)}
              className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
              style={{ width: 200, borderWidth: 0.5 }}
            >
              <Image
                source={`https://picsum.photos/seed/${l.imageSeed}/400/300`}
                style={{ width: "100%", height: 110 }}
                contentFit="cover"
              />
              <View className="px-3 py-2.5">
                <Text className="font-serif text-ink" style={{ fontSize: 16, letterSpacing: -0.3 }}>
                  {l.price}
                </Text>
                <Text className="text-[12px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
                  {l.title}
                </Text>
                <Text className="text-[11px] text-ink-3 mt-0.5">{l.area}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Reviews */}
        <View className="px-5 mt-6">
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2">
            Recent reviews
          </Text>
          <View className="gap-2.5">
            {REVIEWS.map((r) => (
              <View
                key={r.id}
                className="bg-white rounded-2xl p-3.5 border-line"
                style={{ borderWidth: 0.5 }}
              >
                <View className="flex-row items-center gap-2.5">
                  <PLAvatar initials={r.initials} size={32} tone={r.tone} />
                  <View className="flex-1">
                    <Text className="text-[13px] font-sans-bold text-ink">
                      {r.buyer}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < r.rating ? "star" : "star-outline"}
                          size={11}
                          color={ACCENT}
                        />
                      ))}
                      <Text className="text-[11px] text-ink-3 ml-1">· {r.when}</Text>
                    </View>
                  </View>
                </View>
                <Text className="text-[12.5px] text-ink-2 mt-2 leading-5">
                  {r.body}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line flex-row gap-2"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 28,
        }}
      >
        <Pressable
          onPress={() => router.push("/conversation/chinwe" as Href)}
          className="flex-1 bg-white rounded-full items-center active:opacity-80 border-line"
          style={{ paddingVertical: 16, borderWidth: 1 }}
        >
          <Text className="font-sans-bold text-[14px] text-ink">Message</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/book-viewing" as Href)}
          className="flex-1 bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[14px]">
            Request viewing
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ n, l, tone }: { n: string; l: string; tone?: "primary" }) {
  return (
    <View
      className="flex-1 rounded-xl border-line px-2 py-2.5"
      style={{
        borderWidth: 0.5,
        backgroundColor: tone === "primary" ? "#ffffff" : "rgba(255,255,255,0.6)",
      }}
    >
      <Text
        className="font-serif text-ink"
        style={{ fontSize: 18, letterSpacing: -0.3 }}
      >
        {n}
      </Text>
      <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
        {l}
      </Text>
    </View>
  );
}
