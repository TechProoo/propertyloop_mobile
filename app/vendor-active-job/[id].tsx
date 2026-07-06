import { useCallback, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
  type Href,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";
import vendorsService from "@/api/services/vendors";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DISPUTE = "#c05a1f";
const DISPUTE_INK = "#7a3a13";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

const TRACK: { key: string; title: string }[] = [
  { key: "ACCEPTED", title: "Accepted" },
  { key: "IN_PROGRESS", title: "In progress" },
  { key: "COMPLETED", title: "Completed · awaiting confirmation" },
  { key: "CONFIRMED", title: "Confirmed · paid out" },
];
// A disputed job was necessarily completed first, so it reaches the Completed
// stage; its final node is the dispute (not "confirmed · paid out").
const DISPUTE_TRACK: { key: string; title: string }[] = [
  { key: "ACCEPTED", title: "Accepted" },
  { key: "IN_PROGRESS", title: "In progress" },
  { key: "COMPLETED", title: "Completed" },
  { key: "DISPUTED", title: "Disputed · under review" },
];
const ORDER = ["ACCEPTED", "IN_PROGRESS", "COMPLETED", "CONFIRMED"];

export default function VendorActiveJobScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<VendorJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState("");
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

  const pickPhotos = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 6 - photos.length,
      quality: 0.85,
    });
    if (!r.canceled) setPhotos((p) => [...p, ...r.assets.map((a) => a.uri)].slice(0, 6));
  };

  const startJob = async () => {
    if (!id) return;
    setBusy(true);
    try {
      setJob(await vendorJobsService.start(id));
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const complete = () => {
    if (!id) return;
    Alert.alert(
      "Mark complete & request release?",
      "The customer will be asked to confirm. Once they do, your share is released.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark complete",
          onPress: async () => {
            setBusy(true);
            try {
              const urls: string[] = [];
              for (const uri of photos) urls.push(await vendorsService.uploadImage(uri));
              await vendorJobsService.complete(id, {
                completionNotes: note.trim() || undefined,
                completionProofImages: urls.length ? urls : undefined,
              });
              router.replace(`/vendor-job-done?amount=${job?.vendorFee ?? 0}` as Href);
            } catch (e: any) {
              Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
              setBusy(false);
            }
          },
        },
      ],
    );
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

  const disputed = job.status === "DISPUTED";
  const track = disputed ? DISPUTE_TRACK : TRACK;
  // Disputes only happen after completion, so land the tracker on the final
  // (dispute) node with everything before it done — not clamped back to 0.
  const stageIdx = disputed ? 3 : Math.max(0, ORDER.indexOf(job.status));
  const canComplete = job.status === "IN_PROGRESS";
  // A vendor can only start once the customer's payment is locked in escrow.
  const escrowFunded = job.escrowStatus === "LOCKED";

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Job</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
        {/* Customer */}
        <View className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line" style={{ borderWidth: 0.5 }}>
          <PLAvatar initials={initialsOf(job.clientName)} size={44} tone="primary" />
          <View className="flex-1">
            <Text className="text-[14px] font-sans-bold text-ink">{job.clientName ?? "Client"}</Text>
            <Text className="text-[12px] text-ink-3" numberOfLines={1}>{job.title} · {naira(job.vendorFee)}</Text>
          </View>
          {!!job.clientPhone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${job.clientPhone}`)}
              className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
            >
              <Ionicons name="call-outline" size={16} color={INK_2} />
            </Pressable>
          )}
        </View>

        {!!job.address && (
          <View className="flex-row items-center gap-1.5 mt-3 px-1">
            <Ionicons name="location-outline" size={14} color={INK_2} />
            <Text className="text-[12.5px] text-ink-2 flex-1">{job.address}</Text>
          </View>
        )}

        {/* Your earnings — the vendor keeps 90%; PropertyLoop's 10% commission
            comes out of the job price. Shown plainly so the vendor understands
            why they receive ₦180 on a ₦200 job (never surprised at payout). */}
        <View className="bg-white rounded-2xl px-4 py-3.5 mt-4 border-line" style={{ borderWidth: 0.5 }}>
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
            Your earnings
          </Text>
          <View className="flex-row items-center justify-between mt-2.5">
            <Text className="text-[13px] text-ink-2">Job price</Text>
            <Text className="text-[13px] font-sans-semibold text-ink">
              {naira(job.escrowAmount ?? job.vendorFee + job.platformFee)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-1.5">
            <Text className="text-[13px] text-ink-2">PropertyLoop fee (10%)</Text>
            <Text className="text-[13px] font-sans-semibold" style={{ color: DISPUTE }}>
              −{naira(job.platformFee)}
            </Text>
          </View>
          <View className="h-px bg-line my-2.5" />
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-sans-bold text-ink">You keep</Text>
            <Text className="text-[16px] font-sans-bold" style={{ color: PRIMARY }}>
              {naira(job.vendorFee)}
            </Text>
          </View>
        </View>

        {/* Tracker */}
        <View className="mt-5">
          {track.map((s, i, arr) => {
            const isDisputeNode = disputed && s.key === "DISPUTED";
            const done = i < stageIdx;
            const active = i === stageIdx;
            const todo = i > stageIdx;
            return (
              <View key={s.key} className="flex-row gap-3.5">
                <View className="items-center" style={{ width: 30 }}>
                  <View
                    style={{
                      width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
                      backgroundColor: isDisputeNode ? DISPUTE : done ? PRIMARY : active ? "#ffffff" : "#f0f0f0",
                      borderWidth: active && !isDisputeNode ? 2 : 0, borderColor: PRIMARY,
                    }}
                  >
                    {isDisputeNode ? (
                      <Ionicons name="alert" size={16} color="#ffffff" />
                    ) : done ? (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    ) : (
                      <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: active ? PRIMARY : INK_3 }} />
                    )}
                  </View>
                  {i < arr.length - 1 && (
                    <View style={{ flex: 1, width: 2, backgroundColor: done ? PRIMARY : "#e1dcd3", marginVertical: 2, minHeight: 16 }} />
                  )}
                </View>
                <View className="flex-1 pb-4">
                  <Text
                    className="text-[14px] font-sans-bold"
                    style={{ color: isDisputeNode ? DISPUTE_INK : todo ? INK_3 : INK }}
                  >
                    {s.title}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Completion (only while in progress) */}
        {canComplete && (
          <>
            <View className="flex-row items-baseline justify-between mt-2 mb-2">
              <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
                Photos of finished work
              </Text>
              <Text className="text-[11px] font-sans-semibold text-ink-3">{photos.length} added</Text>
            </View>
            <View className="flex-row flex-wrap gap-1.5">
              {photos.map((uri) => (
                <View key={uri} className="relative" style={{ width: "23.5%" }}>
                  <Image source={{ uri }} style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }} contentFit="cover" />
                  <Pressable
                    onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white items-center justify-center"
                    hitSlop={6}
                    style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
                  >
                    <Ionicons name="close" size={10} color={INK_2} />
                  </Pressable>
                </View>
              ))}
              {photos.length < 6 && (
                <Pressable
                  onPress={pickPhotos}
                  className="items-center justify-center"
                  style={{ width: "23.5%", aspectRatio: 1, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#d3cdc1" }}
                >
                  <Ionicons name="add" size={18} color={INK_2} />
                </Pressable>
              )}
            </View>

            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
              Note for customer
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
              placeholder="All done — a quick note about what you tackled."
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px]"
              style={{ minHeight: 70 }}
            />
          </>
        )}

        {job.status === "DISPUTED" ? (
          <Pressable
            onPress={() => router.push(`/vendor-dispute/${job.id}` as Href)}
            className="mt-2 rounded-2xl px-4 py-3.5 flex-row items-center gap-2 active:opacity-90"
            style={{ backgroundColor: "#fdf3eb", borderWidth: 1, borderColor: "#e4a87e" }}
          >
            <View className="flex-1">
              <Text className="text-[12.5px] font-sans-bold" style={{ color: "#7a3a13" }}>
                Customer raised a dispute
              </Text>
              <Text className="text-[11.5px] mt-0.5" style={{ color: "#7a3a13", opacity: 0.85 }}>
                Respond with evidence so our team can review both sides.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#7a3a13" />
          </Pressable>
        ) : job.status === "COMPLETED" ? (
          <View className="mt-2 bg-primary-soft rounded-2xl px-4 py-3.5">
            <Text className="text-[12.5px] font-sans-bold" style={{ color: "#134a2d" }}>
              Waiting on the customer to confirm
            </Text>
            <Text className="text-[11.5px] mt-0.5" style={{ color: "#134a2d", opacity: 0.8 }}>
              Once they confirm, your {naira(job.vendorFee)} is released from escrow to your balance.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}
      >
        {busy ? (
          <View className="items-center" style={{ paddingVertical: 16 }}>
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : job.status === "ACCEPTED" ? (
          escrowFunded ? (
            <Pressable onPress={startJob} className="bg-primary rounded-full items-center active:opacity-80" style={{ paddingVertical: 16 }}>
              <Text className="text-white font-sans-bold text-[15px]">Start job</Text>
            </Pressable>
          ) : (
            <View className="rounded-full items-center" style={{ paddingVertical: 13, backgroundColor: "#f0f0f0" }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="lock-closed" size={15} color={INK_2} />
                <Text className="font-sans-bold text-[13.5px]" style={{ color: INK_2 }}>
                  Waiting for payment to escrow
                </Text>
              </View>
              <Text className="text-[11.5px] mt-0.5" style={{ color: INK_2, opacity: 0.7 }}>
                You can start once the customer secures payment.
              </Text>
            </View>
          )
        ) : job.status === "IN_PROGRESS" ? (
          <Pressable onPress={complete} className="bg-primary rounded-full items-center active:opacity-80" style={{ paddingVertical: 16 }}>
            <Text className="text-white font-sans-bold text-[15px]">Mark complete & request release</Text>
          </Pressable>
        ) : job.status === "DISPUTED" ? (
          <Pressable
            onPress={() => router.push(`/vendor-dispute/${job.id}` as Href)}
            className="rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 16, backgroundColor: "#c05a1f" }}
          >
            <Text className="text-white font-sans-bold text-[15px]">Respond to dispute</Text>
          </Pressable>
        ) : (
          <View className="rounded-full items-center bg-cream-2" style={{ paddingVertical: 16 }}>
            <Text className="font-sans-bold text-[15px] text-ink-3">
              {job.status === "CONFIRMED" ? "Completed · paid out" : "Awaiting customer confirmation"}
            </Text>
          </View>
        )}
        <Text className="text-center text-[11px] text-ink-3 mt-2">
          {job.status === "DISPUTED"
            ? "Our team reviews disputes within 48 hours"
            : "Customer confirms → your share released from escrow"}
        </Text>
      </View>
    </SafeAreaView>
  );
}
