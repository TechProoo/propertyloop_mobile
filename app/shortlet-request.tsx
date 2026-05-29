import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

// Mock pulled from the shortlet detail screen. Replace with real lookup.
const REQUEST = {
  imageSeed: "short-1",
  title: "Marlin Studios · 1-bed",
  area: "V.I. · ⭐ 4.92 · 184 stays",
  host: "Folake",
  trip: [
    { label: "Dates", value: "Fri 12 Jun → Sun 14 Jun · 2 nights" },
    { label: "Guests", value: "2 adults" },
    { label: "Check-in", value: "3:00 PM · self check-in" },
  ],
  priceLines: [
    { label: "₦85,000 × 2 nights", value: "₦170,000" },
    { label: "Cleaning fee", value: "₦12,000" },
  ],
  total: "₦182,000",
};

export default function ShortletRequestScreen() {
  useLocalSearchParams<{ shortletId?: string }>();
  const [note, setNote] = useState("");

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
            Request to book
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Trip summary */}
          <View
            className="flex-row gap-3 p-3 bg-white rounded-2xl border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Image
              source={`https://picsum.photos/seed/${REQUEST.imageSeed}/200/200`}
              style={{ width: 70, height: 70, borderRadius: 12 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase"
                style={{ color: "#5a3a8c" }}
              >
                Shortlet
              </Text>
              <Text className="text-[14px] font-sans-bold text-ink mt-0.5">
                {REQUEST.title}
              </Text>
              <Text className="text-xs text-ink-3">{REQUEST.area}</Text>
            </View>
          </View>

          {/* Your trip */}
          <SectionLabel className="mt-5">Your trip</SectionLabel>
          <View
            className="bg-white rounded-2xl overflow-hidden mt-2 border-line"
            style={{ borderWidth: 0.5 }}
          >
            {REQUEST.trip.map((t, i) => (
              <TripRow
                key={t.label}
                label={t.label}
                value={t.value}
                last={i === REQUEST.trip.length - 1}
              />
            ))}
          </View>

          {/* Price summary */}
          <SectionLabel className="mt-5">Price summary</SectionLabel>
          <View
            className="mt-2 bg-white rounded-2xl px-4 py-3.5 border-line"
            style={{ borderWidth: 0.5 }}
          >
            {REQUEST.priceLines.map((p) => (
              <PriceLine key={p.label} label={p.label} value={p.value} />
            ))}
            <View
              className="my-2.5"
              style={{ height: 0.5, backgroundColor: "#e1dcd3" }}
            />
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[14px] font-sans-bold text-ink">
                Total · NGN
              </Text>
              <Text
                className="font-serif text-ink"
                style={{ fontSize: 22, letterSpacing: -0.4 }}
              >
                {REQUEST.total}
              </Text>
            </View>
            <Text className="text-[11px] text-ink-3 mt-2.5 leading-4">
              You'll pay{" "}
              <Text className="font-sans-bold text-ink-2">
                {REQUEST.host} directly
              </Text>{" "}
              by bank transfer after she confirms.
            </Text>
          </View>

          {/* Message to host */}
          <SectionLabel className="mt-5">Message to {REQUEST.host}</SectionLabel>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder='"Hi Folake — visiting for a friend’s wedding nearby. Quiet pair of guests, no late nights."'
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px] mt-2"
            style={{
              minHeight: 70,
              fontFamily: "PlayfairDisplay_400Regular_Italic",
            }}
            textAlignVertical="top"
          />

          {/* How requests work */}
          <View className="mt-4 bg-primary-soft rounded-2xl px-3.5 py-3.5 flex-row gap-2.5">
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={PRIMARY_INK}
              style={{ marginTop: 1 }}
            />
            <View className="flex-1">
              <Text
                className="text-[12.5px] font-sans-bold"
                style={{ color: PRIMARY_INK }}
              >
                How requests work
              </Text>
              <Text
                className="text-[11.5px] mt-0.5 leading-4"
                style={{ color: PRIMARY_INK, opacity: 0.75 }}
              >
                {REQUEST.host} reviews and confirms within 24 hrs. Payment and
                arrival are arranged directly with her — PropertyLoop doesn't
                hold funds.
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
              Send request to {REQUEST.host}
            </Text>
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-1.5">
            You won't be charged — host confirms within 24 hrs
          </Text>
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

function TripRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between px-3.5 py-3"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
      }}
    >
      <Text className="text-xs font-sans-semibold text-ink-3">{label}</Text>
      <Text className="text-[13px] font-sans-bold text-ink">{value}</Text>
    </View>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-1">
      <Text className="text-[13px] text-ink-2">{label}</Text>
      <Text className="text-[13px] font-sans-semibold text-ink">{value}</Text>
    </View>
  );
}
