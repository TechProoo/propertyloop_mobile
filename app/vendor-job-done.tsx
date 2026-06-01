import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";

const ESCROW_STEPS = ["Done", "Awaiting confirm", "Paid"];

export default function VendorJobDoneScreen() {
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
          <Text className="font-sans-bold text-ink">₦16,200</Text> lands in your GTBank account
          — usually within 24 hours.
        </Text>

        {/* Escrow status */}
        <View className="mt-5 rounded-2xl px-4 py-4" style={{ backgroundColor: INK }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark" size={15} color="#7ad296" />
              <Text className="text-[12px] font-sans-bold text-white">In escrow</Text>
            </View>
            <Text className="font-serif text-white" style={{ fontSize: 20 }}>
              ₦16,200
            </Text>
          </View>
          <View className="mt-3 flex-row items-center">
            {ESCROW_STEPS.map((label, i, arr) => {
              const done = i === 0;
              return (
                <View key={label} className="flex-row items-center flex-1">
                  <View className="items-center" style={{ width: 24 }}>
                    <View
                      style={{
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: done ? "#7ad296" : "rgba(255,255,255,0.15)",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={12} color={INK} />
                      ) : (
                        <Text className="text-[9px] font-sans-bold text-white">{i + 1}</Text>
                      )}
                    </View>
                    <Text
                      className="text-[9px] font-sans-bold text-center mt-1"
                      style={{ color: "#ffffff", opacity: done ? 1 : 0.5 }}
                    >
                      {label}
                    </Text>
                  </View>
                  {i < arr.length - 1 && (
                    <View
                      style={{
                        flex: 1,
                        height: 2,
                        marginHorizontal: 4,
                        marginBottom: 14,
                        backgroundColor: "rgba(255,255,255,0.15)",
                      }}
                    />
                  )}
                </View>
              );
            })}
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
        <Pressable
          onPress={() => router.push("/conversation/chinwe" as Href)}
          className="rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 15 }}
        >
          <Text className="text-[14px] font-sans-bold text-ink-2">Message customer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

void INK_2;
