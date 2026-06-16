import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorJobsService, {
  type JobDispute,
  type DisputeMessage,
} from "@/api/services/vendorJobs";
import vendorsService from "@/api/services/vendors";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DISPUTE_BG = "#fdf3eb";
const DISPUTE_BORDER = "#e4a87e";
const DISPUTE_FG = "#7a3a13";
const DISPUTE_PILL = "#c05a1f";

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function naira(n?: number | null) {
  return n != null ? `₦${Math.round(n).toLocaleString("en-NG")}` : "—";
}
function shortDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTH[d.getMonth()]}`;
}
function hoursLeft(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((d.getTime() - Date.now()) / 3_600_000));
}
function initialsOf(name?: string | null) {
  if (!name) return "?";
  return (
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"
  );
}

export default function VendorDisputeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [dispute, setDispute] = useState<JobDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [reply, setReply] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    vendorJobsService
      .getDispute(id)
      .then((d) => active && setDispute(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const pickEvidence = async () => {
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
    if (!r.canceled) {
      setPhotos((p) => [...p, ...r.assets.map((a) => a.uri)].slice(0, 6));
    }
  };

  const submit = async () => {
    if (!id || submitting) return;
    const text = reply.trim();
    if (!text && photos.length === 0) {
      Alert.alert("Add a response", "Write a message or attach evidence first.");
      return;
    }
    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (const uri of photos) urls.push(await vendorsService.uploadImage(uri));
      const updated = await vendorJobsService.addDisputeMessage(
        id,
        text || "Evidence attached.",
        urls.length ? urls : undefined,
      );
      setDispute(updated);
      setReply("");
      setPhotos([]);
    } catch (e: any) {
      Alert.alert(
        "Couldn’t send",
        e?.response?.data?.message ?? "Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
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

  if (error || !dispute) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="shield-outline" size={36} color={INK_3} />
        <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
          Dispute unavailable
        </Text>
        <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
          This job may no longer be under dispute.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-5 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const hrs = hoursLeft(dispute.responseDeadline);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[14px] font-sans-bold text-ink">Dispute</Text>
          <Text className="text-[11px] font-sans-semibold text-ink-3 mt-0.5">
            Job {dispute.jobRef}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        <View
          className="rounded-2xl px-4 py-3.5"
          style={{ backgroundColor: DISPUTE_BG, borderWidth: 1, borderColor: DISPUTE_BORDER }}
        >
          <View className="flex-row items-center gap-2">
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: DISPUTE_PILL }}>
              <Text className="text-[10px] font-sans-bold text-white tracking-widest uppercase">
                Open dispute
              </Text>
            </View>
            <Text className="text-[11px] font-sans-bold" style={{ color: DISPUTE_FG }}>
              {naira(dispute.amountHeldNaira)} on hold
            </Text>
          </View>
          <Text
            className="font-serif mt-2"
            style={{ fontSize: 19, letterSpacing: -0.3, lineHeight: 22, color: DISPUTE_FG }}
          >
            Customer says the <Text className="font-serif-italic">job&apos;s incomplete</Text>
          </Text>
          <Text className="text-[12.5px] mt-1 leading-5" style={{ color: DISPUTE_FG }}>
            Respond with evidence. Our team reviews both sides and decides the outcome.
          </Text>
          {hrs != null && (
            <Text className="text-[11px] font-sans-bold mt-2.5" style={{ color: DISPUTE_FG }}>
              ⏱ {hrs} hr{hrs === 1 ? "" : "s"} left to respond
            </Text>
          )}
        </View>

        {/* Job summary */}
        <View
          className="mt-3.5 bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <PLAvatar
            initials={initialsOf(dispute.customer.name)}
            uri={dispute.customer.avatar}
            size={40}
            tone="accent"
          />
          <View className="flex-1">
            <Text className="text-[13px] font-sans-bold text-ink">
              {dispute.customer.name ?? "Customer"}
              {dispute.service ? ` · ${dispute.service}` : ""}
            </Text>
            <Text className="text-[11.5px] text-ink-3">
              {[shortDate(dispute.scheduledFor ?? dispute.completedAt), dispute.address, naira(dispute.amountTotalNaira)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        </View>

        {/* Conversation */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
          Conversation
        </Text>
        <View className="gap-2">
          {dispute.thread.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </View>

        {/* Your response */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
          Your response
        </Text>
        <TextInput
          value={reply}
          onChangeText={setReply}
          multiline
          textAlignVertical="top"
          placeholder="Explain what happened. Be specific."
          placeholderTextColor={INK_3}
          className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px]"
          style={{ minHeight: 90, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
        />

        {/* Evidence photos */}
        <View className="flex-row flex-wrap gap-1.5 mt-3">
          {photos.map((uri) => (
            <View key={uri} className="relative" style={{ width: "23.5%" }}>
              <Image
                source={{ uri }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }}
                contentFit="cover"
              />
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
              onPress={pickEvidence}
              className="items-center justify-center"
              style={{
                width: "23.5%",
                aspectRatio: 1,
                borderRadius: 10,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: "#d3cdc1",
              }}
            >
              <Ionicons name="add" size={18} color={INK_2} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 28,
        }}
      >
        <Pressable
          onPress={submit}
          disabled={submitting}
          className="bg-primary rounded-full items-center justify-center active:opacity-80"
          style={{ paddingVertical: 16, minHeight: 54, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? (
            <BouncyLoader color="#ffffff" />
          ) : (
            <Text className="text-white font-sans-bold text-[15px]">
              Submit response & evidence
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MessageBubble({ message: m }: { message: DisputeMessage }) {
  if (m.role === "SYSTEM") {
    return (
      <View className="self-center rounded-full px-3 py-1.5" style={{ backgroundColor: "#e3efe7" }}>
        <Text className="text-[11px] font-sans-bold" style={{ color: "#134a2d" }}>
          {m.body}
        </Text>
      </View>
    );
  }
  const isMine = m.role === "VENDOR";
  return (
    <View
      className={isMine ? "self-end rounded-2xl px-3.5 py-2.5" : "self-start rounded-2xl px-3.5 py-2.5"}
      style={{
        backgroundColor: isMine ? "#e3efe7" : "#f0f0f0",
        maxWidth: "85%",
        borderBottomRightRadius: isMine ? 4 : 16,
        borderBottomLeftRadius: isMine ? 16 : 4,
      }}
    >
      <Text className="text-[10.5px] font-sans-bold text-ink-3 mb-1">
        {m.author.toUpperCase()}
      </Text>
      <Text className="text-[13.5px] text-ink leading-5">{m.body}</Text>
      {m.attachments.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {m.attachments.map((url) => (
            <Image
              key={url}
              source={{ uri: url }}
              style={{ width: 56, height: 56, borderRadius: 8 }}
              contentFit="cover"
            />
          ))}
        </View>
      )}
    </View>
  );
}
