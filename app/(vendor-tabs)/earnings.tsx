import { Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { VENDOR, VENDOR_EARNINGS } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_3 = "#7f857f";

export default function VendorEarningsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-1">
          <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
            Earnings
          </Text>
          <Text
            className="font-serif text-ink mt-1"
            style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}
          >
            Your <Text className="font-serif-italic">money</Text>
          </Text>
        </View>

        {/* Balance hero */}
        <View className="mx-4 mt-4 rounded-2xl px-5 py-4" style={{ backgroundColor: INK }}>
          <Text
            className="text-[11px] font-sans-bold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Lifetime earnings
          </Text>
          <Text
            className="font-serif text-white mt-1"
            style={{ fontSize: 36, letterSpacing: -0.8 }}
          >
            {VENDOR_EARNINGS.lifetime}
          </Text>
          <View className="flex-row gap-2.5 mt-4">
            <DarkStat label="In escrow" value={VENDOR_EARNINGS.inEscrow} />
            <DarkStat label="This month" value={VENDOR_EARNINGS.thisMonth} />
          </View>
        </View>

        {/* Payout account */}
        <Pressable
          onPress={() => router.push("/payout-bank" as Href)}
          className="mx-4 mt-3 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
          style={{ borderWidth: 0.5 }}
        >
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: "#7f1d1d" }}
          >
            <Text className="text-[10px] font-sans-bold text-white">GT</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-sans-bold text-ink">{VENDOR.bank}</Text>
            <Text className="text-[11px] text-ink-3 mt-0.5">
              Payouts land here · ~24 hrs after confirm
            </Text>
          </View>
          <Text className="text-[12px] font-sans-bold text-primary">Change</Text>
        </Pressable>

        {/* Releasing soon */}
        <Text className="text-[14px] font-sans-bold text-ink px-5 pt-5">
          Releasing soon · {VENDOR_EARNINGS.releasingSoon.length} jobs
        </Text>
        <View className="px-4 pt-2 gap-2">
          {VENDOR_EARNINGS.releasingSoon.map((j) => {
            const confirmed = j.status.startsWith("Confirmed");
            return (
              <View
                key={j.id}
                className="bg-white rounded-2xl px-3 py-3 flex-row items-center gap-3 border-line"
                style={{ borderWidth: 0.5 }}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: "#e3efe7" }}
                >
                  <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-sans-bold text-ink">
                    {j.customer} · {j.service}
                  </Text>
                  <Text
                    className="text-[11px] font-sans-semibold mt-0.5"
                    style={{ color: confirmed ? PRIMARY : INK_3 }}
                  >
                    {j.status}
                  </Text>
                </View>
                <Text className="font-serif text-ink" style={{ fontSize: 15 }}>
                  {j.amount}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Past payouts */}
        <View className="px-5 pt-5 flex-row items-baseline justify-between">
          <Text className="text-[14px] font-sans-bold text-ink">Past payouts</Text>
          <Text className="text-[12px] font-sans-bold text-primary">Statements</Text>
        </View>
        <View
          className="mx-4 mt-2 bg-white rounded-2xl overflow-hidden border-line"
          style={{ borderWidth: 0.5 }}
        >
          {VENDOR_EARNINGS.pastPayouts.map((p, i, arr) => (
            <View
              key={p.id}
              className="flex-row items-center gap-3 px-3.5 py-3"
              style={{
                borderBottomWidth: i === arr.length - 1 ? 0 : 0.5,
                borderBottomColor: "#ece6df",
              }}
            >
              <View
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Ionicons name="checkmark" size={14} color={PRIMARY_INK} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-sans-bold text-ink">{p.date}</Text>
                <Text className="text-[11px] font-sans-semibold text-ink-3">
                  {p.jobs} · {VENDOR.bank}
                </Text>
              </View>
              <Text className="text-[13.5px] font-sans-bold text-ink">{p.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="flex-1 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
    >
      <Text
        className="text-[10px] font-sans-bold tracking-widest uppercase"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {label}
      </Text>
      <Text className="font-serif text-white mt-0.5" style={{ fontSize: 17 }}>
        {value}
      </Text>
    </View>
  );
}
