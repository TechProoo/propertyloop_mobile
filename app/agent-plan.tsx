import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

type Tier = "FOUNDING" | "STANDARD" | "PRO";

type Plan = {
  id: Tier;
  name: string;
  price: string;
  period: string;
  hint?: string;
  badge?: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "FOUNDING",
    name: "Founding",
    price: "₦0",
    period: "forever",
    hint: "Capped at 50 listings",
    badge: "BEST VALUE",
    features: [
      "Unlimited active listings",
      "Featured placement",
      "Verified badge",
      "Priority support",
      "Founding-member badge",
    ],
  },
  {
    id: "STANDARD",
    name: "Standard",
    price: "₦5,000",
    period: "/ month",
    hint: "Up to 10 active listings",
    features: [
      "10 active listings",
      "Verified badge",
      "Lead inbox",
      "Basic analytics",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "₦12,000",
    period: "/ month",
    hint: "Unlimited listings + everything",
    features: [
      "Unlimited active listings",
      "Featured placement",
      "Verified badge",
      "Lead inbox",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

// In real life this comes from the backend (is the agent's email on the
// WaitlistEntry table). For now hardcoded so the banner shows.
const foundingEligible = true;
const foundingSpotsLeft = 38;
const foundingCap = 50;

export default function AgentPlanScreen() {
  // If they're eligible for Founding, that's the default selection.
  const [selected, setSelected] = useState<Tier>(
    foundingEligible ? "FOUNDING" : "STANDARD",
  );

  const current = PLANS.find((p) => p.id === selected)!;

  const handleContinue = () => {
    router.push({
      pathname: "/agent-pay",
      params: { tier: selected },
    } as Href);
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
            Pick your plan
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <OnboardingProgress step={3} total={4} className="px-5 mt-3" />

        <ScrollView
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text className="text-ink font-serif text-3xl mt-6 leading-[36px]">
            Pick the plan that <Text className="font-serif-italic">fits</Text>
          </Text>
          <Text className="text-ink-3 text-sm mt-2 leading-5">
            Change tiers any time. We&apos;ll automatically prorate.
          </Text>

          {/* Founding eligibility banner — only if waitlisted */}
          {foundingEligible && (
            <View className="bg-slate-900 rounded-2xl px-4 py-3 flex-row items-center gap-3 mt-5">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                <Ionicons name="star" size={16} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-sans-semibold text-sm">
                  You&apos;re on the Founding list
                </Text>
                <Text className="text-ink-3 text-xs mt-0.5">
                  Free forever · {foundingSpotsLeft} of {foundingCap} spots left
                </Text>
              </View>
              <View className="bg-white/15 px-2.5 py-1 rounded-full">
                <Text className="text-white text-[10px] font-sans-bold tracking-wider">
                  ELIGIBLE
                </Text>
              </View>
            </View>
          )}

          {/* Plan cards */}
          <View className="mt-5 gap-3">
            {PLANS.map((plan) => {
              const isFounding = plan.id === "FOUNDING";
              const locked = isFounding && !foundingEligible;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selected === plan.id}
                  locked={locked}
                  onPress={() => !locked && setSelected(plan.id)}
                />
              );
            })}
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-cream">
          <Pressable
            onPress={handleContinue}
            className="bg-primary rounded-full py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-sans-semibold text-base">
              Continue with {current.name}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PlanCard({
  plan,
  selected,
  locked,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      className={`rounded-3xl p-5 border-2 active:opacity-90 ${
        selected
          ? "bg-primary-soft border-primary"
          : locked
            ? "bg-white border-line opacity-50"
            : "bg-white border-line"
      }`}
    >
      {/* Top row */}
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-ink font-sans-bold text-base">
            {plan.name}
          </Text>
          {plan.badge && (
            <View className="bg-primary px-2 py-0.5 rounded-full">
              <Text className="text-white text-[10px] font-sans-bold tracking-wider">
                {plan.badge}
              </Text>
            </View>
          )}
        </View>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            selected
              ? "bg-primary border-primary"
              : "bg-white border-line"
          }`}
        >
          {selected && <Text className="text-white text-xs font-sans-bold">✓</Text>}
        </View>
      </View>

      {/* Price */}
      <View className="flex-row items-baseline gap-1.5 mt-3">
        <Text className="text-ink font-serif text-3xl">{plan.price}</Text>
        <Text className="text-ink-3 text-sm">{plan.period}</Text>
      </View>
      {plan.hint && (
        <Text className="text-ink-3 text-xs mt-0.5">{plan.hint}</Text>
      )}

      {/* Feature list */}
      <View className="mt-4 gap-2">
        {plan.features.map((f) => (
          <View key={f} className="flex-row items-center gap-2">
            <Ionicons name="checkmark" size={16} color="#1f6f43" />
            <Text className="text-ink-2 text-sm">{f}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
