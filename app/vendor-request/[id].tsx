import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

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
    weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function VendorRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<VendorJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setJob(await vendorJobsService.getOne(id));
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const act = (fn: () => Promise<unknown>, confirm: { title: string; message: string; action: string; destructive?: boolean }) => {
    Alert.alert(confirm.title, confirm.message, [
      { text: "Cancel", style: "cancel" },
      {
        text: confirm.action,
        style: confirm.destructive ? "destructive" : "default",
        onPress: async () => {
          setBusy(true);
          try {
            await fn();
            router.back();
          } catch (e: any) {
            Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }
  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-[15px] font-sans-bold text-ink">Request not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80">
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isPending = job.status === "PENDING";

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Booking request</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
        {/* Customer */}
        <View className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line" style={{ borderWidth: 0.5 }}>
          <PLAvatar initials={initialsOf(job.clientName)} size={48} tone="primary" />
          <View className="flex-1">
            <Text className="text-[14px] font-sans-bold text-ink">{job.clientName ?? "Client"}</Text>
            {!!job.category && <Text className="text-[12px] text-ink-3 mt-0.5">{job.category}</Text>}
          </View>
          {!!job.clientPhone && (
            <Pressable onPress={() => Linking.openURL(`tel:${job.clientPhone}`)} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
              <Ionicons name="call-outline" size={16} color={INK_2} />
            </Pressable>
          )}
        </View>

        {/* Amount hero */}
        <View className="mt-3 rounded-2xl px-4 py-4" style={{ backgroundColor: "#e3efe7" }}>
          <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: PRIMARY_INK }}>You'll earn</Text>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="font-serif" style={{ fontSize: 32, letterSpacing: -0.6, color: PRIMARY_INK }}>{naira(job.vendorFee)}</Text>
            <Text className="text-[12px] font-sans-bold" style={{ color: PRIMARY_INK, opacity: 0.7 }}>after fees</Text>
          </View>
          <Text className="text-[11.5px] mt-1" style={{ color: PRIMARY_INK, opacity: 0.75 }}>
            Customer pays {naira(job.amount)} into escrow
          </Text>
        </View>

        {/* Details */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">Job details</Text>
        <View className="bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
          <DetailRow label="Service" value={job.title} />
          <DetailRow label="When" value={whenOf(job.scheduledFor)} />
          <DetailRow label="Where" value={job.address ?? "—"} last />
        </View>

        {/* Note */}
        {!!job.description && (
          <>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">Customer's note</Text>
            <View className="bg-white rounded-2xl px-3.5 py-3 border-line" style={{ borderWidth: 0.5 }}>
              <Text className="font-serif-italic text-ink-2" style={{ fontSize: 14, lineHeight: 21 }}>&quot;{job.description}&quot;</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky actions */}
      <View className="absolute left-0 right-0 bottom-0 bg-cream border-line" style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}>
        {busy ? (
          <View className="items-center" style={{ paddingVertical: 16 }}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : isPending ? (
          <>
            <Pressable
              onPress={() => act(() => vendorJobsService.accept(job.id), { title: "Accept job?", message: `Accept "${job.title}" for ${naira(job.vendorFee)}?`, action: "Accept" })}
              className="bg-primary rounded-full items-center active:opacity-80"
              style={{ paddingVertical: 16 }}
            >
              <Text className="text-white font-sans-bold text-[15px]">Accept job</Text>
            </Pressable>
            <Pressable
              onPress={() => act(() => vendorJobsService.decline(job.id), { title: "Decline?", message: "The customer will be notified and can book another vendor.", action: "Decline", destructive: true })}
              className="mt-2 rounded-full items-center active:opacity-80"
              style={{ paddingVertical: 13, borderWidth: 1, borderColor: "#e1dcd3" }}
            >
              <Text className="text-[12.5px] font-sans-bold text-ink-3">Decline</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => router.push(`/vendor-active-job/${job.id}` as never)}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">Open job</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, sub, last }: { label: string; value: string; sub?: string; last?: boolean }) {
  return (
    <View className="px-3.5 py-3" style={{ borderBottomWidth: last ? 0 : 0.5, borderBottomColor: "#ece6df" }}>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[12px] font-sans-semibold text-ink-3">{label}</Text>
        <Text className="text-[13px] font-sans-bold text-ink text-right flex-1 ml-3" numberOfLines={2}>{value}</Text>
      </View>
      {sub && <Text className="text-[11.5px] text-ink-3 text-right mt-1">{sub}</Text>}
    </View>
  );
}
