import { Pressable, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const WHILE_YOU_WAIT = [
  { id: "menu", icon: "list-outline"      as const, title: "Add more services",     detail: "A fuller menu wins more jobs", href: "/vendor-menu" },
  { id: "avail",icon: "calendar-outline"  as const, title: "Set your availability", detail: "Tell us when you work",        href: "/vendor-availability" },
];

export default function VendorSubmittedScreen() {
  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-6 pt-5">
          {/* Hero */}
          <View
            className="rounded-3xl items-center justify-center"
            style={{ height: 220, backgroundColor: "#e3efe7", overflow: "hidden" }}
          >
            {[100, 72, 44].map((s, i) => (
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
                width: 64, height: 64, borderRadius: 18,
                backgroundColor: PRIMARY,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons name="shield-checkmark" size={30} color="#ffffff" />
            </View>
          </View>

          <Text
            className="text-[11px] font-sans-bold text-primary tracking-widest uppercase mt-6"
          >
            Under review
          </Text>
          <Text
            className="font-serif text-ink mt-2"
            style={{ fontSize: 30, letterSpacing: -0.6, lineHeight: 33 }}
          >
            You're <Text className="font-serif-italic">almost live</Text>
          </Text>
          <Text className="text-[13.5px] text-ink-2 mt-2 leading-5">
            We're verifying your ID and skill proof. Most vendors are approved within{" "}
            <Text className="font-sans-bold text-ink">24 hours</Text> — we'll notify you the
            moment you can take bookings.
          </Text>

          <View
            className="mt-5 rounded-2xl p-4 border-line"
            style={{ borderWidth: 0.5, backgroundColor: "#ffffff" }}
          >
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-3">
              While you wait
            </Text>
            <View className="gap-3">
              {WHILE_YOU_WAIT.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => router.push(w.href as Href)}
                  className="flex-row items-center gap-3 active:opacity-80"
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: "#ece6df" }}
                  >
                    <Ionicons name={w.icon} size={18} color={INK_2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13.5px] font-sans-bold text-ink">{w.title}</Text>
                    <Text className="text-[11.5px] text-ink-3 mt-0.5">{w.detail}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={INK_3} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View className="px-5 pb-8 pt-3">
          <Pressable
            onPress={() => router.replace("/(vendor-tabs)" as Href)}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 17 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">Go to dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
