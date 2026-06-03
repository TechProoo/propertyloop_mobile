import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  VENDOR,
  VENDOR_HERO,
  VENDOR_REQUESTS,
  VENDOR_JOBS,
  type VendorRequest,
  type VendorJob,
} from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorHomeScreen() {
  const [available, setAvailable] = useState(true);
  const todayJobs = VENDOR_JOBS.filter((j) => j.groupLabel.startsWith("Today"));

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1">
          <View className="flex-row items-center gap-2.5">
            <PLAvatar initials={VENDOR.initials} size={40} tone="primary" />
            <View>
              <Text className="text-[11px] font-sans-bold text-ink-3">{VENDOR_HERO.greeting}</Text>
              <Text className="text-[16px] font-sans-bold text-ink">{VENDOR.name}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setAvailable((a) => !a)}
              className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: available ? "#e3efe7" : "#f0f0f0" }}
            >
              <View
                style={{
                  width: 8, height: 8, borderRadius: 8,
                  backgroundColor: available ? PRIMARY : INK_3,
                }}
              />
              <Text
                className="text-[11px] font-sans-bold"
                style={{ color: available ? PRIMARY_INK : INK_2 }}
              >
                {available ? "Available" : "Off"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/notifications" as Href)}
              className="w-10 h-10 rounded-full bg-cream-2 items-center justify-center"
            >
              <Ionicons name="notifications-outline" size={18} color={INK} />
              <View
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: "#b9842c", borderWidth: 2, borderColor: "#ffffff" }}
              />
            </Pressable>
          </View>
        </View>

        {/* Escrow hero */}
        <View
          className="mx-4 mt-4 rounded-2xl px-5 py-4"
          style={{ backgroundColor: INK }}
        >
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="shield-checkmark" size={13} color="#7ad296" />
            <Text
              className="text-[11px] font-sans-bold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              In escrow · releasing soon
            </Text>
          </View>
          <Text
            className="font-serif text-white mt-1.5"
            style={{ fontSize: 36, letterSpacing: -0.8 }}
          >
            {VENDOR_HERO.inEscrow}
          </Text>
          <Text
            className="text-[12px] mt-1"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {VENDOR_HERO.inEscrowDetail}
          </Text>
          <View className="flex-row gap-4 mt-3.5">
            <View>
              <Text
                className="text-[10px] font-sans-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Paid this month
              </Text>
              <Text className="font-serif text-white mt-0.5" style={{ fontSize: 18 }}>
                {VENDOR_HERO.paidThisMonth}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
            <View>
              <Text
                className="text-[10px] font-sans-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Rating · jobs
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <Ionicons name="star" size={12} color="#b9842c" />
                <Text className="font-serif text-white" style={{ fontSize: 18 }}>
                  {VENDOR.rating} · {VENDOR.reviews}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* New requests */}
        <View className="px-5 pt-5 flex-row items-baseline justify-between">
          <Text className="text-[16px] font-sans-bold text-ink">
            New requests <Text className="text-primary">· {VENDOR_REQUESTS.length}</Text>
          </Text>
          <Text className="text-[13px] font-sans-bold text-primary">See all</Text>
        </View>
        <View className="px-4 pt-2 gap-2.5">
          {VENDOR_REQUESTS.map((r) => (
            <RequestCard key={r.id} req={r} />
          ))}
        </View>

        {/* Today */}
        <View className="px-5 pt-5 flex-row items-baseline justify-between">
          <Text className="text-[16px] font-sans-bold text-ink">
            Today · {todayJobs.length} jobs
          </Text>
          <Pressable onPress={() => router.push("/(vendor-tabs)/jobs" as Href)} hitSlop={6}>
            <Text className="text-[13px] font-sans-bold text-primary">Schedule</Text>
          </Pressable>
        </View>
        <View className="px-4 pt-2 gap-2">
          {todayJobs.map((j) => (
            <JobMini key={j.id} job={j} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({ req }: { req: VendorRequest }) {
  const open = () => router.push(`/vendor-request/${req.id}` as Href);
  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        borderWidth: req.fresh ? 1.5 : 0.5,
        borderColor: req.fresh ? PRIMARY : "#e1dcd3",
      }}
    >
      <Pressable onPress={open} className="p-3.5 active:opacity-90">
        <View className="flex-row items-center gap-2.5">
          <PLAvatar initials={req.customer.initials} size={36} tone={req.customer.tone} />
          <View className="flex-1">
            <Text className="text-[13.5px] font-sans-bold text-ink">{req.customer.name}</Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3">{req.ago}</Text>
          </View>
          {req.fresh && (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: PRIMARY }}>
              <Text className="text-[9.5px] font-sans-bold text-white tracking-widest uppercase">
                New
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-baseline justify-between mt-2.5">
          <Text className="text-[14px] font-sans-bold text-ink">{req.service}</Text>
          <Text className="font-serif text-ink" style={{ fontSize: 18, letterSpacing: -0.3 }}>
            {req.amountGross}
          </Text>
        </View>
        <View className="gap-1 mt-2">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={12} color={INK_2} />
            <Text className="text-[12px] text-ink-2">{req.when}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={12} color={INK_2} />
            <Text className="text-[12px] text-ink-2">{req.where}</Text>
          </View>
        </View>
      </Pressable>
      <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
        <ActionBtn label="Decline" tone="ghost" onPress={open} />
        <ActionBtn label="Propose time" tone="ghost" onPress={open} />
        <ActionBtn label="Accept" tone="primary" onPress={open} />
      </View>
    </View>
  );
}

function ActionBtn({
  label, tone, onPress,
}: {
  label: string;
  tone: "ghost" | "primary";
  onPress: () => void;
}) {
  const bg = tone === "primary" ? PRIMARY : "transparent";
  const fg = tone === "primary" ? "#ffffff" : INK_2;
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center active:opacity-80"
      style={{
        backgroundColor: bg,
        paddingVertical: 12,
        borderRightWidth: tone === "primary" ? 0 : 0.5,
        borderRightColor: "#ece6df",
      }}
    >
      <Text className="text-[13px] font-sans-bold" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

function JobMini({ job }: { job: VendorJob }) {
  const done = job.status === "done";
  const next = job.status === "next";
  return (
    <Pressable
      onPress={() => router.push(`/vendor-active-job/${job.id}` as Href)}
      className="flex-row items-center gap-3 p-3 bg-white rounded-2xl active:opacity-90"
      style={{
        borderWidth: next ? 1.5 : 0.5,
        borderColor: next ? PRIMARY : "#e1dcd3",
        opacity: done ? 0.6 : 1,
      }}
    >
      <Text
        className="font-serif text-ink text-center"
        style={{ fontSize: 16, letterSpacing: -0.3, width: 48 }}
      >
        {job.time}
      </Text>
      <View style={{ width: 1, alignSelf: "stretch", backgroundColor: "#e1dcd3" }} />
      <View className="flex-1">
        <Text
          className="text-[13.5px] font-sans-bold text-ink"
          style={{ textDecorationLine: done ? "line-through" : "none" }}
        >
          {job.customer.name}
        </Text>
        <Text className="text-[11.5px] text-ink-3">{job.home}</Text>
      </View>
      {done ? (
        <Text className="text-[11px] font-sans-bold text-primary">Done</Text>
      ) : (
        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[11px] font-sans-bold text-white">Start</Text>
        </View>
      )}
    </Pressable>
  );
}

void Switch; // reserved if we move to switch UI later
