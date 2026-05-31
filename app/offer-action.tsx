import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { OFFER_ACTION } from "@/mocks/linked";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DECLINE = "#b3261e";

function fmt(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

export default function OfferActionScreen() {
  const o = OFFER_ACTION;
  const [counter, setCounter] = useState(fmt(o.initialCounter));

  const onSend = () =>
    Alert.alert(
      "Send counter?",
      `Send a counter-offer of ₦${counter} on ${o.home}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => router.back(),
        },
      ],
    );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Drag handle */}
      <View className="items-center pt-2 pb-1">
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#d3cdc1",
          }}
        />
      </View>

      <View className="px-5 pt-3">
        {/* Property mini */}
        <Text
          className="text-[11px] font-sans-bold text-primary tracking-widest uppercase"
        >
          Counter offer
        </Text>
        <Text className="text-[14px] font-sans-bold text-ink mt-1.5">
          {o.home}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">
          {o.agent} countered at {o.theirCounter}
        </Text>

        {/* Counter input */}
        <View
          className="mt-5 bg-cream-2 rounded-2xl px-4 py-4 flex-row items-baseline gap-1.5"
          style={{ borderWidth: 1.5, borderColor: INK }}
        >
          <Text
            className="font-serif text-ink"
            style={{ fontSize: 28, lineHeight: 32 }}
          >
            ₦
          </Text>
          <TextInput
            value={counter}
            onChangeText={(t) => setCounter(fmt(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={INK_3}
            className="flex-1 font-serif text-ink"
            style={{ fontSize: 30, padding: 0, letterSpacing: -0.5 }}
          />
        </View>
        <Text className="text-[11.5px] text-ink-3 mt-2">
          Splits the difference · ₦1.5M apart
        </Text>

        {/* Quick chips */}
        <View className="flex-row gap-2 mt-3">
          <Pressable
            onPress={() => setCounter(fmt("75500000"))}
            className="px-3.5 py-2 rounded-full bg-white border-line active:opacity-80"
            style={{ borderWidth: 1 }}
          >
            <Text className="text-[12px] font-sans-bold text-ink-2">
              Match {o.theirCounter}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const cur = Number(counter.replace(/,/g, "")) || 0;
              setCounter(fmt(String(cur + 1000000)));
            }}
            className="px-3.5 py-2 rounded-full bg-white border-line active:opacity-80"
            style={{ borderWidth: 1 }}
          >
            <Text className="text-[12px] font-sans-bold text-ink-2">+₦1M</Text>
          </Pressable>
        </View>

        {/* Mini ladder */}
        <View
          className="mt-4 bg-white rounded-2xl px-4 py-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <LadderRow label="Asking" value={o.asking} />
          <LadderRow label="Their counter" value={o.theirCounter} />
          <LadderRow label="Your counter" value={`₦${counter}`} highlight />
          <LadderRow label="Your first offer" value={o.yourFirst} muted last />
        </View>

        {/* Actions */}
        <View className="mt-5 gap-2.5">
          <Pressable
            onPress={onSend}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 15 }}
          >
            <Text className="text-white font-sans-bold text-[14.5px]">
              Send counter · ₦{counter}
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Accept counter?",
                `Accept the seller's ${o.theirCounter} counter on ${o.home}? This kicks off the purchase process.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Accept",
                    onPress: () => router.back(),
                  },
                ],
              )
            }
            className="bg-primary-soft rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 15 }}
          >
            <Text
              className="font-sans-bold text-[14.5px]"
              style={{ color: PRIMARY_INK }}
            >
              Accept {o.theirCounter}
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Decline counter?",
                `Decline the ${o.theirCounter} counter on ${o.home}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Decline",
                    style: "destructive",
                    onPress: () => router.back(),
                  },
                ],
              )
            }
            className="rounded-full items-center active:opacity-70 bg-white"
            style={{
              paddingVertical: 14,
              borderWidth: 1.5,
              borderColor: DECLINE,
            }}
          >
            <Text
              className="font-sans-bold text-[14.5px]"
              style={{ color: DECLINE }}
            >
              Decline
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-center gap-1.5 mt-3">
          <Ionicons name="information-circle-outline" size={12} color={INK_3} />
          <Text className="text-[11px] text-ink-3 font-sans-medium">
            Non-binding · you and the seller settle directly
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LadderRow({
  label,
  value,
  highlight,
  muted,
  last,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between py-2"
      style={{
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: "#ece6df",
      }}
    >
      <Text className="text-[11.5px] font-sans-semibold text-ink-3">
        {label}
      </Text>
      <Text
        className="font-sans-bold"
        style={{
          fontSize: highlight ? 15 : 13,
          color: highlight ? PRIMARY : muted ? INK_3 : INK_2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
