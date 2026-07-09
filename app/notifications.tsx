import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import notificationsService, {
  type AppNotification,
} from "@/api/services/notifications";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TABS = ["All", "Unread"] as const;
type TabId = (typeof TABS)[number];

type Tone = "primary" | "accent" | "neutral";

const TONE_BG: Record<Tone, string> = {
  primary: "#e3efe7",
  accent: "#f5ead4",
  neutral: "#f0f0f0",
};
const TONE_FG: Record<Tone, string> = {
  primary: PRIMARY_INK,
  accent: ACCENT_INK,
  neutral: INK_2,
};

function iconFor(type: string): {
  icon: keyof typeof Ionicons.glyphMap;
  tone: Tone;
} {
  if (type.startsWith("OFFER")) return { icon: "pricetag-outline", tone: "accent" };
  if (type.startsWith("PURCHASE")) return { icon: "trail-sign-outline", tone: "primary" };
  if (type.startsWith("WITHDRAWAL")) return { icon: "cash-outline", tone: "primary" };
  if (type.startsWith("JOB")) return { icon: "construct-outline", tone: "primary" };
  if (type.startsWith("VIEWING")) return { icon: "calendar-outline", tone: "primary" };
  if (type.startsWith("KYC")) return { icon: "shield-checkmark-outline", tone: "accent" };
  if (type === "MESSAGE") return { icon: "chatbubble-outline", tone: "neutral" };
  return { icon: "notifications-outline", tone: "neutral" };
}

function hrefFor(n: AppNotification, role?: string): Href | null {
  const d = n.data ?? {};
  const isAgent = role === "AGENT";
  if (d.purchaseId) return "/purchase-progress" as Href;
  // Offers: agents review and accept/counter/decline on their offers screen;
  // buyers track the offers they've made on the buyer offers screen. (Routing
  // an agent to the buyer "/offers" screen showed an empty list.)
  if (d.offerId) return (isAgent ? "/agent-offers" : "/offers") as Href;
  // Viewings: agents accept/decline/reschedule from the Leads → Viewings tab;
  // buyers see their booked viewings on the Account tab. (Previously viewing
  // notifications had no destination, so they weren't tappable.)
  if (d.viewingId) {
    return (
      isAgent ? "/(agent-tabs)/leads?tab=viewing" : "/(tabs)/account"
    ) as Href;
  }
  // Withdrawal decisions land the vendor on their earnings tab, where the
  // paid/returned balance is visible.
  if (d.withdrawalId) return "/(vendor-tabs)/earnings" as Href;
  // Job events route to the recipient's own job screen: the vendor's
  // active-job view (surfaces the dispute banner), or the buyer's service-job
  // view (where they confirm/release escrow).
  if (d.jobId) {
    return (
      role === "VENDOR"
        ? `/vendor-active-job/${d.jobId}`
        : `/service-job/${d.jobId}`
    ) as Href;
  }
  return null;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("All");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await notificationsService.list();
      setItems(res.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items],
  );
  const filtered = tab === "Unread" ? items.filter((n) => !n.readAt) : items;

  const markAll = async () => {
    setItems((arr) => arr.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    try {
      await notificationsService.markAllRead();
    } catch {
      /* optimistic */
    }
  };

  const onTap = async (n: AppNotification) => {
    if (!n.readAt) {
      setItems((arr) =>
        arr.map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
        ),
      );
      notificationsService.markRead(n.id).catch(() => {});
    }
    const href = hrefFor(n, user?.role);
    if (href) router.push(href);
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
        <Text className="text-[15px] font-sans-bold text-ink">Notifications</Text>
        <Pressable onPress={markAll} hitSlop={8} disabled={unreadCount === 0}>
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
                  isOn
                    ? "font-sans-bold text-ink"
                    : "font-sans-semibold text-ink-3"
                }`}
              >
                {t} · {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View
              className="bg-white rounded-2xl py-10 items-center border-line"
              style={{ borderWidth: 0.5 }}
            >
              <Ionicons name="cloud-offline-outline" size={26} color={INK_3} />
              <Text className="text-[13px] font-sans-bold text-ink mt-2">
                Couldn’t load notifications
              </Text>
              <Pressable
                onPress={() => {
                  setLoading(true);
                  load();
                }}
                className="mt-3 px-4 py-2 rounded-full bg-ink active:opacity-80"
              >
                <Text className="text-white text-[12px] font-sans-bold">
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : filtered.length === 0 ? (
            <View
              className="bg-white rounded-2xl py-10 items-center border-line"
              style={{ borderWidth: 0.5 }}
            >
              <Ionicons name="checkmark-done" size={28} color={PRIMARY} />
              <Text className="text-[13px] font-sans-bold text-ink mt-2">
                You&apos;re all caught up
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-1">
                {tab === "Unread" ? "No unread notifications." : "Nothing yet."}
              </Text>
            </View>
          ) : (
            filtered.map((n) => {
              const meta = iconFor(n.type);
              const unread = !n.readAt;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => onTap(n)}
                  className="bg-white rounded-2xl px-3.5 py-3 flex-row gap-3 border-line active:opacity-90"
                  style={{
                    borderWidth: 0.5,
                    borderLeftWidth: unread ? 3 : 0.5,
                    borderLeftColor: unread ? PRIMARY : "#e1dcd3",
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: TONE_BG[meta.tone] }}
                  >
                    <Ionicons name={meta.icon} size={18} color={TONE_FG[meta.tone]} />
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
                        {timeAgo(n.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-[11.5px] text-ink-3 mt-0.5 leading-4" numberOfLines={3}>
                      {n.body}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
