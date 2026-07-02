import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import viewingsService from "@/api/services/viewings";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The bookable times we offer. A day is "Busy" once all of these are taken
// (or in the past). That's the real answer to "how many slots before busy?".
const SLOT_TIMES = ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];
const DAYS_AHEAD = 14;

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function slotDate(day: Date, hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const x = new Date(day);
  x.setHours(hh, mm, 0, 0);
  return x;
}
function hhmmOf(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function RescheduleViewingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    viewingId?: string;
    leadId?: string;
    buyer?: string;
    listing?: string;
  }>();
  const buyer = params.buyer ?? "the buyer";
  const listing = params.listing ?? "this listing";
  const viewingId = params.viewingId;

  // Real calendar: the next N days starting today (no more frozen "June").
  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);
  // Snapshot "now" once so the past-slot check is stable across renders.
  const now = useMemo(() => Date.now(), []);

  const [booked, setBooked] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Pull the agent's own upcoming viewings and index the taken times by day —
  // an agent can't be at two viewings at once, so those slots are unavailable.
  useEffect(() => {
    let on = true;
    viewingsService
      .listForAgent({ upcoming: true, limit: 200 })
      .then((res) => {
        if (!on) return;
        const map = new Map<string, Set<string>>();
        for (const v of res.items) {
          if (v.id === viewingId) continue; // the booking we're moving
          if (v.status !== "PENDING" && v.status !== "CONFIRMED") continue;
          const d = new Date(v.scheduledFor);
          if (Number.isNaN(d.getTime())) continue;
          const k = dayKey(d);
          if (!map.has(k)) map.set(k, new Set());
          map.get(k)!.add(hhmmOf(d));
        }
        setBooked(map);
      })
      .catch(() => {
        /* couldn't load — treat everything as open rather than block the agent */
      })
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [viewingId]);

  const slotStateFor = useCallback(
    (day: Date) => {
      const taken = booked.get(dayKey(day));
      return SLOT_TIMES.map((t) => ({
        t,
        off: slotDate(day, t).getTime() < now || (taken?.has(t) ?? false),
      }));
    },
    [booked, now],
  );

  const availableCountFor = useCallback(
    (day: Date) => slotStateFor(day).filter((s) => !s.off).length,
    [slotStateFor],
  );

  // Once availability resolves, land on the first day + time that's actually open.
  useEffect(() => {
    if (loading) return;
    const first = days.findIndex((d) => availableCountFor(d) > 0);
    const idx = first === -1 ? 0 : first;
    setDayIdx(idx);
    setSlot(slotStateFor(days[idx]).find((s) => !s.off)?.t ?? null);
  }, [loading, days, availableCountFor, slotStateFor]);

  const selectedDay = days[dayIdx];
  const slots = slotStateFor(selectedDay);

  const pickDay = (i: number) => {
    setDayIdx(i);
    setSlot(slotStateFor(days[i]).find((s) => !s.off)?.t ?? null);
  };

  const selectedLabel = `${WEEKDAYS[selectedDay.getDay()]} ${selectedDay.getDate()} ${MONTHS[selectedDay.getMonth()]}`;

  const onConfirm = async () => {
    if (saving || !slot) return;
    const successAlert = () =>
      Alert.alert(
        "Reschedule sent",
        `${buyer} will be notified of the new slot: ${selectedLabel} at ${slot}.`,
        [{ text: "OK", onPress: () => router.back() }],
      );

    // Without a real viewingId (legacy mock lead) just acknowledge.
    if (!viewingId) {
      successAlert();
      return;
    }

    setSaving(true);
    try {
      await viewingsService.update(viewingId, {
        scheduledFor: slotDate(selectedDay, slot).toISOString(),
        ...(note.trim() ? { notes: note.trim() } : {}),
      });
      successAlert();
    } catch {
      Alert.alert("Couldn’t reschedule", "Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
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
        <View className="flex-row items-center justify-between mt-6 mb-2">
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
            Day
          </Text>
          {loading && (
            <Text className="text-[10.5px] font-sans-semibold text-ink-3">
              Checking your calendar…
            </Text>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {days.map((d, i) => {
            const on = dayIdx === i;
            const avail = availableCountFor(d);
            const full = avail === 0;
            const tag = full
              ? "Busy"
              : avail < SLOT_TIMES.length
                ? `${avail} left`
                : undefined;
            return (
              <Pressable
                key={dayKey(d)}
                onPress={() => !full && pickDay(i)}
                disabled={full}
                className="rounded-2xl items-center justify-center"
                style={{
                  width: 64,
                  paddingVertical: 12,
                  backgroundColor: on ? INK : full ? "#f0f0f0" : "#ffffff",
                  borderWidth: on ? 0 : 1,
                  borderColor: "#e1dcd3",
                  opacity: full ? 0.5 : 1,
                }}
              >
                <Text
                  className="text-[10.5px] font-sans-bold tracking-wider uppercase"
                  style={{ color: on ? "rgba(255,255,255,0.7)" : INK_3 }}
                >
                  {WEEKDAYS[d.getDay()]}
                </Text>
                <Text
                  className="font-serif mt-0.5"
                  style={{ fontSize: 20, color: on ? "#ffffff" : INK, letterSpacing: -0.3 }}
                >
                  {d.getDate()}
                </Text>
                {tag && !on && (
                  <Text
                    className="text-[9px] font-sans-bold mt-0.5"
                    style={{ color: full ? INK_3 : PRIMARY }}
                  >
                    {tag}
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
        {availableCountFor(selectedDay) === 0 ? (
          <Text className="text-[13px] text-ink-3">
            No open times on {selectedLabel}. Try another day.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {slots.map((s) => {
              const on = slot === s.t;
              return (
                <Pressable
                  key={s.t}
                  onPress={() => !s.off && setSlot(s.t)}
                  disabled={s.off}
                  className="rounded-full"
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: on ? PRIMARY : s.off ? "#f0f0f0" : "#ffffff",
                    borderWidth: on ? 0 : 1,
                    borderColor: "#e1dcd3",
                    opacity: s.off ? 0.5 : 1,
                  }}
                >
                  <Text
                    className="text-[13px] font-sans-bold"
                    style={{ color: on ? "#ffffff" : s.off ? INK_3 : INK_2 }}
                  >
                    {s.t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

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
          paddingBottom: Math.max(insets.bottom, 20) + 10,
        }}
      >
        <Pressable
          onPress={onConfirm}
          disabled={saving || !slot}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16, opacity: saving || !slot ? 0.6 : 1 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            {saving
              ? "Sending…"
              : slot
                ? `Send new slot · ${selectedLabel} · ${slot}`
                : "No open slots — pick another day"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
