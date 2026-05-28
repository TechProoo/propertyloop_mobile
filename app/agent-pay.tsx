import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type Tier = "FOUNDING" | "STANDARD" | "PRO";
type PayMethod = "CARD" | "TRANSFER" | "USSD";

const PRICES_NAIRA: Record<Tier, number> = {
  FOUNDING: 0,
  STANDARD: 5000,
  PRO: 12000,
};
const VAT_RATE = 0.075;

const TIER_LABEL: Record<Tier, string> = {
  FOUNDING: "Founding plan",
  STANDARD: "Standard plan",
  PRO: "Pro plan",
};

function naira(n: number) {
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function nextRenewalLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function AgentPayScreen() {
  const params = useLocalSearchParams<{ tier?: string }>();
  const tier: Tier = ((): Tier => {
    if (params.tier === "STANDARD" || params.tier === "PRO") return params.tier;
    return "FOUNDING";
  })();

  const planAmount = PRICES_NAIRA[tier];
  const vat = Math.round(planAmount * VAT_RATE);
  const total = planAmount + vat;
  const isFree = total === 0;

  const [method, setMethod] = useState<PayMethod>("CARD");
  const [autoRenew, setAutoRenew] = useState(true);

  const renewalDate = useMemo(() => nextRenewalLabel(), []);

  const handlePay = () => {
    // In real life this calls agentsService.initializeSubscriptionCheckout
    // and opens Paystack's hosted checkout in a WebView. Stubbed for now.
    if (isFree) {
      Alert.alert(
        "Founding tier activated",
        "Welcome to PropertyLoop. Your account is free forever.",
        [{ text: "Continue", onPress: () => router.replace("/(tabs)" as Href) }],
      );
      return;
    }
    Alert.alert(
      "Paystack checkout",
      "This will open Paystack's secure checkout in a moment.",
      [{ text: "OK", onPress: () => router.replace("/(tabs)" as Href) }],
    );
  };

  return (
    <View className="flex-1 bg-[#f5f0eb]">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
          >
            <Text className="text-slate-700 text-xl">‹</Text>
          </Pressable>
          <View className="items-center">
            <Text className="text-slate-900 font-semibold text-sm">
              Confirm & pay
            </Text>
            <Text className="text-slate-500 text-xs mt-0.5">Step 4 of 4</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Plan summary */}
          <View className="bg-white rounded-3xl px-5 py-4 mt-6 border border-slate-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-emerald-700 text-xs font-bold tracking-wider">
                {TIER_LABEL[tier].toUpperCase()}
              </Text>
              <Text className="text-slate-500 text-xs font-semibold tracking-wider">
                MONTHLY
              </Text>
            </View>

            <View className="flex-row items-baseline gap-2 mt-2">
              <Text className="text-slate-900 font-serif text-3xl">
                ₦{planAmount.toLocaleString("en-NG")}
              </Text>
              <Text className="text-slate-500 text-sm">/ month</Text>
            </View>

            <View className="mt-4 gap-2">
              <Row
                label={`Plan · ${TIER_LABEL[tier].replace(" plan", "")}`}
                value={naira(planAmount)}
              />
              <Row label="VAT (7.5%)" value={naira(vat)} />
            </View>

            <View className="h-px bg-slate-200 my-3" />

            <Row label="Charged today" value={naira(total)} bold />
          </View>

          {/* Pay with */}
          <Text className="text-slate-500 text-[11px] font-bold tracking-[1.5px] mt-7 mb-3">
            PAY WITH
          </Text>

          <View className="gap-2.5">
            <PaymentRow
              brand="VISA"
              brandBg="bg-slate-900"
              title="•••• •••• •••• 4127"
              subtitle="Adebayo Okafor · Visa · expires 09/27"
              selected={method === "CARD"}
              onPress={() => setMethod("CARD")}
            />
            <PaymentRow
              brand="NGN"
              brandBg="bg-slate-900"
              title="Pay with bank transfer"
              subtitle="Generate a one-time account · Paystack"
              selected={method === "TRANSFER"}
              onPress={() => setMethod("TRANSFER")}
            />
            <PaymentRow
              brand="*770#"
              brandBg="bg-white"
              brandTextColor="text-slate-700"
              title="USSD code"
              subtitle="Pay from any Nigerian bank"
              selected={method === "USSD"}
              onPress={() => setMethod("USSD")}
            />
          </View>

          {/* Auto-renew */}
          {!isFree && (
            <View className="bg-slate-100 rounded-2xl px-4 py-3 mt-5 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
                <Text className="text-slate-700 text-base">↻</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-semibold text-sm">
                  Auto-renew monthly
                </Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  Next charge {renewalDate} · cancel any time
                </Text>
              </View>
              <Switch
                value={autoRenew}
                onValueChange={setAutoRenew}
                trackColor={{ false: "#cbd5e1", true: "#047857" }}
                thumbColor="#ffffff"
              />
            </View>
          )}

          <Text className="text-slate-500 text-[11px] text-center mt-4">
            ○ Secure checkout powered by{" "}
            <Text className="font-bold">Paystack</Text>
          </Text>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-[#f5f0eb]">
          <Pressable
            onPress={handlePay}
            className="bg-emerald-700 rounded-full py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">
              {isFree ? "Activate Founding tier" : `Pay ${naira(total)} & activate`}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={`text-sm ${
          bold ? "text-slate-900 font-bold" : "text-slate-600"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${
          bold ? "text-slate-900 font-bold" : "text-slate-900 font-medium"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function PaymentRow({
  brand,
  brandBg,
  brandTextColor = "text-white",
  title,
  subtitle,
  selected,
  onPress,
}: {
  brand: string;
  brandBg: string;
  brandTextColor?: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3 border-2 ${
        selected ? "border-emerald-600" : "border-slate-200"
      } active:opacity-80`}
    >
      <View
        className={`w-12 h-7 ${brandBg} rounded items-center justify-center border ${
          brandBg === "bg-white" ? "border-slate-300" : "border-transparent"
        }`}
      >
        <Text className={`${brandTextColor} text-[10px] font-bold`}>
          {brand}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-slate-900 font-semibold text-sm">{title}</Text>
        <Text className="text-slate-500 text-xs mt-0.5">{subtitle}</Text>
      </View>
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          selected
            ? "bg-emerald-600 border-emerald-600"
            : "bg-white border-slate-300"
        }`}
      >
        {selected && <View className="w-2 h-2 rounded-full bg-white" />}
      </View>
    </Pressable>
  );
}
