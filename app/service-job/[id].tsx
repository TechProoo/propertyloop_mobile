import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { SERVICE_JOB_DETAIL } from "@/mocks/linked";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DISPUTE = "#b3261e";

export default function ServiceJobScreen() {
  const job = SERVICE_JOB_DETAIL;

  const onConfirm = () =>
    Alert.alert(
      "Release payment?",
      `Release ${job.amount} to ${job.vendor}? This confirms the job is complete.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          style: "default",
          onPress: () => router.back(),
        },
      ],
    );

  const onDispute = () =>
    Alert.alert(
      "Raise a dispute",
      "Our team will pause the escrow release and contact both you and the vendor for evidence.",
      [
        { text: "Not yet", style: "cancel" },
        { text: "Raise dispute", style: "destructive" },
      ],
    );

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
        <Text className="text-[13px] font-sans-bold text-ink">
          Service job
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Vendor header */}
        <View className="flex-row items-center gap-3 mt-1">
          <PLAvatar initials={job.initials} size={44} tone="primary" />
          <View className="flex-1">
            <Text className="text-[14px] font-sans-bold text-ink">
              {job.vendor}
            </Text>
            <Text className="text-[11.5px] text-ink-3 mt-0.5">
              {job.category}
            </Text>
          </View>
        </View>

        {/* Status hero */}
        <View
          className="mt-4 rounded-2xl px-4 py-5"
          style={{ backgroundColor: INK }}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="shield-checkmark" size={14} color="#7ad296" />
            <Text className="text-[11px] font-sans-bold tracking-widest uppercase text-white/70">
              Job complete · awaiting your confirmation
            </Text>
          </View>
          <Text
            className="font-serif text-white mt-2"
            style={{ fontSize: 34, letterSpacing: -0.6 }}
          >
            {job.amount}
          </Text>
          <Text className="text-[12.5px] text-white/70 mt-1 leading-5">
            Held in escrow until you tap release. The vendor only gets paid when
            you say the work is good.
          </Text>
        </View>

        {/* Escrow steps */}
        <View className="mt-5 flex-row items-center">
          {job.steps.map((s, i) => (
            <View key={s.label} className="flex-1 items-center">
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: s.done ? 0 : 1.5,
                  borderStyle: s.done ? "solid" : "dashed",
                  borderColor: s.done ? PRIMARY : "#d3cdc1",
                  backgroundColor: s.done ? PRIMARY : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.done && (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                )}
              </View>
              <Text
                className="mt-1.5 text-[10.5px] font-sans-bold tracking-wider uppercase"
                style={{ color: s.done ? PRIMARY_INK : INK_3 }}
              >
                {s.label}
              </Text>
              {i < job.steps.length - 1 && (
                <View
                  style={{
                    position: "absolute",
                    top: 10,
                    left: "60%",
                    right: "-40%",
                    height: 2,
                    backgroundColor: s.done ? PRIMARY : "#e1dcd3",
                  }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Details */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Details
        </Text>
        <View
          className="bg-white rounded-2xl overflow-hidden border-line"
          style={{ borderWidth: 0.5 }}
        >
          <DetailRow label="Booked" value={job.booked} />
          <DetailRow label="Completed" value={job.completed} />
          <DetailRow label="Where" value={job.where} />
          <DetailRow label="Job ref" value={job.ref} last />
        </View>

        {/* Vendor note */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Vendor's note
        </Text>
        <View className="bg-cream-2 rounded-2xl px-4 py-3.5">
          <Text
            className="font-serif-italic text-ink-2"
            style={{ fontSize: 14, lineHeight: 21 }}
          >
            "{job.vendorNote}"
          </Text>
        </View>

        {/* Photos */}
        <View className="flex-row gap-2 mt-3">
          {job.photos.map((seed) => (
            <Image
              key={seed}
              source={`https://picsum.photos/seed/${seed}/300/300`}
              style={{ flex: 1, height: 86, borderRadius: 12 }}
              contentFit="cover"
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        className="absolute left-0 right-0 bottom-0 border-line bg-cream"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 28,
          gap: 10,
        }}
      >
        <Pressable
          onPress={onConfirm}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Confirm & release {job.amount}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDispute}
          className="items-center active:opacity-70"
          style={{ paddingVertical: 8 }}
        >
          <Text
            className="text-[13px] font-sans-bold"
            style={{ color: DISPUTE }}
          >
            Something's wrong — raise a dispute
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between px-4 py-3"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
      }}
    >
      <Text className="text-xs font-sans-semibold text-ink-3">{label}</Text>
      <Text className="text-[13px] font-sans-bold text-ink">{value}</Text>
    </View>
  );
}
