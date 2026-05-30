import { useState } from "react";
import {
  Alert,
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
import { PLAvatar } from "@/components/brand/PLAvatar";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";

type Day = { d: string; n: number; off?: boolean; tag?: string };
type Slot = { t: string; off?: boolean };
type Mode = "in-person" | "video";

const DATES: Day[] = [
  { d: "Thu", n: 28, off: true },
  { d: "Fri", n: 29 },
  { d: "Sat", n: 30, tag: "4 slots" },
  { d: "Sun", n: 31 },
  { d: "Mon", n: 1 },
  { d: "Tue", n: 2 },
  { d: "Wed", n: 3 },
];

const SLOTS: Slot[] = [
  { t: "09:00", off: true },
  { t: "10:00" },
  { t: "11:30" },
  { t: "13:00" },
  { t: "14:30", off: true },
  { t: "16:00" },
];

export default function BookViewingScreen() {
  useLocalSearchParams<{ listingId?: string }>(); // wire-up only, mocked
  const [dateIdx, setDateIdx] = useState(2);
  const [slot, setSlot] = useState("10:00");
  const [mode, setMode] = useState<Mode>("in-person");
  const [note, setNote] = useState("");

  const selectedDate = DATES[dateIdx];

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
            <Ionicons name="close" size={18} color={INK_2} />
          </Pressable>
          <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">
            Book a viewing
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Property mini-card */}
          <View
            className="flex-row gap-3 p-2.5 bg-white rounded-2xl items-center border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Image
              source="https://picsum.photos/seed/sand-2/200/200"
              style={{ width: 56, height: 56, borderRadius: 10 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-[14px] font-sans-bold text-ink">
                Sandbridge Court · 3-bed
              </Text>
              <Text className="text-xs text-ink-3 mt-0.5">
                ₦4.8M/yr · Lekki Phase 1
              </Text>
            </View>
            <PLAvatar initials="CN" size={32} tone="accent" />
          </View>

          {/* Heading */}
          <Text
            className="font-serif text-ink mt-5.5"
            style={{ fontSize: 26, lineHeight: 28, marginTop: 22 }}
          >
            When works <Text className="font-serif-italic">for you</Text>?
          </Text>
          <Text className="text-[13px] text-ink-2 mt-1 leading-5">
            Chinwe usually replies within 20 minutes.
          </Text>

          {/* Month strip */}
          <View
            className="flex-row items-center justify-between mt-4"
            style={{ paddingHorizontal: 4 }}
          >
            <Text className="font-serif text-[20px] text-ink">May 2026</Text>
            <View className="flex-row gap-1.5">
              <Pressable
                onPress={() =>
                  Alert.alert("Calendar", "Month navigation coming soon.")
                }
                className="w-[30px] h-[30px] rounded-full bg-cream-2 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={14} color={INK_2} />
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert("Calendar", "Month navigation coming soon.")
                }
                className="w-[30px] h-[30px] rounded-full bg-cream-2 items-center justify-center"
              >
                <Ionicons name="chevron-forward" size={14} color={INK_2} />
              </Pressable>
            </View>
          </View>

          {/* Date row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
          >
            {DATES.map((d, i) => {
              const selected = dateIdx === i;
              return (
                <Pressable
                  key={d.n}
                  onPress={() => !d.off && setDateIdx(i)}
                  disabled={d.off}
                  className={`rounded-2xl items-center border-line ${
                    selected ? "bg-ink" : "bg-white"
                  }`}
                  style={{
                    width: 56,
                    paddingVertical: 9,
                    paddingHorizontal: 0,
                    borderWidth: selected ? 0 : 1,
                    opacity: d.off ? 0.35 : 1,
                  }}
                >
                  <Text
                    className={`text-[10px] font-sans-bold tracking-wider uppercase ${
                      selected ? "text-white/70" : "text-ink/60"
                    }`}
                  >
                    {d.d}
                  </Text>
                  <Text
                    className={`font-serif ${selected ? "text-white" : "text-ink"}`}
                    style={{ fontSize: 19, letterSpacing: -0.4 }}
                  >
                    {d.n}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Available slots */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2.5">
            Available {selectedDate.d} {selectedDate.n} May
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SLOTS.map((s) => {
              const selected = slot === s.t;
              const cellWidth = "30.5%"; // 3 per row with gaps
              return (
                <Pressable
                  key={s.t}
                  onPress={() => !s.off && setSlot(s.t)}
                  disabled={s.off}
                  className={`rounded-xl items-center border-line ${
                    selected ? "bg-primary" : "bg-white"
                  }`}
                  style={{
                    width: cellWidth,
                    paddingVertical: 11,
                    borderWidth: selected ? 0 : 1,
                    opacity: s.off ? 0.35 : 1,
                  }}
                >
                  <Text
                    className={`text-[14px] font-sans-bold ${
                      selected ? "text-white" : "text-ink"
                    }`}
                    style={{ textDecorationLine: s.off ? "line-through" : "none" }}
                  >
                    {s.t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Mode */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2.5">
            How would you like to view?
          </Text>
          <View className="flex-row gap-2">
            <ModeCard
              label="In person"
              detail="Meet at the home"
              selected={mode === "in-person"}
              onPress={() => setMode("in-person")}
            />
            <ModeCard
              label="Video tour"
              detail="Live walkthrough on WhatsApp"
              selected={mode === "video"}
              onPress={() => setMode("video")}
            />
          </View>

          {/* Note */}
          <View className="flex-row items-baseline gap-1 mt-5 mb-2">
            <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase">
              Note to Chinwe
            </Text>
            <Text className="text-[13px] font-sans-medium text-ink-3 tracking-wider">
              · optional
            </Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder='"Bringing my husband. Could we also see the rooftop while we’re there?"'
            placeholderTextColor="#7f857f"
            className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px]"
            style={{ minHeight: 70, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
            textAlignVertical="top"
          />
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
              Request viewing · {selectedDate.d} {selectedDate.n} May, {slot}
            </Text>
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-1.5">
            You'll get a confirmation from the agent
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeCard({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-2xl px-3 py-3 ${
        selected ? "bg-primary-soft" : "bg-white"
      }`}
      style={{
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? PRIMARY : "#e1dcd3",
      }}
    >
      <Text className="text-[13px] font-sans-bold text-ink">{label}</Text>
      <Text className="text-[11px] text-ink-3 mt-0.5 leading-4">{detail}</Text>
    </Pressable>
  );
}
