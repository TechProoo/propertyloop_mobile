import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const AMBER_BG = "#f5ead4";
const AMBER_FG = "#6b4a16";

const STEPS = [
  {
    title: "You pay into escrow",
    detail:
      "Money leaves your card but goes to PropertyLoop, not the vendor.",
    icon: "card-outline" as const,
  },
  {
    title: "Vendor does the work",
    detail:
      "They show up and complete the job, knowing payment is secured.",
    icon: "construct-outline" as const,
  },
  {
    title: "You confirm it's done",
    detail:
      "Happy? Release the funds. Not happy? Raise a dispute before releasing.",
    icon: "checkmark-circle-outline" as const,
  },
  {
    title: "Vendor gets paid",
    detail: "Funds released to their bank account via Paystack transfer.",
    icon: "cash-outline" as const,
  },
];

export default function EscrowInfoScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="close" size={18} color={INK_2} />
        </Pressable>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Shield emblem */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            backgroundColor: INK,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="shield-checkmark" size={30} color="#7ad296" />
        </View>

        <Text
          className="font-serif text-ink mt-5"
          style={{ fontSize: 30, letterSpacing: -0.6, lineHeight: 33 }}
        >
          Your money, <Text className="font-serif-italic">held safe</Text>
        </Text>
        <Text className="text-[13.5px] text-ink-2 mt-2 leading-5">
          When you hire a vendor, you don't pay them directly. PropertyLoop
          holds the money until you confirm the job's done — so it's safe to
          hire someone you've never met.
        </Text>

        {/* Flow */}
        <View className="mt-6">
          {STEPS.map((s, i) => {
            const active = i === 2;
            const last = i === STEPS.length - 1;
            return (
              <View key={s.title} className="flex-row gap-3.5">
                <View className="items-center" style={{ width: 44 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: active ? PRIMARY : "#f0f0f0",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={s.icon}
                      size={20}
                      color={active ? "#ffffff" : INK_2}
                    />
                  </View>
                  {!last && (
                    <View
                      style={{
                        flex: 1,
                        width: 2,
                        backgroundColor: "#e1dcd3",
                        marginVertical: 4,
                        minHeight: 18,
                      }}
                    />
                  )}
                </View>
                <View
                  style={{ flex: 1, paddingBottom: last ? 0 : 18 }}
                >
                  <Text className="text-[14.5px] font-sans-bold text-ink">
                    {s.title}
                  </Text>
                  <Text className="text-[13px] text-ink-2 mt-1 leading-5">
                    {s.detail}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Dispute callout */}
        <View
          className="mt-3 rounded-2xl px-4 py-3.5 flex-row gap-3 items-start"
          style={{ backgroundColor: AMBER_BG }}
        >
          <View
            className="w-9 h-9 rounded-xl bg-white items-center justify-center"
          >
            <Ionicons name="warning-outline" size={18} color={AMBER_FG} />
          </View>
          <View className="flex-1">
            <Text
              className="text-[13.5px] font-sans-bold"
              style={{ color: AMBER_FG }}
            >
              If something goes wrong
            </Text>
            <Text
              className="text-[12.5px] mt-1 leading-5"
              style={{ color: AMBER_FG, opacity: 0.85 }}
            >
              Raise a dispute before releasing. Our team reviews evidence from
              both sides and can refund you.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream"
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 20) + 10 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">Got it</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Quiet unused-warning when not referenced inline.
void INK_3;
