import { useMemo, useState } from "react";
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
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import vendorsService from "@/api/services/vendors";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Build a 30-day rolling window starting from Jun 1 (the mocked "today").
const TODAY = { y: 2026, m: 5, d: 1 }; // Jun 1, 2026
function buildDays() {
  const out: { key: string; y: number; m: number; d: number; label: string; weekday: string }[] = [];
  // Track an actual date to get weekdays — start from a known anchor.
  // Jun 1 2026 was a Monday.
  const weekdayCycle = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let y = TODAY.y, m = TODAY.m, d = TODAY.d, wd = 0;
  for (let i = 0; i < 35; i++) {
    out.push({
      key: `${y}-${m}-${d}`,
      y, m, d,
      label: `${d} ${MONTHS[m]}`,
      weekday: weekdayCycle[wd],
    });
    d += 1;
    wd = (wd + 1) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    if (d > daysInMonth) {
      d = 1;
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
  }
  return out;
}

export default function VendorBlackoutScreen() {
  const days = useMemo(buildDays, []);
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason]     = useState("");
  const [saving, setSaving]     = useState(false);

  const toggle = (k: string) =>
    setSelected((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));

  const summarise = () => {
    if (selected.length === 0) return null;
    const picked = days.filter((d) => selected.includes(d.key));
    picked.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.m !== b.m) return a.m - b.m;
      return a.d - b.d;
    });
    const first = picked[0];
    const last = picked[picked.length - 1];
    if (picked.length === 1) return first.label;
    if (first.m === last.m) return `${first.d}–${last.d} ${MONTHS[first.m]}`;
    return `${first.label} – ${last.label}`;
  };

  const onSave = async () => {
    if (selected.length === 0) {
      Alert.alert("Pick at least one day", "Tap the days you want to block out.");
      return;
    }
    if (saving) return;
    const dates = days
      .filter((d) => selected.includes(d.key))
      .map((d) => `${d.y}-${String(d.m + 1).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`);
    setSaving(true);
    try {
      await vendorsService.addBlackouts(dates, reason.trim() || undefined);
      Alert.alert(
        "Time off blocked",
        `${summarise()} is now blocked. Customers can't book during this window.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
      setSaving(false);
    }
  };

  // Group the 35 days into weeks of 7 starting Monday.
  const weeks = useMemo(() => {
    const out: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      out.push(days.slice(i, i + 7));
    }
    return out;
  }, [days]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Drag handle */}
        <View className="items-center pt-2 pb-1">
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "#d3cdc1" }} />
        </View>

        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-ink-2">Cancel</Text>
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">Block time off</Text>
          <Pressable onPress={onSave} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-primary">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            className="font-serif text-ink mt-2"
            style={{ fontSize: 24, letterSpacing: -0.5, lineHeight: 26 }}
          >
            Pick days <Text className="font-serif-italic">you can't work</Text>
          </Text>
          <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
            Tap any day to block it. Customers won't see you for those dates.
          </Text>

          {/* Weekday header */}
          <View className="flex-row mt-5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((wd) => (
              <View key={wd} style={{ flex: 1 }} className="items-center">
                <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase">
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="mt-2 gap-1.5">
            {weeks.map((week, wi) => (
              <View key={wi} className="flex-row gap-1.5">
                {week.map((d) => {
                  const on = selected.includes(d.key);
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => toggle(d.key)}
                      className="flex-1 items-center justify-center rounded-xl"
                      style={{
                        aspectRatio: 1,
                        backgroundColor: on ? INK : "#ffffff",
                        borderWidth: on ? 0 : 0.5,
                        borderColor: "#e1dcd3",
                      }}
                    >
                      <Text
                        className="font-serif"
                        style={{
                          fontSize: 16, letterSpacing: -0.3,
                          color: on ? "#ffffff" : INK,
                        }}
                      >
                        {d.d}
                      </Text>
                      {d.d === 1 && (
                        <Text
                          className="text-[9px] font-sans-bold mt-0.5"
                          style={{ color: on ? "rgba(255,255,255,0.7)" : INK_3 }}
                        >
                          {MONTHS[d.m]}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Summary */}
          <View className="mt-5 rounded-2xl px-4 py-3" style={{ backgroundColor: "#f0f0f0" }}>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
              Blocking
            </Text>
            <Text className="font-serif text-ink mt-1" style={{ fontSize: 18, letterSpacing: -0.3 }}>
              {selected.length === 0
                ? "Nothing yet"
                : `${selected.length} day${selected.length === 1 ? "" : "s"} · ${summarise()}`}
            </Text>
          </View>

          {/* Optional reason */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
            Reason · optional
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Out of state for a wedding"
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[14px]"
          />
        </ScrollView>

        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
        >
          <Pressable
            onPress={onSave}
            disabled={selected.length === 0}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              Block {selected.length === 0 ? "selected days" : `${selected.length} day${selected.length === 1 ? "" : "s"}`}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

void PRIMARY;
