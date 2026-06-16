import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import usersService, { type UserSettings } from "@/api/services/users";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type Key = keyof Pick<
  UserSettings,
  "notifMessages" | "notifEmail" | "notifSms" | "notifPriceAlerts" | "notifMarketing"
>;

const ROWS: { key: Key; title: string; detail: string }[] = [
  { key: "notifMessages", title: "Messages", detail: "New chat messages from buyers and vendors" },
  { key: "notifEmail", title: "Email", detail: "Important updates by email" },
  { key: "notifSms", title: "SMS", detail: "Time-sensitive alerts by text" },
  { key: "notifPriceAlerts", title: "Activity alerts", detail: "Offers, viewings and listing activity" },
  { key: "notifMarketing", title: "Product updates", detail: "News and tips from PropertyLoop" },
];

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    usersService
      .getSettings()
      .then((s) => on && setSettings(s))
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, []);

  const toggle = async (key: Key) => {
    if (!settings) return;
    const next = !settings[key];
    setSettings({ ...settings, [key]: next }); // optimistic
    try {
      await usersService.updateSettings({ [key]: next });
    } catch {
      setSettings((s) => (s ? { ...s, [key]: !next } : s)); // revert
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : !settings ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[14px] font-sans-bold text-ink">Couldn’t load settings</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <Text className="text-[12.5px] text-ink-3 px-1 mb-3 leading-5">
            Choose how PropertyLoop reaches you. In-app notifications always stay on.
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
            {ROWS.map((r, i) => (
              <View
                key={r.key}
                className="flex-row items-center gap-3 px-3.5 py-3.5"
                style={{ borderBottomWidth: i === ROWS.length - 1 ? 0 : 0.5, borderBottomColor: "#ece6df" }}
              >
                <View className="flex-1">
                  <Text className="text-[13.5px] font-sans-bold text-ink">{r.title}</Text>
                  <Text className="text-[11.5px] text-ink-3 mt-0.5">{r.detail}</Text>
                </View>
                <Switch
                  value={!!settings[r.key]}
                  onValueChange={() => toggle(r.key)}
                  trackColor={{ false: "#cbd5e1", true: PRIMARY }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>
          <Text className="text-[11px] text-ink-3 px-1 mt-3 leading-4" style={{ color: INK_3 }}>
            Changes save automatically.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
