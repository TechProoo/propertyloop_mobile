import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PAYMENT_METHODS } from "@/mocks/buyer-extra";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const FEE_RATE = 0.015; // 1.5% Paystack processing
const FEE_FLOOR = 100;

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    amount?: string;
    title?: string;
    purpose?: string;
  }>();
  const amount = Number(params.amount ?? 18_000);
  const title = params.title ?? "Sparkle & Co. · Standard clean";
  const purpose = params.purpose ?? "escrow";

  const [methodId, setMethodId] = useState(PAYMENT_METHODS[0].id);
  const [submitting, setSubmitting] = useState(false);

  const fee = useMemo(() => Math.max(FEE_FLOOR, Math.round(amount * FEE_RATE)), [amount]);
  const total = amount + fee;

  const onPay = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        "Payment received",
        `₦${total.toLocaleString()} has been locked in escrow. We'll notify the vendor.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    }, 700);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="close" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount hero */}
        <View
          className="mt-2 rounded-2xl px-5 py-5"
          style={{ backgroundColor: INK }}
        >
          <Text
            className="text-[11px] font-sans-bold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {purpose === "escrow" ? "Funding escrow" : "Payment due"}
          </Text>
          <Text
            className="font-serif text-white mt-1.5"
            style={{ fontSize: 36, letterSpacing: -0.8 }}
          >
            ₦{amount.toLocaleString()}
          </Text>
          <Text
            className="text-[12.5px] mt-1.5"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {title}
          </Text>
          {purpose === "escrow" && (
            <View className="flex-row items-center gap-1.5 mt-3">
              <Ionicons name="shield-checkmark" size={13} color="#7ad296" />
              <Text className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                Held by PropertyLoop · released when you confirm
              </Text>
            </View>
          )}
        </View>

        {/* Payment methods */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Pay with
        </Text>
        <View className="gap-2">
          {PAYMENT_METHODS.map((m) => {
            const on = methodId === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethodId(m.id)}
                className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3.5"
                style={{
                  backgroundColor: on ? "#e3efe7" : "#ffffff",
                  borderWidth: on ? 1.5 : 1,
                  borderColor: on ? PRIMARY : "#e1dcd3",
                }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: on ? "#ffffff" : "#f0f0f0" }}
                >
                  <Ionicons
                    name={m.icon}
                    size={18}
                    color={on ? PRIMARY : INK_2}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[13.5px] font-sans-bold text-ink">
                    {m.label}
                  </Text>
                  <Text className="text-[11.5px] text-ink-3 mt-0.5">
                    {m.detail}
                  </Text>
                </View>
                <View
                  className="w-5 h-5 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: on ? PRIMARY : "transparent",
                    borderWidth: on ? 0 : 1.5,
                    borderColor: "#d3cdc1",
                  }}
                >
                  {on && (
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 7,
                        backgroundColor: "#ffffff",
                      }}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => router.push("/add-card" as never)}
          className="mt-2 flex-row items-center gap-2 px-1"
          hitSlop={8}
        >
          <Ionicons name="add-circle-outline" size={16} color={PRIMARY} />
          <Text className="text-[12.5px] font-sans-bold text-primary">
            Add a new card
          </Text>
        </Pressable>

        {/* Breakdown */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Summary
        </Text>
        <View
          className="bg-white rounded-2xl overflow-hidden border-line"
          style={{ borderWidth: 0.5 }}
        >
          <Row label={purpose === "escrow" ? "Held in escrow" : "Amount"} value={`₦${amount.toLocaleString()}`} />
          <Row label="Processing fee" value={`₦${fee.toLocaleString()}`} />
          <Row label="Total today" value={`₦${total.toLocaleString()}`} bold last />
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
          onPress={onPay}
          disabled={submitting}
          className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-60"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            {submitting ? "Processing…" : `Pay ₦${total.toLocaleString()}`}
          </Text>
        </Pressable>
        <View className="flex-row items-center justify-center gap-1 mt-2">
          <Ionicons name="shield-checkmark" size={11} color={INK_3} />
          <Text className="text-[11px] text-ink-3 font-sans-medium">
            Secure checkout · Paystack
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
  last,
}: {
  label: string;
  value: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between px-4 py-3"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
        backgroundColor: bold ? "#f0f0f0" : "transparent",
      }}
    >
      <Text
        className={`text-[12.5px] ${bold ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"}`}
      >
        {label}
      </Text>
      <Text
        className={`${bold ? "font-serif text-ink" : "font-sans-bold text-ink"}`}
        style={{ fontSize: bold ? 17 : 13, letterSpacing: bold ? -0.3 : 0 }}
      >
        {value}
      </Text>
    </View>
  );
}
