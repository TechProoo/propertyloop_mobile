import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  NOTIFICATIONS,
  NOTIF_ICON,
  type Notif,
} from "@/mocks/buyer-extra";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TONE_BG: Record<string, string> = {
  primary: "#e3efe7",
  accent:  "#f5ead4",
  neutral: "#ece6df",
};
const TONE_FG: Record<string, string> = {
  primary: PRIMARY_INK,
  accent:  ACCENT_INK,
  neutral: INK_2,
};

const TABS = ["All", "Unread"] as const;
type TabId = (typeof TABS)[number];

export default function NotificationsScreen() {
  const [tab, setTab] = useState<TabId>("All");
  const [items, setItems] = useState<Notif[]>(NOTIFICATIONS);

  const filtered = tab === "Unread" ? items.filter((n) => n.unread) : items;
  const unreadCount = items.filter((n) => n.unread).length;

  const markAllRead = () =>
    setItems((arr) => arr.map((n) => ({ ...n, unread: false })));

  const onTap = (n: Notif) => {
    setItems((arr) =>
      arr.map((x) => (x.id === n.id ? { ...x, unread: false } : x)),
    );
    if (n.href) router.push(n.href as Href);
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
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">
          Notifications
        </Text>
        <Pressable
          onPress={markAllRead}
          hitSlop={8}
          disabled={unreadCount === 0}
        >
          <Text
            className="text-[12px] font-sans-bold"
            style={{ color: unreadCount === 0 ? INK_3 : PRIMARY }}
          >
            Mark all
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View
        className="flex-row gap-5 px-5 pt-2 border-line"
        style={{ borderBottomWidth: 0.5 }}
      >
        {TABS.map((t) => {
          const isOn = tab === t;
          const count = t === "Unread" ? unreadCount : items.length;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                paddingBottom: 12,
                marginBottom: -1,
                borderBottomWidth: isOn ? 2 : 0,
                borderBottomColor: "#1a2120",
              }}
            >
              <Text
                className={`text-[13px] ${
                  isOn ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"
                }`}
              >
                {t} · {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View className="bg-white rounded-2xl py-10 items-center border-line" style={{ borderWidth: 0.5 }}>
            <Ionicons name="checkmark-done" size={28} color={PRIMARY} />
            <Text className="text-[13px] font-sans-bold text-ink mt-2">
              You're all caught up
            </Text>
            <Text className="text-[11.5px] text-ink-3 mt-1">
              No unread notifications.
            </Text>
          </View>
        ) : (
          filtered.map((n) => {
            const meta = NOTIF_ICON[n.kind];
            return (
              <Pressable
                key={n.id}
                onPress={() => onTap(n)}
                className="bg-white rounded-2xl px-3.5 py-3 flex-row gap-3 border-line active:opacity-90"
                style={{
                  borderWidth: 0.5,
                  borderLeftWidth: n.unread ? 3 : 0.5,
                  borderLeftColor: n.unread ? PRIMARY : "#e1dcd3",
                }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: TONE_BG[meta.tone] }}
                >
                  <Ionicons
                    name={meta.icon}
                    size={18}
                    color={TONE_FG[meta.tone]}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-baseline justify-between gap-2">
                    <Text
                      className="flex-1 text-[13.5px] font-sans-bold text-ink"
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    <Text className="text-[10.5px] font-sans-semibold text-ink-3">
                      {n.when}
                    </Text>
                  </View>
                  <Text className="text-[11.5px] text-ink-3 mt-0.5 leading-4">
                    {n.detail}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
