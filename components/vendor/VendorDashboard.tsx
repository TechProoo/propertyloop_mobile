import { useCallback, useState } from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  Appear,
  PressableScale,
  CountUp,
  Reveal,
  RevealScrollView,
  HeaderTransform,
  useHeaderTransform,
  stagger,
} from "@/components/anim";
import { useStaggeredEntrance } from "@/hooks/useStaggeredEntrance";
import { useAuth } from "@/context/auth";
import vendorsService, { type VendorStats } from "@/api/services/vendors";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";
import vendorServicesService from "@/api/services/vendorServices";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function displayName(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0] || "Vendor";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
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

/**
 * The vendor's operational dashboard — availability, wallet balance, new
 * requests and active jobs. Previously the Home tab; now lives behind the
 * Profile tab's "Profile" toggle, so it takes an `embedded` flag to drop the
 * status-bar top inset (the Profile tab header already owns that space).
 */
export default function VendorDashboard({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { scrollOffset, handleScroll } = useHeaderTransform();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [available, setAvailable] = useState(true);
  const [serviceCount, setServiceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, list, services] = await Promise.all([
        vendorsService.getStats(),
        vendorJobsService.list({ limit: 50 }),
        vendorServicesService.list().catch(() => []),
      ]);
      setStats(s);
      setAvailable(s.profile.availableForHire);
      setJobs(list.items);
      setServiceCount(services.filter((sv) => sv.active && !sv.archived).length);
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
  // A vendor with no active service is hidden from the marketplace (backend
  // filters them out) and can't be booked — push them to add one.
  const needsServices = serviceCount === 0;
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={embedded ? [] : (["top"] as Edge[])}>
      <RevealScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <Appear from="fade" delay={0}>
          <View className="flex-row items-center justify-between px-5 pt-1">
          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => router.push("/(vendor-tabs)/profile" as Href)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
            >
              <PLAvatar initials={initialsOf(user?.name)} uri={user?.avatarUrl} size={40} tone="primary" />
            </Pressable>
            <View>
              <Text className="text-[11px] font-sans-bold text-ink-3">Hi, {displayName(user?.name)}</Text>
              <Text className="text-[16px] font-sans-bold text-ink">Your business at a glance</Text>
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
        </Appear>

        {/* No-services gate — vendor is unbookable & hidden until they add one */}
        {needsServices && (
          <Appear delay={stagger(0, 200)} style={{ marginHorizontal: 16, marginTop: 16 }}>
            <View
              className="rounded-2xl px-4 py-4"
              style={{ backgroundColor: "#f5ead4", borderWidth: 1, borderColor: "#e7d4a8" }}
            >
              <View className="flex-row items-center gap-2.5">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: "#eccf91" }}
                >
                  <Ionicons name="construct" size={18} color="#6b4a16" />
                </View>
                <Text className="flex-1 text-[14px] font-sans-bold" style={{ color: "#6b4a16" }}>
                  Add a service to get booked
                </Text>
              </View>
              <Text className="text-[12.5px] mt-2 leading-5" style={{ color: "#7a5a25" }}>
                {"You're hidden from the marketplace and buyers can't book you until you list at least one service."}
              </Text>
              <Pressable
                onPress={() => router.push("/vendor-first-service?mode=add" as Href)}
                className="mt-3 rounded-full py-3 items-center active:opacity-90"
                style={{ backgroundColor: "#6b4a16" }}
              >
                <Text className="text-white font-sans-bold text-[13.5px]">
                  Add your first service
                </Text>
              </Pressable>
            </View>
          </Appear>
        )}

        {/* Balance hero — available-to-withdraw front and centre */}
        <Appear delay={stagger(0, 200)} style={{ marginHorizontal: 16, marginTop: 16 }}>
        <View className="rounded-2xl px-5 py-4" style={{ backgroundColor: INK }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="wallet" size={13} color="#7ad296" />
              <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
                Available balance
              </Text>
            </View>
            {(stats?.earnings.available ?? 0) > 0 && (
              <Pressable
                onPress={() => router.push("/(vendor-tabs)/earnings" as Href)}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full active:opacity-80"
                style={{ backgroundColor: PRIMARY }}
              >
                <Ionicons name="arrow-up-circle" size={13} color="#ffffff" />
                <Text className="text-[12px] font-sans-bold text-white">Withdraw</Text>
              </Pressable>
            )}
          </View>
          <CountUp
            value={stats?.earnings.available ?? 0}
            format={naira}
            className="font-serif text-white mt-1.5"
            style={{ fontSize: 36, letterSpacing: -0.8 }}
          />
          <Text className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            {(stats?.earnings.available ?? 0) > 0
              ? "Yours to withdraw to your bank whenever you like."
              : "Confirmed jobs land here, ready for you to withdraw."}
          </Text>
          <View className="flex-row gap-3.5 mt-3.5">
            <View className="flex-1">
              <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                In escrow
              </Text>
              <CountUp
                value={stats?.earnings.pending ?? 0}
                format={naira}
                className="font-serif text-white mt-0.5"
                style={{ fontSize: 17 }}
              />
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
            <View className="flex-1">
              <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                This month
              </Text>
              <CountUp
                value={stats?.earnings.thisMonth ?? 0}
                format={naira}
                className="font-serif text-white mt-0.5"
                style={{ fontSize: 17 }}
              />
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
            <View className="flex-1">
              <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                Rating · jobs
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <Ionicons name="star" size={12} color="#b9842c" />
                <Text className="font-serif text-white" style={{ fontSize: 17 }}>
                  {stats?.profile.rating ?? 0} · {stats?.jobs.completed ?? 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
        </Appear>

        {loading ? (
          <View className="py-16 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <>
            {/* New requests */}
            <Appear delay={stagger(1, 200)}>
              <View className="px-5 pt-5 flex-row items-baseline justify-between">
                <Text className="text-[16px] font-sans-bold text-ink">
                  New requests <Text className="text-primary">· {requests.length}</Text>
                </Text>
              </View>
            </Appear>
            {requests.length === 0 ? (
              <Appear delay={stagger(2, 200)}>
                <VendorEmptyState
                  icon="notifications-outline"
                  title="No new requests right now"
                  detail="Keep your availability on to be first in line when a client needs you."
                  action={available ? "Manage services" : "Turn on availability"}
                  onPress={available
                    ? () => router.push("/vendor-menu" as Href)
                    : toggleAvailable}
                />
              </Appear>
            ) : (
              <View className="px-4 pt-2 gap-2.5">
                {requests.map((r, idx) => (
                  <Appear key={r.id} delay={stagger(idx + 2, 200)}>
                    <RequestCard job={r} onChanged={load} />
                  </Appear>
                ))}
              </View>
            )}

            {/* Active jobs */}
            <Appear delay={stagger(requests.length + 2, 200)}>
              <View className="px-5 pt-5 flex-row items-baseline justify-between">
                <Text className="text-[16px] font-sans-bold text-ink">Active · {active.length}</Text>
                <Pressable onPress={() => router.push("/(vendor-tabs)/jobs" as Href)} hitSlop={6}>
                  <Text className="text-[13px] font-sans-bold text-primary">All jobs</Text>
                </Pressable>
              </View>
            </Appear>
            {active.length === 0 ? (
              <Appear delay={stagger(requests.length + 3, 200)}>
                <VendorEmptyState
                  icon="calendar-outline"
                  title="Your schedule is clear"
                  detail="New jobs you accept will appear here with all the details you need."
                  action="View requests"
                  onPress={() => router.push("/(vendor-tabs)/jobs" as Href)}
                />
              </Appear>
            ) : (
              <View className="px-4 pt-2 gap-2">
                {active.map((j, idx) => (
                  <Appear key={j.id} delay={stagger(idx + requests.length + 3, 200)}>
                    <JobMini job={j} />
                  </Appear>
                ))}
              </View>
            )}
          </>
        )}
      </RevealScrollView>
    </SafeAreaView>
  );
}

function VendorEmptyState({
  icon,
  title,
  detail,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View className="mx-4 mt-2 rounded-2xl bg-white p-4 border-line" style={{ borderWidth: 0.5 }}>
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: "#e3efe7" }}>
          <Ionicons name={icon} size={18} color={PRIMARY} />
        </View>
        <View className="flex-1">
          <Text className="text-[13.5px] font-sans-bold text-ink">{title}</Text>
          <Text className="text-[12px] text-ink-3 leading-4 mt-0.5">{detail}</Text>
        </View>
      </View>
      <Pressable onPress={onPress} className="mt-3 self-start rounded-full bg-primary px-3.5 py-2 active:opacity-85">
        <Text className="text-[12px] font-sans-bold text-white">{action}</Text>
      </Pressable>
    </View>
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
    <PressableScale
      onPress={() => router.push(`/vendor-active-job/${job.id}` as Href)}
      activeScale={0.975}
      className="flex-row items-center gap-3 p-3 bg-white rounded-2xl"
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
    </PressableScale>
  );
}
