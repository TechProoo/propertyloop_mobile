import { Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  DASHBOARD_HERO,
  SAVED_SEARCHES,
  SERVICE_JOBS,
  UP_NEXT,
  type SavedSearch,
  type ServiceJob,
  type UpNextItem,
} from "@/mocks/buyer-dashboard";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const LINE = "#e1dcd3";

const TONE_BG: Record<UpNextItem["tone"], string> = {
  primary: "#e3efe7",
  accent:  "#f5ead4",
  neutral: "#ece6df",
};
const TONE_FG: Record<UpNextItem["tone"], string> = {
  primary: PRIMARY_INK,
  accent:  ACCENT_INK,
  neutral: INK_2,
};

export default function AccountScreen() {
  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — soft primary gradient feel via solid primary-soft fading */}
          <View className="bg-primary-soft px-5 pt-3 pb-5">
            <View className="flex-row items-center gap-3.5">
              <PLAvatar initials={DASHBOARD_HERO.initials} size={56} tone="primary" />
              <View className="flex-1">
                <Text
                  className="text-[11px] font-sans-bold tracking-widest uppercase"
                  style={{ color: PRIMARY_INK }}
                >
                  {DASHBOARD_HERO.greeting}
                </Text>
                <Text
                  className="font-serif mt-0.5"
                  style={{
                    fontSize: 24,
                    color: "#1a2120",
                    letterSpacing: -0.5,
                    lineHeight: 26,
                  }}
                >
                  Your{" "}
                  <Text className="font-serif-italic">search at a glance</Text>
                </Text>
              </View>
            </View>

            {/* Stat strip */}
            <View className="mt-3.5 flex-row gap-2">
              {DASHBOARD_HERO.stats.map((s) => (
                <View
                  key={s.l}
                  className="flex-1 bg-white rounded-xl border-line"
                  style={{ borderWidth: 0.5, paddingHorizontal: 8, paddingVertical: 10 }}
                >
                  <Text
                    className="font-serif text-ink"
                    style={{ fontSize: 20, letterSpacing: -0.4 }}
                  >
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
          <SectionLabel className="px-5 pt-3.5">Up next</SectionLabel>
          <View className="px-4 pt-2.5 gap-2">
            {UP_NEXT.map((u) => (
              <UpNextRow key={u.id} item={u} />
            ))}
          </View>

          {/* Saved searches */}
          <View className="px-5 pt-3.5 flex-row items-baseline justify-between">
            <SectionLabel className="">Saved searches</SectionLabel>
            <Text className="text-xs font-sans-bold text-primary">Manage</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, gap: 10 }}
          >
            {SAVED_SEARCHES.map((s) => (
              <SavedSearchCard key={s.id} item={s} />
            ))}
          </ScrollView>

          {/* Service Loop · open jobs */}
          <SectionLabel className="px-5 pt-3.5">Service Loop · open jobs</SectionLabel>
          <View className="px-4 pt-2.5 gap-2">
            {SERVICE_JOBS.map((j) => (
              <ServiceJobRow key={j.id} job={j} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Subcomponents ───────────────────────────────────────────

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

function UpNextRow({ item }: { item: UpNextItem }) {
  return (
    <Pressable
      onPress={() => router.push(item.href as Href)}
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
        <Text
          className="text-[13.5px] font-sans-bold text-ink mt-0.5"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">{item.detail}</Text>
      </View>
      <Text className="text-[12.5px] font-sans-bold text-primary">{item.cta}</Text>
    </Pressable>
  );
}

function SavedSearchCard({ item }: { item: SavedSearch }) {
  return (
    <Pressable
      className="bg-white rounded-2xl px-3.5 py-3 border-line active:opacity-90"
      style={{ width: 200, borderWidth: 0.5 }}
    >
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[13px] font-sans-bold text-ink">{item.title}</Text>
        {item.newCount ? (
          <View className="bg-primary px-1.5 py-0.5 rounded-full">
            <Text className="text-[9.5px] font-sans-bold text-white tracking-widest uppercase">
              +{item.newCount} new
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="text-[11.5px] text-ink-3 mt-0.5">{item.detail}</Text>
      <View className="mt-2 flex-row items-baseline gap-1">
        <Text className="font-serif text-ink" style={{ fontSize: 18, letterSpacing: -0.3 }}>
          {item.homes}
        </Text>
        <Text className="text-[10px] font-sans-semibold text-ink-3 tracking-widest uppercase">
          homes
        </Text>
      </View>
    </Pressable>
  );
}

function ServiceJobRow({ job }: { job: ServiceJob }) {
  const dot = job.status === "escrow" ? PRIMARY : "#b9842c";
  const initials = job.vendor
    .split(" ")
    .filter((w) => w[0]?.match(/[A-Z]/))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <View
      className="bg-white rounded-2xl px-3 py-3 flex-row items-center gap-3 border-line"
      style={{ borderWidth: 0.5 }}
    >
      <PLAvatar initials={initials || "SV"} size={36} tone="primary" />
      <View className="flex-1">
        <Text
          className="text-[13.5px] font-sans-bold text-ink"
          numberOfLines={1}
        >
          {job.vendor}
        </Text>
        <Text className="text-[11.5px] text-ink-3">
          {job.category} · {job.detail}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: dot }} />
          <Text className="text-[10px] font-sans-bold text-ink-2 tracking-widest uppercase">
            {job.statusLabel}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="font-serif text-ink" style={{ fontSize: 15, letterSpacing: -0.3 }}>
          {job.amount}
        </Text>
        {job.status === "confirm" && (
          <Pressable className="mt-1 bg-primary rounded-full px-2.5 py-1">
            <Text className="text-[10.5px] font-sans-bold text-white tracking-wider">
              Release
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Quiet the unused-import warning when the file's tone constants are
// not directly referenced anywhere yet. Kept for editor jump-to-def.
void LINE;
