import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DISPUTE = "#b3261e";

const STEPS = ["Booked", "In progress", "Complete", "Confirmed"];
const ORDER = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CONFIRMED"];

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function dateOf(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function ServiceJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<VendorJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState("");
  const insets = useSafeAreaInsets();

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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirm = () => {
    if (!id) return;
    Alert.alert("Release payment?", "This confirms the job is complete and releases the escrow to the vendor.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Release",
        onPress: async () => {
          setBusy(true);
          try {
            setJob(await vendorJobsService.confirm(id));
          } catch (e: any) {
            Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const submitDispute = async () => {
    if (!id) return;
    if (reason.trim().length < 10) {
      Alert.alert("Add detail", "Please describe the issue (at least 10 characters).");
      return;
    }
    setBusy(true);
    try {
      setJob(await vendorJobsService.dispute(id, reason.trim()));
      setDisputing(false);
      Alert.alert("Dispute raised", "Our team will pause the release and reach out for details.");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <BouncyLoader color={PRIMARY} />
      </View>
    );
  }
  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-[15px] font-sans-bold text-ink">Job not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80">
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const stageIdx = Math.max(0, ORDER.indexOf(job.status));
  const awaitingConfirm = job.status === "COMPLETED";
  const photos = job.completionProofImages ?? [];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[13px] font-sans-bold text-ink">Service job</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 190 }} showsVerticalScrollIndicator={false}>
        {/* Vendor header */}
        <View className="flex-row items-center gap-3 mt-1">
          <PLAvatar initials={initialsOf(job.vendor?.name)} size={44} tone="primary" />
          <View className="flex-1">
            <Text className="text-[14px] font-sans-bold text-ink">{job.vendor?.name ?? "Vendor"}</Text>
            <Text className="text-[11.5px] text-ink-3 mt-0.5">{job.category ?? job.vendor?.category ?? "Service"}</Text>
          </View>
        </View>

        {/* Status hero */}
        <View className="mt-4 rounded-2xl px-4 py-5" style={{ backgroundColor: INK }}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="shield-checkmark" size={14} color="#7ad296" />
            <Text className="text-[11px] font-sans-bold tracking-widest uppercase text-white/70">
              {job.status === "CONFIRMED" ? "Released · paid" : awaitingConfirm ? "Complete · awaiting your confirmation" : "In escrow"}
            </Text>
          </View>
          <Text className="font-serif text-white mt-2" style={{ fontSize: 34, letterSpacing: -0.6 }}>{naira(job.vendorFee)}</Text>
          <Text className="text-[12.5px] text-white/70 mt-1 leading-5">
            {job.status === "CONFIRMED"
              ? "You released this payment to the vendor."
              : "Held in escrow until you confirm. The vendor only gets paid when you say the work is good."}
          </Text>
        </View>

        {/* Escrow steps */}
        <View className="mt-5 flex-row items-center">
          {STEPS.map((label, i) => {
            const done = i <= Math.min(stageIdx - 1, 3) || (job.status === "CONFIRMED" && i <= 3);
            return (
              <View key={label} className="flex-1 items-center">
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: done ? 0 : 1.5, borderStyle: done ? "solid" : "dashed", borderColor: done ? PRIMARY : "#d3cdc1", backgroundColor: done ? PRIMARY : "transparent", alignItems: "center", justifyContent: "center" }}>
                  {done && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                </View>
                <Text className="mt-1.5 text-[10.5px] font-sans-bold tracking-wider uppercase" style={{ color: done ? PRIMARY_INK : INK_3 }}>{label}</Text>
                {i < STEPS.length - 1 && (
                  <View style={{ position: "absolute", top: 10, left: "60%", right: "-40%", height: 2, backgroundColor: done ? PRIMARY : "#e1dcd3" }} />
                )}
              </View>
            );
          })}
        </View>

        {/* Details */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">Details</Text>
        <View className="bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
          <DetailRow label="Booked" value={dateOf(job.createdAt)} />
          <DetailRow label="Completed" value={dateOf(job.completedAt)} />
          <DetailRow label="Where" value={job.address ?? "—"} />
          <DetailRow label="Job ref" value={job.id.slice(0, 8).toUpperCase()} last />
        </View>

        {/* Vendor note */}
        {!!job.completionNotes && (
          <>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">Vendor's note</Text>
            <View className="bg-cream-2 rounded-2xl px-4 py-3.5">
              <Text className="font-serif-italic text-ink-2" style={{ fontSize: 14, lineHeight: 21 }}>&quot;{job.completionNotes}&quot;</Text>
            </View>
          </>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <View className="flex-row gap-2 mt-3">
            {photos.slice(0, 3).map((url, i) => (
              <Image key={i} source={url} style={{ flex: 1, height: 86, borderRadius: 12 }} contentFit="cover" />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky footer */}
      {awaitingConfirm && (
        <View className="absolute left-0 right-0 bottom-0 border-line bg-cream" style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10, gap: 10 }}>
          {busy ? (
            <View className="items-center" style={{ paddingVertical: 12 }}><BouncyLoader color={PRIMARY} /></View>
          ) : disputing ? (
            <>
              <TextInput
                value={reason}
                onChangeText={setReason}
                multiline
                placeholder="Describe what went wrong…"
                placeholderTextColor={INK_3}
                className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px]"
                style={{ minHeight: 64 }}
                textAlignVertical="top"
              />
              <View className="flex-row gap-2">
                <Pressable onPress={() => setDisputing(false)} className="flex-1 rounded-full items-center bg-cream-2" style={{ paddingVertical: 13 }}>
                  <Text className="text-[13px] font-sans-bold text-ink-2">Cancel</Text>
                </Pressable>
                <Pressable onPress={submitDispute} className="flex-1 rounded-full items-center" style={{ paddingVertical: 13, backgroundColor: DISPUTE }}>
                  <Text className="text-[13px] font-sans-bold text-white">Submit dispute</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={confirm} className="bg-primary rounded-full items-center active:opacity-80" style={{ paddingVertical: 16 }}>
                <Text className="text-white font-sans-bold text-[15px]">Confirm &amp; release {naira(job.vendorFee)}</Text>
              </Pressable>
              <Pressable onPress={() => setDisputing(true)} className="items-center active:opacity-70" style={{ paddingVertical: 8 }}>
                <Text className="text-[13px] font-sans-bold" style={{ color: DISPUTE }}>Something&apos;s wrong — raise a dispute</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: last ? 0 : 0.5, borderBottomColor: "#ece6df" }}>
      <Text className="text-xs font-sans-semibold text-ink-3">{label}</Text>
      <Text className="text-[13px] font-sans-bold text-ink">{value}</Text>
    </View>
  );
}
