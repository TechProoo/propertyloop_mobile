import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import agentsService from "@/api/services/agents";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

type Tier = "FOUNDING" | "STANDARD" | "PRO";

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

  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (paying) return;
    // Founding members are free — nothing to charge, go straight in.
    if (isFree) {
      Alert.alert(
        "Founding tier activated",
        "Welcome to PropertyLoop. Your account is free forever.",
        [{ text: "Continue", onPress: () => router.replace("/(agent-tabs)" as Href) }],
      );
      return;
    }
    // Paid tiers: get a Paystack checkout URL and open it in the browser.
    setPaying(true);
    try {
      const { paymentUrl } = await agentsService.initCheckout(
        tier as "STANDARD" | "PRO",
      );
      await Linking.openURL(paymentUrl);
      Alert.alert(
        "Complete payment",
        "Finish checkout in your browser. Your plan activates once payment is confirmed.",
        [{ text: "Done", onPress: () => router.replace("/(agent-tabs)" as Href) }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Couldn't start checkout. Try again.";
      Alert.alert("Checkout failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
          >
            <Text className="text-ink-2 text-xl">‹</Text>
          </Pressable>
          <Text className="text-ink font-sans-semibold text-sm">
            Confirm & pay
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <OnboardingProgress step={4} total={4} className="px-5 mt-3" />

        <ScrollView
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Plan summary */}
          <View className="bg-white rounded-3xl px-5 py-4 mt-6 border border-line">
            <View className="flex-row items-center justify-between">
              <Text className="text-primary text-xs font-sans-bold tracking-wider">
                {TIER_LABEL[tier].toUpperCase()}
              </Text>
              <Text className="text-ink-3 text-xs font-sans-semibold tracking-wider">
                MONTHLY
              </Text>
            </View>

            <View className="flex-row items-baseline gap-2 mt-2">
              <Text className="text-ink font-serif text-3xl">
                ₦{planAmount.toLocaleString("en-NG")}
              </Text>
              <Text className="text-ink-3 text-sm">/ month</Text>
            </View>

            <View className="mt-4 gap-2">
              <Row
                label={`Plan · ${TIER_LABEL[tier].replace(" plan", "")}`}
                value={naira(planAmount)}
              />
              <Row label="VAT (7.5%)" value={naira(vat)} />
            </View>

            <View className="h-px bg-cream-2 my-3" />

            <Row label="Charged today" value={naira(total)} bold />
          </View>

          {/* How payment works */}
          {!isFree && (
            <>
              <Text className="text-ink-3 text-[11px] font-sans-bold tracking-[1.5px] mt-7 mb-3">
                HOW PAYMENT WORKS
              </Text>
              <View className="bg-white rounded-3xl px-5 py-4 border border-line gap-3.5">
                <InfoRow
                  icon="card-outline"
                  title="Pay any way you like"
                  body="Card, bank transfer, or USSD — choose on the secure checkout."
                />
                <InfoRow
                  icon="refresh-outline"
                  title="Auto-renews monthly"
                  body="Billed automatically each month. Cancel any time from your profile."
                />
                <InfoRow
                  icon="lock-closed-outline"
                  title="Your details stay safe"
                  body="We never see your card. Payments are handled end-to-end by Paystack."
                />
              </View>
            </>
          )}

          <Text className="text-ink-3 text-[11px] text-center mt-4">
            ○ Secure checkout powered by{" "}
            <Text className="font-sans-bold">Paystack</Text>
          </Text>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-cream">
          <Pressable
            onPress={handlePay}
            disabled={paying}
            className="bg-primary rounded-full py-4 items-center active:opacity-80"
            style={{ opacity: paying ? 0.6 : 1 }}
          >
            <Text className="text-white font-sans-semibold text-base">
              {paying
                ? "Starting checkout…"
                : isFree
                  ? "Activate Founding tier"
                  : `Pay ${naira(total)} & activate`}
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
          bold ? "text-ink font-sans-bold" : "text-ink-2"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${
          bold ? "text-ink font-sans-bold" : "text-ink font-sans-medium"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={17} color="#1f6f43" />
      </View>
      <View className="flex-1">
        <Text className="text-ink font-sans-semibold text-sm">{title}</Text>
        <Text className="text-ink-3 text-xs mt-0.5 leading-5">{body}</Text>
      </View>
    </View>
  );
}
