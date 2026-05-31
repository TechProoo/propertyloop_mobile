import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { PURCHASE, type PurchaseStep } from "@/mocks/buyer-dashboard";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/200/200`;
}

export default function PurchaseProgressScreen() {
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
        <Text className="text-[13px] font-sans-bold text-ink-3">Help</Text>
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
            source={picsum(PURCHASE.property.imageSeed)}
            style={{ width: 56, height: 56, borderRadius: 10 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
              {PURCHASE.property.status}
            </Text>
            <Text className="text-[14px] font-sans-bold text-ink mt-0.5">
              {PURCHASE.property.name}
            </Text>
            <Text className="text-[11.5px] font-sans-semibold text-ink-3">
              {PURCHASE.property.area}
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
            {PURCHASE.stepNumber} of {PURCHASE.totalSteps}
          </Text>
        </Text>
        <Text className="text-[13.5px] text-ink-2 mt-1 leading-5">
          {PURCHASE.blurb.split("14 days")[0]}
          <Text className="font-sans-bold text-ink">14 days</Text>
          {PURCHASE.blurb.split("14 days")[1]}
        </Text>

        {/* Overall progress bar */}
        <View
          className="mt-4 bg-line rounded-full overflow-hidden"
          style={{ height: 8 }}
        >
          <View
            className="bg-primary rounded-full"
            style={{ height: 8, width: `${PURCHASE.progressPct * 100}%` }}
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
          {PURCHASE.steps.map((step, i) => (
            <StepRow
              key={step.n}
              step={step}
              isLast={i === PURCHASE.steps.length - 1}
            />
          ))}
        </View>

        {/* Pending-action card */}
        <View
          className="mt-3 bg-primary-soft rounded-2xl px-4 py-3.5 flex-row items-center gap-3"
        >
          <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
            <Ionicons name="document-text-outline" size={18} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text
              className="text-[13.5px] font-sans-bold"
              style={{ color: PRIMARY_INK }}
            >
              {PURCHASE.pendingAction.title}
            </Text>
            <Text
              className="text-[11.5px] mt-0.5"
              style={{ color: PRIMARY_INK, opacity: 0.7 }}
            >
              {PURCHASE.pendingAction.detail}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/sign-document" as Href)}
            className="bg-primary rounded-full px-3.5 py-2.5 active:opacity-80"
          >
            <Text className="text-[12px] font-sans-bold text-white">Sign</Text>
          </Pressable>
        </View>

        {/* Team */}
        <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-6 mb-2.5">
          Your team
        </Text>
        <View className="gap-2">
          {PURCHASE.team.map((p) => (
            <View
              key={p.name}
              className="flex-row items-center gap-3 p-3 bg-white rounded-2xl border-line"
              style={{ borderWidth: 0.5 }}
            >
              <PLAvatar initials={p.initials} size={38} tone={p.tone} />
              <View className="flex-1">
                <Text className="text-[13.5px] font-sans-bold text-ink">
                  {p.name}
                </Text>
                <Text className="text-[11.5px] font-sans-semibold text-ink-3">
                  {p.role}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/conversation/chinwe" as Href)}
                className="w-[34px] h-[34px] rounded-full bg-cream-2 items-center justify-center"
              >
                <Ionicons name="chatbubble-outline" size={16} color={INK_2} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepRow({ step, isLast }: { step: PurchaseStep; isLast: boolean }) {
  const done = step.state === "done";
  const active = step.state === "active";

  // Marker tile (circle on the timeline rail)
  const marker = (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: done ? PRIMARY : active ? "#ffffff" : "#ece6df",
        borderWidth: active ? 2 : 0,
        borderColor: PRIMARY,
        shadowColor: active ? PRIMARY : undefined,
        shadowOpacity: active ? 0.18 : 0,
        shadowRadius: active ? 6 : 0,
      }}
    >
      {done ? (
        <Ionicons name="checkmark" size={14} color="#ffffff" />
      ) : (
        <Text
          className="font-sans-bold"
          style={{
            fontSize: 12,
            color: active ? PRIMARY : INK_3,
          }}
        >
          {step.n}
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-row" style={{ alignItems: "stretch" }}>
      {/* Marker + rail */}
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

      {/* Content */}
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
