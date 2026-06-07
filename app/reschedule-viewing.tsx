import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import viewingsService from "@/api/services/viewings";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Day = { d: string; n: number; m: string; off?: boolean; tag?: string };
type Slot = { t: string; off?: boolean };

/** Build an ISO datetime from the picked day + slot, rolling to next year
 *  if the resulting date would otherwise be in the past. */
function toISO(day: Day, slot: string): string {
  const monthIdx = Math.max(0, MONTHS.indexOf(day.m));
  const [hh, mm] = slot.split(":").map(Number);
  const now = new Date();
  let year = now.getFullYear();
  let d = new Date(year, monthIdx, day.n, hh, mm, 0, 0);
  if (d.getTime() < now.getTime() - 60_000) {
    year += 1;
    d = new Date(year, monthIdx, day.n, hh, mm, 0, 0);
  }
  return d.toISOString();
}

const DAYS: Day[] = [
  { d: "Sun", n: 1,  m: "Jun" },
  { d: "Mon", n: 2,  m: "Jun", tag: "4 slots" },
  { d: "Tue", n: 3,  m: "Jun" },
  { d: "Wed", n: 4,  m: "Jun", off: true },
  { d: "Thu", n: 5,  m: "Jun" },
  { d: "Fri", n: 6,  m: "Jun", tag: "Busy" },
  { d: "Sat", n: 7,  m: "Jun" },
];

const SLOTS: Slot[] = [
  { t: "09:00" },
  { t: "10:00" },
  { t: "11:30" },
  { t: "13:00" },
  { t: "14:30", off: true },
  { t: "16:00" },
  { t: "17:30" },
];

export default function RescheduleViewingScreen() {
  const params = useLocalSearchParams<{
    viewingId?: string;
    leadId?: string;
    buyer?: string;
    listing?: string;
  }>();
  const buyer = params.buyer ?? "the buyer";
  const listing = params.listing ?? "this listing";
  const viewingId = params.viewingId;

  const [dayIdx, setDayIdx] = useState(1);
  const [slot, setSlot]     = useState("10:00");
  const [note, setNote]     = useState("");
  const [saving, setSaving] = useState(false);

  const selected = DAYS[dayIdx];

  const onConfirm = async () => {
    if (saving) return;
    const successAlert = () =>
      Alert.alert(
        "Reschedule sent",
        `${buyer} will be notified of the new slot: ${selected.d} ${selected.n} ${selected.m} at ${slot}.`,
        [{ text: "OK", onPress: () => router.back() }],
      );

    // Without a real viewingId (legacy mock lead) just acknowledge.
    if (!viewingId) {
      successAlert();
      return;
    }

    setSaving(true);
    try {
      await viewingsService.update(viewingId, { scheduledFor: toISO(selected, slot) });
      successAlert();
    } catch {
      Alert.alert("Couldn’t reschedule", "Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Drag handle */}
      <View className="items-center pt-2 pb-1">
        <View
          style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "#d3cdc1" }}
        />
      </View>

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-ink-2">Cancel</Text>
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Reschedule</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Context */}
        <Text
          className="font-serif text-ink mt-2"
          style={{ fontSize: 24, letterSpacing: -0.5, lineHeight: 26 }}
        >
          New slot for <Text className="font-serif-italic">{buyer}</Text>
        </Text>
        <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
          {listing} · pick a day and time that works.
        </Text>

        {/* Day strip */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Day
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {DAYS.map((d, i) => {
            const on = dayIdx === i;
            return (
              <Pressable
                key={`${d.m}-${d.n}`}
                onPress={() => !d.off && setDayIdx(i)}
                disabled={d.off}
                className="rounded-2xl items-center justify-center"
                style={{
                  width: 64,
                  paddingVertical: 12,
                  backgroundColor: on ? INK : d.off ? "#f0f0f0" : "#ffffff",
                  borderWidth: on ? 0 : 1,
                  borderColor: "#e1dcd3",
                  opacity: d.off ? 0.5 : 1,
                }}
              >
                <Text
                  className="text-[10.5px] font-sans-bold tracking-wider uppercase"
                  style={{ color: on ? "rgba(255,255,255,0.7)" : INK_3 }}
                >
                  {d.d}
                </Text>
                <Text
                  className="font-serif mt-0.5"
                  style={{ fontSize: 20, color: on ? "#ffffff" : INK, letterSpacing: -0.3 }}
                >
                  {d.n}
                </Text>
                {d.tag && !on && (
                  <Text className="text-[9px] font-sans-bold text-primary mt-0.5">
                    {d.tag}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Time slots */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Time
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SLOTS.map((s) => {
            const on = slot === s.t;
            const disabled = !!s.off;
            return (
              <Pressable
                key={s.t}
                onPress={() => !disabled && setSlot(s.t)}
                disabled={disabled}
                className="rounded-full"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: on ? PRIMARY : disabled ? "#f0f0f0" : "#ffffff",
                  borderWidth: on ? 0 : 1,
                  borderColor: "#e1dcd3",
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <Text
                  className="text-[13px] font-sans-bold"
                  style={{ color: on ? "#ffffff" : disabled ? INK_3 : INK_2 }}
                >
                  {s.t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Note */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Note · optional
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
          placeholder='"Apologies for the change — heavier traffic that afternoon than expected."'
          placeholderTextColor={INK_3}
          className="bg-white border border-line rounded-2xl px-4 py-3 text-ink text-[14px]"
          style={{ minHeight: 80 }}
        />
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 28,
        }}
      >
        <Pressable
          onPress={onConfirm}
          disabled={saving}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16, opacity: saving ? 0.6 : 1 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            {saving
              ? "Sending…"
              : `Send new slot · ${selected.d} ${selected.n} ${selected.m} · ${slot}`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
