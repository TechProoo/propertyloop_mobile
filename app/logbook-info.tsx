import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";

const STEPS = [
  {
    n: "01",
    title: "Work gets logged",
    detail:
      "Every Service Loop job is auto-added — vendor, date, cost, receipt and photos.",
    icon: "shield-checkmark" as const,
  },
  {
    n: "02",
    title: "Owners add their own",
    detail:
      "Did a repair yourself or used your own handyman? Log it manually in seconds.",
    icon: "add-circle-outline" as const,
  },
  {
    n: "03",
    title: "It follows the property",
    detail:
      "When a home is sold or re-let, the logbook stays. Buyers and renters see the full truth.",
    icon: "home-outline" as const,
  },
];

export default function LogbookInfoScreen() {
  const [opening, setOpening] = useState(false);

  // Open the logbook for the first available listing as a live sample.
  const openSample = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const { items } = await listingsService.list({ limit: 1, sort: "newest" });
      const id = items[0]?.id;
      if (id) router.push(`/logbook/${id}` as Href);
      else Alert.alert("No logbook yet", "There are no listings to preview right now.");
    } catch {
      Alert.alert("Couldn’t open logbook", "Please check your connection and try again.");
    } finally {
      setOpening(false);
    }
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
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero with concentric rings */}
        <View
          className="bg-primary-soft rounded-3xl items-center justify-center"
          style={{ height: 180, overflow: "hidden" }}
        >
          {[88, 64, 40].map((s, i) => (
            <View
              key={s}
              style={{
                position: "absolute",
                width: s * 2,
                height: s * 2,
                borderRadius: s,
                borderWidth: 1.5,
                borderColor: PRIMARY,
                opacity: 0.18 + i * 0.1,
              }}
            />
          ))}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: PRIMARY,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="document-text" size={28} color="#ffffff" />
          </View>
        </View>

        <Text
          className="text-[11px] font-sans-bold text-primary tracking-widest uppercase mt-4"
        >
          Property Logbook
        </Text>
        <Text
          className="font-serif text-ink mt-2"
          style={{ fontSize: 30, letterSpacing: -0.6, lineHeight: 33 }}
        >
          Every home,{" "}
          <Text className="font-serif-italic">an honest record</Text>
        </Text>
        <Text className="text-[13.5px] text-ink-2 mt-2 leading-5">
          A permanent digital service history that travels with the property —
          not the owner. Repairs, inspections, who did the work, and what it
          cost.
        </Text>

        {/* Steps */}
        <View className="mt-6 gap-4">
          {STEPS.map((s) => (
            <View key={s.n} className="flex-row gap-3.5">
              <View className="w-11 h-11 rounded-xl bg-primary-soft items-center justify-center">
                <Ionicons name={s.icon} size={20} color={PRIMARY_INK} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-baseline gap-2">
                  <Text
                    className="font-serif text-primary"
                    style={{ fontSize: 14 }}
                  >
                    {s.n}
                  </Text>
                  <Text className="text-[14.5px] font-sans-bold text-ink">
                    {s.title}
                  </Text>
                </View>
                <Text className="text-[13px] text-ink-2 mt-1 leading-5">
                  {s.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Verified vs self-reported */}
        <View
          className="mt-6 bg-white rounded-2xl px-4 py-3.5 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-wider uppercase mb-3">
            Two kinds of entry
          </Text>
          <View className="flex-row items-center gap-2.5 mb-2.5">
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: PRIMARY,
              }}
            />
            <Text className="flex-1 text-[12.5px] text-ink-3">
              <Text className="font-sans-bold text-ink">Verified </Text>—
              done by a Service Loop vendor, receipt attached
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#f0f0f0",
                borderWidth: 2,
                borderColor: "#d3cdc1",
              }}
            />
            <Text className="flex-1 text-[12.5px] text-ink-3">
              <Text className="font-sans-bold text-ink">Self-reported </Text>—
              logged by the owner, unverified
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream"
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 }}
      >
        <Pressable
          onPress={openSample}
          disabled={opening}
          className="bg-primary rounded-full items-center justify-center active:opacity-80"
          style={{ paddingVertical: 16, opacity: opening ? 0.7 : 1, minHeight: 52 }}
        >
          {opening ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-sans-bold text-[15px]">
              View a sample logbook
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
