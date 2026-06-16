import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import vendorsService, { type VendorStats } from "@/api/services/vendors";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function timeOf(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}
function whenOf(iso?: string) {
  if (!iso) return "Flexible";
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function VendorHomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, list] = await Promise.all([
        vendorsService.getStats(),
        vendorJobsService.list({ limit: 50 }),
      ]);
      setStats(s);
      setAvailable(s.profile.availableForHire);
      setJobs(list.items);
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

  const toggleAvailable = async () => {
    const next = !available;
    setAvailable(next);
    try {
      await vendorsService.updateMe({ availableForHire: next });
    } catch {
      setAvailable(!next); // revert
    }
  };

  const requests = jobs.filter((j) => j.status === "PENDING");
  const active = jobs.filter((j) => j.status === "ACCEPTED" || j.status === "IN_PROGRESS");
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1">
          <View className="flex-row items-center gap-2.5">
            <PLAvatar initials={initialsOf(user?.name)} uri={user?.avatarUrl} size={40} tone="primary" />
            <View>
              <Text className="text-[11px] font-sans-bold text-ink-3">{greeting}</Text>
              <Text className="text-[16px] font-sans-bold text-ink">{user?.name ?? "Vendor"}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={toggleAvailable}
              className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: available ? "#e3efe7" : "#f0f0f0" }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: available ? PRIMARY : INK_3 }} />
              <Text className="text-[11px] font-sans-bold" style={{ color: available ? PRIMARY_INK : INK_2 }}>
                {available ? "Available" : "Off"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/notifications" as Href)}
              className="w-10 h-10 rounded-full bg-cream-2 items-center justify-center"
            >
              <Ionicons name="notifications-outline" size={18} color={INK} />
            </Pressable>
          </View>
        </View>

        {/* Escrow hero */}
        <View className="mx-4 mt-4 rounded-2xl px-5 py-4" style={{ backgroundColor: INK }}>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="shield-checkmark" size={13} color="#7ad296" />
            <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
              In escrow · releasing soon
            </Text>
          </View>
          <Text className="font-serif text-white mt-1.5" style={{ fontSize: 36, letterSpacing: -0.8 }}>
            {naira(stats?.earnings.pending ?? 0)}
          </Text>
          <Text className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            Released to you once clients confirm each job.
          </Text>
          <View className="flex-row gap-4 mt-3.5">
            <View>
              <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                Paid this month
              </Text>
              <Text className="font-serif text-white mt-0.5" style={{ fontSize: 18 }}>
                {naira(stats?.earnings.thisMonth ?? 0)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
            <View>
              <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                Rating · jobs
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <Ionicons name="star" size={12} color="#b9842c" />
                <Text className="font-serif text-white" style={{ fontSize: 18 }}>
                  {stats?.profile.rating ?? 0} · {stats?.jobs.completed ?? 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View className="py-16 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <>
            {/* New requests */}
            <View className="px-5 pt-5 flex-row items-baseline justify-between">
              <Text className="text-[16px] font-sans-bold text-ink">
                New requests <Text className="text-primary">· {requests.length}</Text>
              </Text>
            </View>
            {requests.length === 0 ? (
              <Text className="px-5 pt-2 text-[12.5px] text-ink-3">No new requests right now.</Text>
            ) : (
              <View className="px-4 pt-2 gap-2.5">
                {requests.map((r) => (
                  <RequestCard key={r.id} job={r} onChanged={load} />
                ))}
              </View>
            )}

            {/* Active jobs */}
            <View className="px-5 pt-5 flex-row items-baseline justify-between">
              <Text className="text-[16px] font-sans-bold text-ink">Active · {active.length}</Text>
              <Pressable onPress={() => router.push("/(vendor-tabs)/jobs" as Href)} hitSlop={6}>
                <Text className="text-[13px] font-sans-bold text-primary">All jobs</Text>
              </Pressable>
            </View>
            {active.length === 0 ? (
              <Text className="px-5 pt-2 text-[12.5px] text-ink-3">No active jobs.</Text>
            ) : (
              <View className="px-4 pt-2 gap-2">
                {active.map((j) => (
                  <JobMini key={j.id} job={j} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({ job, onChanged }: { job: VendorJob; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const open = () => router.push(`/vendor-request/${job.id}` as Href);

  const act = (fn: () => Promise<unknown>, label: string) => {
    Alert.alert(`${label} job?`, `${label} "${job.title}" from ${job.clientName ?? "the client"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: label,
        onPress: async () => {
          setBusy(true);
          try {
            await fn();
            onChanged();
          } catch (e: any) {
            Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="bg-white rounded-2xl overflow-hidden" style={{ borderWidth: 1.5, borderColor: PRIMARY }}>
      <Pressable onPress={open} className="p-3.5 active:opacity-90">
        <View className="flex-row items-center gap-2.5">
          <PLAvatar initials={initialsOf(job.clientName)} size={36} tone="primary" />
          <View className="flex-1">
            <Text className="text-[13.5px] font-sans-bold text-ink">{job.clientName ?? "Client"}</Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3">{whenOf(job.scheduledFor)}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: PRIMARY }}>
            <Text className="text-[9.5px] font-sans-bold text-white tracking-widest uppercase">New</Text>
          </View>
        </View>
        <View className="flex-row items-baseline justify-between mt-2.5">
          <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1} style={{ flex: 1 }}>
            {job.title}
          </Text>
          <Text className="font-serif text-ink ml-2" style={{ fontSize: 18, letterSpacing: -0.3 }}>
            {naira(job.vendorFee)}
          </Text>
        </View>
        {!!job.address && (
          <View className="flex-row items-center gap-1.5 mt-2">
            <Ionicons name="location-outline" size={12} color={INK_2} />
            <Text className="text-[12px] text-ink-2" numberOfLines={1}>{job.address}</Text>
          </View>
        )}
      </Pressable>
      {busy ? (
        <View className="py-2.5 items-center" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn label="Decline" tone="ghost" onPress={() => act(() => vendorJobsService.decline(job.id), "Decline")} />
          <ActionBtn label="Details" tone="ghost" onPress={open} />
          <ActionBtn label="Accept" tone="primary" onPress={() => act(() => vendorJobsService.accept(job.id), "Accept")} />
        </View>
      )}
    </View>
  );
}

function ActionBtn({ label, tone, onPress }: { label: string; tone: "ghost" | "primary"; onPress: () => void }) {
  const bg = tone === "primary" ? PRIMARY : "transparent";
  const fg = tone === "primary" ? "#ffffff" : INK_2;
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center active:opacity-80"
      style={{ backgroundColor: bg, paddingVertical: 12, borderRightWidth: tone === "primary" ? 0 : 0.5, borderRightColor: "#ece6df" }}
    >
      <Text className="text-[13px] font-sans-bold" style={{ color: fg }}>{label}</Text>
    </Pressable>
  );
}

function JobMini({ job }: { job: VendorJob }) {
  const inProgress = job.status === "IN_PROGRESS";
  return (
    <Pressable
      onPress={() => router.push(`/vendor-active-job/${job.id}` as Href)}
      className="flex-row items-center gap-3 p-3 bg-white rounded-2xl active:opacity-90"
      style={{ borderWidth: inProgress ? 1.5 : 0.5, borderColor: inProgress ? PRIMARY : "#e1dcd3" }}
    >
      <Text className="font-serif text-ink text-center" style={{ fontSize: 15, letterSpacing: -0.3, width: 52 }}>
        {timeOf(job.scheduledFor)}
      </Text>
      <View style={{ width: 1, alignSelf: "stretch", backgroundColor: "#e1dcd3" }} />
      <View className="flex-1">
        <Text className="text-[13.5px] font-sans-bold text-ink" numberOfLines={1}>{job.clientName ?? job.title}</Text>
        <Text className="text-[11.5px] text-ink-3" numberOfLines={1}>{job.address ?? job.title}</Text>
      </View>
      <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: inProgress ? PRIMARY : "#f0f0f0" }}>
        <Text className="text-[11px] font-sans-bold" style={{ color: inProgress ? "#ffffff" : INK_2 }}>
          {inProgress ? "In progress" : "Open"}
        </Text>
      </View>
    </Pressable>
  );
}
