import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { VENDOR_JOBS, type VendorJob } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS = [
  { id: "upcoming",  label: "Upcoming" },
  { id: "active",    label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function VendorJobsScreen() {
  const [tab, setTab] = useState<TabId>("upcoming");

  const filtered = useMemo(() => {
    if (tab === "active")    return VENDOR_JOBS.filter((j) => j.status === "next");
    if (tab === "completed") return VENDOR_JOBS.filter((j) => j.status === "done");
    if (tab === "cancelled") return [];
    return VENDOR_JOBS.filter((j) => j.status !== "done");
  }, [tab]);

  const counts = {
    upcoming:  VENDOR_JOBS.filter((j) => j.status !== "done").length,
    active:    VENDOR_JOBS.filter((j) => j.status === "next").length,
    completed: VENDOR_JOBS.filter((j) => j.status === "done").length,
    cancelled: 0,
  } satisfies Record<TabId, number>;

  // Group by groupLabel
  const groups = useMemo(() => {
    const map = new Map<string, VendorJob[]>();
    filtered.forEach((j) => {
      const arr = map.get(j.groupLabel) ?? [];
      arr.push(j);
      map.set(j.groupLabel, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="px-5 pt-1">
        <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
          Schedule
        </Text>
        <Text
          className="font-serif text-ink mt-1"
          style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}
        >
          Your <Text className="font-serif-italic">jobs</Text>
        </Text>
      </View>

      <View
        className="mt-3.5"
        style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 18 }}
        >
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{
                  paddingBottom: 12, paddingTop: 4,
                  borderBottomWidth: on ? 2 : 0,
                  borderBottomColor: "#1a2120",
                }}
              >
                <Text
                  className={`text-[12.5px] ${
                    on ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"
                  }`}
                >
                  {t.label} · {counts[t.id]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 && (
          <View
            className="bg-white rounded-2xl py-12 items-center border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Ionicons name="calendar-outline" size={26} color={INK_3} />
            <Text className="text-[13px] font-sans-bold text-ink mt-2">Nothing here</Text>
            <Text className="text-[11.5px] text-ink-3 mt-1">
              No {tab} jobs right now.
            </Text>
          </View>
        )}

        {groups.map(([label, jobs]) => (
          <View key={label} className="mb-4">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2 px-1">
              {label}
            </Text>
            <View className="gap-2.5">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function JobCard({ job }: { job: VendorJob }) {
  const next = job.status === "next";
  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{ borderWidth: next ? 1.5 : 0.5, borderColor: next ? PRIMARY : "#e1dcd3" }}
    >
      <Pressable
        onPress={() => router.push(`/vendor-active-job/${job.id}` as Href)}
        className="flex-row gap-3 p-3 active:opacity-90"
      >
        <View
          className="items-center justify-center rounded-xl"
          style={{
            width: 60, paddingVertical: 8,
            backgroundColor: next ? "#e3efe7" : "#f0f0f0",
          }}
        >
          <Text
            className="font-serif text-center"
            style={{
              fontSize: 13, letterSpacing: -0.2,
              color: next ? PRIMARY_INK : "#1a2120",
            }}
          >
            {job.time}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <PLAvatar initials={job.customer.initials} size={22} tone={job.customer.tone} />
            <Text className="flex-1 text-[13.5px] font-sans-bold text-ink" numberOfLines={1}>
              {job.customer.name}
            </Text>
            <Text className="font-serif text-ink" style={{ fontSize: 15 }}>
              {job.amount}
            </Text>
          </View>
          <Text className="text-[12px] font-sans-semibold text-ink-2 mt-1.5">
            {job.service}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons name="location-outline" size={11} color={INK_3} />
            <Text className="text-[11.5px] text-ink-3">{job.home}</Text>
          </View>
        </View>
      </Pressable>
      {next && (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn icon="location-outline" label="Navigate" tone="ghost" />
          <ActionBtn icon="walk-outline" label="I'm on the way" tone="primary" />
        </View>
      )}
    </View>
  );
}

function ActionBtn({
  icon, label, tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "ghost" | "primary";
}) {
  const bg = tone === "primary" ? PRIMARY : "transparent";
  const fg = tone === "primary" ? "#ffffff" : "#1a2120";
  return (
    <View
      className="flex-1 flex-row items-center justify-center gap-1.5"
      style={{
        backgroundColor: bg,
        paddingVertical: 11,
        borderRightWidth: tone === "primary" ? 0 : 0.5,
        borderRightColor: "#ece6df",
      }}
    >
      <Ionicons name={icon} size={13} color={fg} />
      <Text className="text-[12.5px] font-sans-bold" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

void INK_2;
