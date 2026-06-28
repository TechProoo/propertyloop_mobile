import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorJobsService, {
  type JobStatus,
  type VendorJob,
} from "@/api/services/vendorJobs";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const GROUPS: Record<TabId, JobStatus[]> = {
  upcoming: ["PENDING", "ACCEPTED"],
  active: ["IN_PROGRESS"],
  completed: ["COMPLETED", "CONFIRMED"],
  cancelled: ["DECLINED", "CANCELLED", "DISPUTED"],
};

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function whenOf(iso?: string) {
  if (!iso) return "Flexible";
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function VendorJobsScreen() {
  const [tab, setTab] = useState<TabId>("upcoming");
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await vendorJobsService.list({ limit: 100 });
      setJobs(res.items);
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = {
    upcoming: jobs.filter((j) => GROUPS.upcoming.includes(j.status)).length,
    active: jobs.filter((j) => GROUPS.active.includes(j.status)).length,
    completed: jobs.filter((j) => GROUPS.completed.includes(j.status)).length,
    cancelled: jobs.filter((j) => GROUPS.cancelled.includes(j.status)).length,
  } satisfies Record<TabId, number>;

  const filtered = jobs.filter((j) => GROUPS[tab].includes(j.status));

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="px-5 pt-1">
        <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
          Schedule
        </Text>
        <Text className="font-serif text-ink mt-1" style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}>
          Your <Text className="font-serif-italic">jobs</Text>
        </Text>
      </View>

      <View className="mt-3.5" style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 18 }}>
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{ paddingBottom: 12, paddingTop: 4, borderBottomWidth: on ? 2 : 0, borderBottomColor: "#1a2120" }}
              >
                <Text className={`text-[12.5px] ${on ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"}`}>
                  {t.label} · {counts[t.id]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="py-16 items-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View className="bg-white rounded-2xl py-12 items-center border-line" style={{ borderWidth: 0.5 }}>
              <Ionicons name="calendar-outline" size={26} color={INK_3} />
              <Text className="text-[13px] font-sans-bold text-ink mt-2">Nothing here</Text>
              <Text className="text-[11.5px] text-ink-3 mt-1">No {tab} jobs right now.</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {filtered.map((j) => (
                <JobCard key={j.id} job={j} onChanged={load} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function JobCard({ job, onChanged }: { job: VendorJob; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const open = () => router.push(`/vendor-active-job/${job.id}` as Href);
  const highlight = job.status === "IN_PROGRESS";

  const act = (fn: () => Promise<unknown>, label: string) => {
    setBusy(true);
    fn()
      .then(onChanged)
      .catch((e: any) => {
        Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
      })
      .finally(() => setBusy(false));
  };

  return (
    <View className="bg-white rounded-2xl overflow-hidden" style={{ borderWidth: highlight ? 1.5 : 0.5, borderColor: highlight ? PRIMARY : "#e1dcd3" }}>
      <Pressable onPress={open} className="flex-row gap-3 p-3 active:opacity-90">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <PLAvatar initials={initialsOf(job.clientName)} size={22} tone="primary" />
            <Text className="flex-1 text-[13.5px] font-sans-bold text-ink" numberOfLines={1}>
              {job.clientName ?? "Client"}
            </Text>
            <Text className="font-serif text-ink" style={{ fontSize: 15 }}>{naira(job.vendorFee)}</Text>
          </View>
          <Text className="text-[12px] font-sans-semibold text-ink-2 mt-1.5" numberOfLines={1}>{job.title}</Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons name="time-outline" size={11} color={INK_3} />
            <Text className="text-[11.5px] text-ink-3">{whenOf(job.scheduledFor)}</Text>
          </View>
          {!!job.address && (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Ionicons name="location-outline" size={11} color={INK_3} />
              <Text className="text-[11.5px] text-ink-3" numberOfLines={1}>{job.address}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {busy ? (
        <View className="py-2.5 items-center" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : job.status === "PENDING" ? (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn label="Decline" tone="ghost" onPress={() => act(() => vendorJobsService.decline(job.id), "Decline")} />
          <ActionBtn label="Accept" tone="primary" onPress={() => act(() => vendorJobsService.accept(job.id), "Accept")} />
        </View>
      ) : job.status === "ACCEPTED" ? (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn label="Details" tone="ghost" onPress={open} />
          <ActionBtn label="Start job" tone="primary" onPress={() => act(() => vendorJobsService.start(job.id), "Start")} />
        </View>
      ) : job.status === "IN_PROGRESS" ? (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn label="Mark complete" tone="primary" onPress={open} />
        </View>
      ) : null}
    </View>
  );
}

function ActionBtn({ label, tone, onPress }: { label: string; tone: "ghost" | "primary"; onPress: () => void }) {
  const bg = tone === "primary" ? PRIMARY : "transparent";
  const fg = tone === "primary" ? "#ffffff" : PRIMARY_INK;
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center active:opacity-80"
      style={{ backgroundColor: bg, paddingVertical: 11, borderRightWidth: tone === "primary" ? 0 : 0.5, borderRightColor: "#ece6df" }}
    >
      <Text className="text-[12.5px] font-sans-bold" style={{ color: fg }}>{label}</Text>
    </Pressable>
  );
}

void INK_2;
