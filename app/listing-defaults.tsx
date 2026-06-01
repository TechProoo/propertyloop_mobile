import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const RESPONSE_TIMES = [
  { id: "instant", label: "Instant", detail: "Within 5 min" },
  { id: "1h",      label: "Within 1h", detail: "Most reliable" },
  { id: "same",    label: "Same day", detail: "Default" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

const DEFAULT_HOURS = "9:00 AM – 6:00 PM";

export default function ListingDefaultsScreen() {
  const [responseTime, setResponseTime] = useState("1h");
  const [defaultArea, setDefaultArea]   = useState("Lekki Phase 1, Lagos");
  const [hours, setHours]               = useState(DEFAULT_HOURS);
  const [openDays, setOpenDays]         = useState<Day[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [autoReply, setAutoReply]       = useState(true);
  const [autoReplyMsg, setAutoReplyMsg] = useState(
    "Thanks for reaching out — I'll get back to you shortly. For urgent viewings, please call or WhatsApp.",
  );
  const [requireVerified, setRequireVerified] = useState(false);

  const toggleDay = (d: Day) =>
    setOpenDays((arr) =>
      arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d],
    );

  const onSave = () => {
    if (!defaultArea.trim() || !hours.trim()) {
      Alert.alert("Missing info", "Default area and hours can't be empty.");
      return;
    }
    Alert.alert(
      "Defaults saved",
      "New listings will use these as starting values.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">
            Listing defaults
          </Text>
          <Pressable onPress={onSave} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-primary">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-[13px] text-ink-2 mt-2 leading-5">
            These pre-fill every new listing you publish and govern how buyers
            see your availability. Per-listing overrides still win.
          </Text>

          {/* Response time */}
          <Label className="mt-6">Stated response time</Label>
          <View className="gap-2 mt-2">
            {RESPONSE_TIMES.map((r) => {
              const on = responseTime === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setResponseTime(r.id)}
                  className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3"
                  style={{
                    backgroundColor: on ? "#e3efe7" : "#ffffff",
                    borderWidth: on ? 1.5 : 1,
                    borderColor: on ? PRIMARY : "#e1dcd3",
                  }}
                >
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: on ? PRIMARY : "transparent",
                      borderWidth: on ? 0 : 1.5,
                      borderColor: "#d3cdc1",
                    }}
                  >
                    {on && (
                      <View
                        style={{
                          width: 7, height: 7, borderRadius: 7,
                          backgroundColor: "#ffffff",
                        }}
                      />
                    )}
                  </View>
                  <Text className="flex-1 text-[13.5px] font-sans-bold text-ink">
                    {r.label}
                  </Text>
                  <Text className="text-[11.5px] text-ink-3">{r.detail}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Default area */}
          <Label className="mt-6">Default area</Label>
          <TextInput
            value={defaultArea}
            onChangeText={setDefaultArea}
            autoCapitalize="words"
            placeholder="e.g. Lekki Phase 1, Lagos"
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] mt-1.5"
          />
          <Text className="text-[11.5px] text-ink-3 mt-1.5">
            Pre-selected when you start a new listing.
          </Text>

          {/* Viewing hours */}
          <Label className="mt-6">Default viewing hours</Label>
          <TextInput
            value={hours}
            onChangeText={setHours}
            placeholder="e.g. 9:00 AM – 6:00 PM"
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] mt-1.5"
          />

          {/* Open days */}
          <Label className="mt-6">Open days</Label>
          <View className="flex-row gap-1.5 mt-1.5 flex-wrap">
            {DAYS.map((d) => {
              const on = openDays.includes(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleDay(d)}
                  className="rounded-xl items-center justify-center"
                  style={{
                    width: 44, height: 44,
                    backgroundColor: on ? INK : "#ffffff",
                    borderWidth: on ? 0 : 1,
                    borderColor: "#e1dcd3",
                  }}
                >
                  <Text
                    className="text-[11.5px] font-sans-bold"
                    style={{ color: on ? "#ffffff" : INK_2 }}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Auto-reply */}
          <View
            className="mt-6 bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3 border-line"
            style={{ borderWidth: 1 }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#e3efe7" }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold text-ink">
                Auto-reply to new inquiries
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-0.5">
                First message sent within seconds
              </Text>
            </View>
            <Switch
              value={autoReply}
              onValueChange={setAutoReply}
              trackColor={{ false: "#cbd5e1", true: PRIMARY }}
              thumbColor="#ffffff"
            />
          </View>
          {autoReply && (
            <TextInput
              value={autoReplyMsg}
              onChangeText={setAutoReplyMsg}
              multiline
              textAlignVertical="top"
              placeholder="Your auto-reply message"
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3 text-ink text-[14px] mt-2"
              style={{ minHeight: 90 }}
            />
          )}

          {/* Verified only */}
          <View
            className="mt-3 bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3 border-line"
            style={{ borderWidth: 1 }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#f5ead4" }}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#6b4a16" />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold text-ink">
                Only accept verified buyers
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-0.5">
                Filters out inquiries from un-KYC'd accounts
              </Text>
            </View>
            <Switch
              value={requireVerified}
              onValueChange={setRequireVerified}
              trackColor={{ false: "#cbd5e1", true: PRIMARY }}
              thumbColor="#ffffff"
            />
          </View>
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
            onPress={onSave}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              Save defaults
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}>
      {children}
    </Text>
  );
}
