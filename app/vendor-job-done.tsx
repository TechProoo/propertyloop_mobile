import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const MINT = "#7ad296";
const ACCENT = "#e3b341";

// Vendor just marked the job done → step 0 complete, step 1 (customer confirm)
// is the active/current state, step 2 (payout) still pending.
const ESCROW_STEPS = ["Done", "Awaiting confirm", "Paid"];
const ACTIVE_STEP = 1;

export default function VendorJobDoneScreen() {
  const { amount } = useLocalSearchParams<{ amount?: string }>();
  const fee = Number(amount) || 0;
  const feeLabel = fee ? `₦${fee.toLocaleString("en-NG")}` : "your share";
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          className="rounded-3xl items-center justify-center"
          style={{ height: 220, backgroundColor: "#e3efe7", overflow: "hidden" }}
        >
          {[96, 68, 40].map((s, i) => (
            <View
              key={s}
              style={{
                position: "absolute",
                width: s * 2, height: s * 2, borderRadius: s,
                borderWidth: 1.5, borderColor: PRIMARY,
                opacity: 0.18 + i * 0.1,
              }}
            />
          ))}
          <View
            style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: PRIMARY,
              alignItems: "center", justifyContent: "center",
              shadowColor: PRIMARY, shadowOpacity: 0.35,
              shadowRadius: 12, shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          >
            <Ionicons name="checkmark" size={32} color="#ffffff" />
          </View>
        </View>

        <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase mt-6">
          Job marked complete
        </Text>
        <Text
          className="font-serif text-ink mt-2"
          style={{ fontSize: 30, letterSpacing: -0.6, lineHeight: 33 }}
        >
          Nice work — <Text className="font-serif-italic">release requested</Text>
        </Text>
        <Text className="text-[13.5px] text-ink-2 mt-2 leading-5">
          We've asked the customer to confirm. Once they do,{" "}
          <Text className="font-sans-bold text-ink">{feeLabel}</Text> lands in your payout account
          — usually within 24 hours.
        </Text>

        {/* Escrow status */}
        <View className="mt-5 rounded-2xl px-5 pt-4 pb-5" style={{ backgroundColor: INK }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark" size={15} color={MINT} />
              <Text className="text-[12px] font-sans-bold text-white tracking-wide">
                Held in escrow
              </Text>
            </View>
            <Text className="font-serif text-white" style={{ fontSize: 22, letterSpacing: -0.3 }}>
              {fee ? `₦${fee.toLocaleString("en-NG")}` : "—"}
            </Text>
          </View>

          {/* Stepper — circles + connectors on one track, labels on their own row */}
          <View className="mt-4 px-1">
            <View className="flex-row items-center">
              {ESCROW_STEPS.map((label, i, arr) => {
                const done = i < ACTIVE_STEP;
                const active = i === ACTIVE_STEP;
                return (
                  <View
                    key={label}
                    className="flex-row items-center"
                    style={{ flex: i < arr.length - 1 ? 1 : 0 }}
                  >
                    <View
                      style={{
                        width: 24, height: 24, borderRadius: 12,
                        backgroundColor: done ? MINT : INK,
                        borderWidth: active ? 2 : done ? 0 : 1.5,
                        borderColor: active ? ACCENT : "rgba(255,255,255,0.18)",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={14} color={INK} />
                      ) : (
                        <Text
                          className="text-[10px] font-sans-bold"
                          style={{ color: active ? ACCENT : "rgba(255,255,255,0.55)" }}
                        >
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    {i < arr.length - 1 && (
                      <View
                        style={{
                          flex: 1,
                          height: 2,
                          marginHorizontal: 6,
                          borderRadius: 1,
                          backgroundColor: i < ACTIVE_STEP ? MINT : "rgba(255,255,255,0.14)",
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            <View className="flex-row mt-2">
              {ESCROW_STEPS.map((label, i, arr) => {
                const done = i < ACTIVE_STEP;
                const active = i === ACTIVE_STEP;
                return (
                  <Text
                    key={label}
                    className="text-[10.5px] font-sans-bold"
                    style={{
                      flex: 1,
                      textAlign: i === 0 ? "left" : i === arr.length - 1 ? "right" : "center",
                      color: active ? ACCENT : "#ffffff",
                      opacity: done || active ? 1 : 0.45,
                    }}
                  >
                    {label}
                  </Text>
                );
              })}
            </View>
          </View>

          <View
            className="flex-row items-center gap-1.5 mt-4 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}
          >
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.6)" />
            <Text className="text-[11.5px] flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              Funds release as soon as the customer confirms the work.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-5 pb-8 gap-2.5">
        <Pressable
          onPress={() => router.replace("/(vendor-tabs)/jobs" as Href)}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 17 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">Back to jobs</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
