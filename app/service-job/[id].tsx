import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";
import paymentsService from "@/api/services/payments";

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

  const payEscrow = async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      const { paymentUrl } = await paymentsService.initJobEscrow(id);
      await Linking.openURL(paymentUrl);
      Alert.alert(
        "Complete payment",
        "Finish checkout in your browser. Your escrow is secured once payment confirms — reopen this screen to see the update.",
        [{ text: "Done", onPress: () => load() }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Please try again.";
      Alert.alert("Couldn't start payment", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setBusy(false);
    }
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

  const isDisputed = job.status === "DISPUTED";
  const escrowStatus = job.escrowStatus ?? "NONE";
  // Buyer must fund escrow once the vendor has accepted (and any time before
  // they confirm). Released/locked/disputed all mean the money is already in.
  const needsPayment =
    escrowStatus === "NONE" &&
    ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(job.status);
  // Total the buyer pays = vendor fee + 10% platform fee (held in escrow).
  const escrowTotal = job.escrowAmount ?? Math.round(job.vendorFee * 1.1);
  // A dispute can only be raised after completion, so keep the tracker at the
  // "Complete" stage instead of letting indexOf(-1) reset it to "Booked".
  const stageIdx = Math.max(0, ORDER.indexOf(isDisputed ? "COMPLETED" : job.status));
  // Only offer "confirm & release" once the work is done AND escrow is funded.
  const awaitingConfirm = job.status === "COMPLETED" && escrowStatus === "LOCKED";
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
            <Ionicons name={isDisputed ? "alert-circle" : needsPayment ? "lock-open" : "shield-checkmark"} size={14} color={isDisputed ? "#f0a98e" : needsPayment ? "#f0c98e" : "#7ad296"} />
            <Text className="text-[11px] font-sans-bold tracking-widest uppercase text-white/70">
              {job.status === "CONFIRMED"
                ? "Released · paid"
                : isDisputed
                  ? "Disputed · under review"
                  : needsPayment
                    ? "Action needed · secure escrow"
                    : awaitingConfirm
                      ? "Complete · awaiting your confirmation"
                      : escrowStatus === "LOCKED"
                        ? "In escrow"
                        : "Requested · awaiting vendor"}
            </Text>
          </View>
          <Text className="font-serif text-white mt-2" style={{ fontSize: 34, letterSpacing: -0.6 }}>{naira(needsPayment ? escrowTotal : job.vendorFee)}</Text>
          <Text className="text-[12.5px] text-white/70 mt-1 leading-5">
            {job.status === "CONFIRMED"
              ? "You released this payment to the vendor."
              : isDisputed
                ? "Payment is paused while our team reviews your dispute."
                : needsPayment
                  ? "Pay now to lock the funds in escrow. The vendor only gets paid after you confirm the work is done."
                  : escrowStatus === "LOCKED"
                    ? "Held in escrow until you confirm. The vendor only gets paid when you say the work is good."
                    : "Waiting for the vendor to accept your request. You'll pay to secure escrow once they do."}
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

        {/* Dispute notice */}
        {isDisputed && (
          <View className="mt-5 rounded-2xl px-4 py-3.5 flex-row gap-2.5 items-start" style={{ backgroundColor: "#fdecea", borderWidth: 1, borderColor: "#f1b5ab" }}>
            <Ionicons name="alert-circle" size={16} color={DISPUTE} style={{ marginTop: 1 }} />
            <View className="flex-1">
              <Text className="text-[12.5px] font-sans-bold" style={{ color: "#7a1d12" }}>Dispute under review</Text>
              <Text className="text-[11.5px] mt-0.5 leading-4" style={{ color: "#7a1d12", opacity: 0.85 }}>
                We&apos;ve paused the escrow release. Our team will reach out to you and the vendor to resolve it.
              </Text>
            </View>
          </View>
        )}

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

      {/* Sticky footer — fund escrow */}
      {needsPayment && (
        <View className="absolute left-0 right-0 bottom-0 border-line bg-cream" style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10, gap: 8 }}>
          {busy ? (
            <View className="items-center" style={{ paddingVertical: 12 }}><BouncyLoader color={PRIMARY} /></View>
          ) : (
            <>
              <Pressable onPress={payEscrow} className="bg-primary rounded-full items-center active:opacity-80" style={{ paddingVertical: 16 }}>
                <Text className="text-white font-sans-bold text-[15px]">Pay {naira(escrowTotal)} to secure escrow</Text>
              </Pressable>
              <Text className="text-[11px] text-ink-3 text-center">
                {naira(job.vendorFee)} to the vendor + 10% platform fee · held until you confirm · Paystack
              </Text>
            </>
          )}
        </View>
      )}

      {/* Sticky footer — confirm / dispute */}
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
