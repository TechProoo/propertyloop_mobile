import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  BOOKING_ADDRESS,
  SERVICE_TIERS,
  WHEN_CHIPS,
} from "@/mocks/services";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

// Stub vendor — backend would look up by vendorId param.
const VENDOR = {
  initials: "SC",
  name: "Sparkle & Co.",
  category: "Cleaning",
  rating: "4.9",
  jobs: 287,
};

export default function BookServiceScreen() {
  useLocalSearchParams<{ vendorId?: string }>();
  const [tierId, setTierId] = useState(SERVICE_TIERS[0].id);
  const [whenId, setWhenId] = useState("tomorrow");
  const [note, setNote] = useState("");

  const selectedTier = useMemo(
    () => SERVICE_TIERS.find((t) => t.id === tierId) ?? SERVICE_TIERS[0],
    [tierId],
  );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center gap-2.5 px-5 pt-1 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">
            Book a service
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Vendor pin */}
          <View
            className="flex-row gap-3 p-3 bg-white rounded-2xl items-center border-line"
            style={{ borderWidth: 0.5 }}
          >
            <PLAvatar initials={VENDOR.initials} size={48} tone="primary" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[14px] font-sans-bold text-ink">
                  {VENDOR.name}
                </Text>
                <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
              </View>
              <Text className="text-xs text-ink-3">
                {VENDOR.category} · ⭐ {VENDOR.rating} · {VENDOR.jobs} jobs
              </Text>
            </View>
          </View>

          {/* Heading */}
          <Text
            className="font-serif text-ink mt-5"
            style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.5 }}
          >
            What needs <Text className="font-serif-italic">doing</Text>?
          </Text>

          {/* Service tier */}
          <View className="mt-2.5 gap-2">
            {SERVICE_TIERS.map((t) => {
              const isOn = tierId === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTierId(t.id)}
                  className={`flex-row items-center gap-2.5 rounded-2xl px-3.5 py-3.5 ${
                    isOn ? "bg-primary-soft" : "bg-white"
                  }`}
                  style={{
                    borderWidth: isOn ? 1.5 : 1,
                    borderColor: isOn ? PRIMARY : "#e1dcd3",
                  }}
                >
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isOn ? PRIMARY : "transparent",
                      borderWidth: isOn ? 0 : 1.5,
                      borderColor: "#e1dcd3",
                    }}
                  >
                    {isOn && (
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 7,
                          backgroundColor: "white",
                        }}
                      />
                    )}
                  </View>
                  <Text className="flex-1 text-[13.5px] font-sans-bold text-ink">
                    {t.label}
                  </Text>
                  <Text
                    className="font-serif text-ink"
                    style={{ fontSize: 17, letterSpacing: -0.3 }}
                  >
                    {t.priceLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Where */}
          <SectionLabel className="mt-5">Where</SectionLabel>
          <View
            className="mt-2 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5 border-line"
            style={{ borderWidth: 1 }}
          >
            <Ionicons name="location-outline" size={16} color={PRIMARY} />
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold text-ink">
                {BOOKING_ADDRESS.unit}
              </Text>
              <Text className="text-[11.5px] text-ink-3">
                {BOOKING_ADDRESS.detail}
              </Text>
            </View>
          </View>

          {/* When */}
          <SectionLabel className="mt-5">When</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 8 }}
          >
            {WHEN_CHIPS.map((s) => {
              const isOn = whenId === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setWhenId(s.id)}
                  className={`rounded-2xl ${isOn ? "bg-ink" : "bg-white"}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: isOn ? 0 : 1,
                    borderColor: "#e1dcd3",
                  }}
                >
                  <Text
                    className={`text-[13px] font-sans-bold ${
                      isOn ? "text-white" : "text-ink"
                    }`}
                  >
                    {s.date}
                  </Text>
                  <Text
                    className={`text-[10.5px] font-sans-semibold mt-0.5 ${
                      isOn ? "text-white/70" : "text-ink-3"
                    }`}
                  >
                    {s.detail}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Note */}
          <SectionLabel className="mt-5">Notes for vendor</SectionLabel>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder='"Building gate code 4-2-1-8. Please bring extra microfibre cloths."'
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px] mt-2"
            style={{
              minHeight: 60,
              fontFamily: "PlayfairDisplay_400Regular_Italic",
            }}
            textAlignVertical="top"
          />

          {/* Dark escrow summary */}
          <View className="mt-4 bg-ink rounded-2xl px-3.5 py-3.5">
            <View className="flex-row items-baseline justify-between">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                You'll pay
              </Text>
              <Text
                className="font-serif text-white"
                style={{ fontSize: 24, letterSpacing: -0.5 }}
              >
                {selectedTier.priceLabel}
              </Text>
            </View>
            <View className="flex-row gap-1.5 mt-2.5 items-start">
              <Ionicons
                name="shield-checkmark"
                size={13}
                color="#7ad296"
                style={{ marginTop: 2 }}
              />
              <Text
                className="flex-1 text-[11.5px] leading-4"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Held in PropertyLoop escrow. Released to {VENDOR.name} after
                you confirm the job is done. You can dispute before release.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 border-line"
          style={{
            backgroundColor: "rgba(245,240,235,0.96)",
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 30,
          }}
        >
          <Pressable
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 17 }}
            onPress={() => router.back()}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              Pay {selectedTier.priceLabel} to escrow & book
            </Text>
          </Pressable>
          <View className="flex-row items-center justify-center gap-1 mt-1.5">
            <Ionicons name="shield-checkmark" size={11} color={INK_3} />
            <Text className="text-[10.5px] text-ink-3">
              Secure checkout · Paystack
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}
