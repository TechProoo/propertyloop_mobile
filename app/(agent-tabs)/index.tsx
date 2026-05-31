import { Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  AGENT,
  AGENT_HERO,
  AGENT_UP_NEXT,
  AGENT_LISTINGS,
  STATUS_META,
  type DashboardAction,
  type AgentListing,
} from "@/mocks/agent";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TONE_BG: Record<DashboardAction["tone"], string> = {
  primary: "#e3efe7",
  accent:  "#f5ead4",
  neutral: "#ece6df",
};
const TONE_FG: Record<DashboardAction["tone"], string> = {
  primary: PRIMARY_INK,
  accent:  ACCENT_INK,
  neutral: INK_2,
};

export default function AgentHomeScreen() {
  const liveCount = AGENT_LISTINGS.filter((l) => l.status === "live" || l.status === "under_offer").length;
  const featured = AGENT_LISTINGS.filter((l) => l.featured).slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="bg-primary-soft px-5 pt-3 pb-5">
          <View className="flex-row items-center gap-3.5">
            <PLAvatar initials={AGENT.initials} size={56} tone="primary" />
            <View className="flex-1">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase"
                style={{ color: PRIMARY_INK }}
              >
                {AGENT_HERO.todayLabel}
              </Text>
              <Text
                className="font-serif mt-0.5"
                style={{ fontSize: 22, color: "#1a2120", letterSpacing: -0.5, lineHeight: 26 }}
              >
                <Text className="font-serif-italic">{AGENT_HERO.greeting.split(",")[0]}</Text>
                ,{AGENT_HERO.greeting.split(",")[1]}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/notifications" as Href)}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
              hitSlop={6}
            >
              <Ionicons name="notifications-outline" size={18} color={PRIMARY_INK} />
            </Pressable>
          </View>

          {/* Stat strip */}
          <View className="mt-4 flex-row gap-2">
            {AGENT_HERO.stats.map((s) => (
              <View
                key={s.l}
                className="flex-1 bg-white rounded-xl border-line"
                style={{ borderWidth: 0.5, paddingHorizontal: 8, paddingVertical: 10 }}
              >
                <Text className="font-serif text-ink" style={{ fontSize: 20, letterSpacing: -0.4 }}>
                  {s.n}
                </Text>
                <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
                  {s.l}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Up next */}
        <SectionLabel className="px-5 pt-4">Up next</SectionLabel>
        <View className="px-4 pt-2.5 gap-2">
          {AGENT_UP_NEXT.map((u) => (
            <UpNextRow key={u.id} item={u} />
          ))}
        </View>

        {/* Quick actions */}
        <SectionLabel className="px-5 pt-5">Quick actions</SectionLabel>
        <View className="px-4 pt-2.5 flex-row gap-2">
          <QuickAction
            icon="add-circle-outline"
            label="New listing"
            onPress={() => router.push("/create-listing" as Href)}
          />
          <QuickAction
            icon="people-outline"
            label="Leads"
            onPress={() => router.push("/(agent-tabs)/leads" as Href)}
          />
          <QuickAction
            icon="analytics-outline"
            label="Analytics"
            onPress={() => router.push("/(agent-tabs)/listings" as Href)}
          />
        </View>

        {/* Featured listings */}
        <View className="px-5 pt-5 flex-row items-baseline justify-between">
          <SectionLabel className="">Your featured · {featured.length}</SectionLabel>
          <Pressable onPress={() => router.push("/(agent-tabs)/listings" as Href)} hitSlop={6}>
            <Text className="text-xs font-sans-bold text-primary">
              See all {liveCount}
            </Text>
          </Pressable>
        </View>
        <View className="px-4 pt-2 gap-2">
          {featured.map((l) => (
            <ListingRow key={l.id} listing={l} />
          ))}
        </View>

        {/* Plan strip */}
        <View
          className="mx-4 mt-5 bg-ink rounded-2xl px-3.5 py-3.5 flex-row items-center gap-3"
        >
          <View
            className="w-9 h-9 rounded-[10px] items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
          >
            <Ionicons name="star" size={18} color="#f5cf6f" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-sans-bold text-white">
              Founding member · free forever
            </Text>
            <Text
              className="text-[11px] mt-0.5 leading-4"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Unlimited listings, featured placement, priority support.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#ffffff" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}

function UpNextRow({ item }: { item: DashboardAction }) {
  return (
    <Pressable
      onPress={() => item.href && router.push(item.href as Href)}
      className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View
        className="w-[38px] h-[38px] rounded-[10px] items-center justify-center"
        style={{ backgroundColor: TONE_BG[item.tone] }}
      >
        <Ionicons name={item.icon} size={18} color={TONE_FG[item.tone]} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[10px] font-sans-bold tracking-widest uppercase"
          style={{ color: TONE_FG[item.tone] }}
        >
          {item.tag}
        </Text>
        <Text className="text-[13.5px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5" numberOfLines={1}>
          {item.detail}
        </Text>
      </View>
      <Text className="text-[12.5px] font-sans-bold text-primary">{item.cta}</Text>
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-2xl items-center justify-center gap-1.5 py-4 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <Ionicons name={icon} size={22} color={PRIMARY} />
      <Text className="text-[12px] font-sans-bold text-ink">{label}</Text>
    </Pressable>
  );
}

function ListingRow({ listing }: { listing: AgentListing }) {
  const meta = STATUS_META[listing.status];
  const toneBg =
    meta.tone === "primary" ? "#e3efe7"
    : meta.tone === "accent" ? "#f5ead4"
    : meta.tone === "ink"    ? "#1a2120"
    : "#ece6df";
  const toneFg =
    meta.tone === "primary" ? PRIMARY_INK
    : meta.tone === "accent" ? ACCENT_INK
    : meta.tone === "ink"    ? "#ffffff"
    : INK_2;

  return (
    <Pressable
      onPress={() => router.push(`/agent-listing/${listing.id}` as Href)}
      className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View
        style={{
          width: 56, height: 56, borderRadius: 10,
          backgroundColor: "#ece6df",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Ionicons name="image-outline" size={20} color={INK_3} />
      </View>
      <View className="flex-1">
        <Text className="text-[13.5px] font-sans-bold text-ink" numberOfLines={1}>
          {listing.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3">{listing.area}</Text>
        <View className="flex-row items-center gap-2 mt-1">
          <View className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: toneBg }}>
            <Text
              className="text-[9.5px] font-sans-bold tracking-widest uppercase"
              style={{ color: toneFg }}
            >
              {meta.label}
            </Text>
          </View>
          <Text className="text-[11px] font-sans-semibold text-ink-3">
            {listing.views} views · {listing.inquiries} leads
          </Text>
        </View>
      </View>
      <Text
        className="font-serif text-ink"
        style={{ fontSize: 15, letterSpacing: -0.3 }}
      >
        {listing.price}
      </Text>
    </Pressable>
  );
}
