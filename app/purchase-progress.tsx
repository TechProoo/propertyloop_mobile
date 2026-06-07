import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import offersService, {
  type PropertyPurchase,
  type PurchaseStep,
} from "@/api/services/offers";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function PurchaseProgressScreen() {
  const [purchase, setPurchase] = useState<PropertyPurchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    offersService
      .listPurchases()
      .then((list) => {
        if (!active) return;
        // Prefer an in-progress purchase, else the most recent.
        const pick =
          list.find((p) => p.status === "IN_PROGRESS") ?? list[0] ?? null;
        setPurchase(pick);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  if (!purchase) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="home-outline" size={36} color={INK_3} />
        <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
          No active purchase
        </Text>
        <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
          When an offer is accepted, your purchase journey shows up here.
        </Text>
        <Pressable
          onPress={() => router.replace("/offers" as Href)}
          className="mt-5 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">Your offers</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const steps = purchase.steps ?? [];
  const doneCount = steps.filter((s) => s.state === "DONE").length;
  const activeStep = steps.find((s) => s.state === "ACTIVE");
  const stepNumber = activeStep ? activeStep.order : doneCount;
  const totalSteps = steps.length || 5;
  const progressPct = totalSteps ? doneCount / totalSteps : 0;

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
        <Pressable onPress={() => router.push("/help" as Href)} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-primary">Help</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Property header */}
        <View
          className="flex-row gap-3 p-3 bg-white rounded-2xl items-center border-line"
          style={{ borderWidth: 0.5 }}
        >
          <Image
            source={purchase.listing?.coverImage}
            style={{ width: 56, height: 56, borderRadius: 10 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
              {purchase.status === "COMPLETED" ? "Completed" : "In progress"}
            </Text>
            <Text className="text-[14px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
              {purchase.listing?.title ?? "Your purchase"}
            </Text>
            <Text className="text-[11.5px] font-sans-semibold text-ink-3" numberOfLines={1}>
              {purchase.listing?.location} · {purchase.agreedAmountLabel}
            </Text>
          </View>
        </View>

        {/* Step headline */}
        <Text
          className="font-serif text-ink mt-6"
          style={{ fontSize: 28, lineHeight: 30, letterSpacing: -0.6 }}
        >
          Step{" "}
          <Text className="font-serif-italic">
            {Math.max(1, stepNumber)} of {totalSteps}
          </Text>
        </Text>
        {activeStep && (
          <Text className="text-[13.5px] text-ink-2 mt-1 leading-5">
            {activeStep.detail}
          </Text>
        )}

        {/* Overall progress bar */}
        <View className="mt-4 bg-line rounded-full overflow-hidden" style={{ height: 8 }}>
          <View
            className="bg-primary rounded-full"
            style={{ height: 8, width: `${Math.round(progressPct * 100)}%` }}
          />
        </View>
        <View className="mt-1.5 flex-row justify-between">
          <Text className="text-[11px] font-sans-semibold text-ink-3">
            Offer accepted
          </Text>
          <Text className="text-[11px] font-sans-semibold text-ink-3">
            Keys handed over
          </Text>
        </View>

        {/* Step rows */}
        <View className="mt-6">
          {steps.map((step, i) => (
            <StepRow key={step.id} step={step} isLast={i === steps.length - 1} />
          ))}
        </View>

        {/* Team */}
        {purchase.agent && (
          <>
            <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-6 mb-2.5">
              Your agent
            </Text>
            <View
              className="flex-row items-center gap-3 p-3 bg-white rounded-2xl border-line"
              style={{ borderWidth: 0.5 }}
            >
              <PLAvatar initials={initialsOf(purchase.agent.name)} size={38} tone="primary" />
              <View className="flex-1">
                <Text className="text-[13.5px] font-sans-bold text-ink">
                  {purchase.agent.name}
                </Text>
                <Text className="text-[11.5px] font-sans-semibold text-ink-3">
                  Listing agent
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push(`/agent-profile/${purchase.agentId}` as Href)
                }
                className="w-[34px] h-[34px] rounded-full bg-cream-2 items-center justify-center"
              >
                <Ionicons name="person-outline" size={16} color={INK_2} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StepRow({ step, isLast }: { step: PurchaseStep; isLast: boolean }) {
  const done = step.state === "DONE";
  const active = step.state === "ACTIVE";

  const marker = (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: done ? PRIMARY : active ? "#ffffff" : "#f0f0f0",
        borderWidth: active ? 2 : 0,
        borderColor: PRIMARY,
      }}
    >
      {done ? (
        <Ionicons name="checkmark" size={14} color="#ffffff" />
      ) : (
        <Text
          className="font-sans-bold"
          style={{ fontSize: 12, color: active ? PRIMARY : INK_3 }}
        >
          {step.order}
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-row" style={{ alignItems: "stretch" }}>
      <View style={{ alignItems: "center", width: 32 }}>
        {marker}
        {!isLast && (
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor: done ? PRIMARY : "#e1dcd3",
              marginTop: 2,
              marginBottom: 2,
            }}
          />
        )}
      </View>

      <View style={{ flex: 1, paddingLeft: 14, paddingBottom: 18 }}>
        <View className="flex-row items-center gap-2">
          <Text
            className="text-[14px] font-sans-bold"
            style={{ color: done ? INK_2 : "#1a2120" }}
          >
            {step.title}
          </Text>
          {step.eta ? (
            <View className="bg-primary-soft px-1.5 py-0.5 rounded-full">
              <Text
                className="text-[10px] font-sans-bold tracking-widest uppercase"
                style={{ color: PRIMARY_INK }}
              >
                ETA {step.eta}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-xs text-ink-3 mt-0.5">{step.detail}</Text>
      </View>
    </View>
  );
}
