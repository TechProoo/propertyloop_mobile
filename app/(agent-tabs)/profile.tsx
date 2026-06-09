import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import agentsService from "@/api/services/agents";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DESTRUCTIVE = "#b3261e";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type IonName = keyof typeof Ionicons.glyphMap;

type LinkRow = {
  id: string;
  icon: IonName;
  title: string;
  detail?: string;
  href?: string;
  destructive?: boolean;
};

const GROUPS: { label: string; rows: LinkRow[] }[] = [
  {
    label: "Practice",
    rows: [
      { id: "edit",     icon: "create-outline",          title: "Edit profile",   detail: "Name, bio, agency", href: "/edit-profile" },
      { id: "public",   icon: "eye-outline",              title: "Preview public profile" },
    ],
  },
  {
    label: "Billing",
    rows: [
      { id: "plan",    icon: "star-outline",   title: "Plan & billing",    detail: "Founding · free forever", href: "/agent-plan" },
    ],
  },
  {
    label: "Preferences",
    rows: [
      { id: "notif",   icon: "notifications-outline", title: "Notifications", detail: "Messages, email, SMS", href: "/notification-settings" },
    ],
  },
  {
    label: "Support",
    rows: [
      { id: "help",    icon: "help-circle-outline",   title: "Help centre", href: "/help" },
      { id: "escrow",  icon: "lock-closed-outline",   title: "How escrow works", href: "/escrow-info" },
      { id: "logbook", icon: "document-text-outline", title: "About the logbook", href: "/logbook-info" },
    ],
  },
  {
    label: "Legal",
    rows: [
      { id: "terms",   icon: "reader-outline",  title: "Terms of service", href: "/terms" },
      { id: "privacy", icon: "eye-outline",     title: "Privacy policy",   href: "/privacy" },
      { id: "out",     icon: "log-out-outline", title: "Sign out", destructive: true },
    ],
  },
];

export default function AgentProfileTab() {
  const { user, signOut } = useAuth();
  const [me, setMe] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      agentsService.getMe().then(setMe).catch(() => {});
    }, []),
  );

  const onLink = (l: LinkRow) => {
    if (l.id === "out") {
      Alert.alert("Sign out?", "You'll need your email and password to come back.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/welcome" as Href);
          },
        },
      ]);
      return;
    }
    if (l.id === "public") {
      if (user?.id) router.push(`/agent-profile/${user.id}` as Href);
      return;
    }
    if (l.href) {
      router.push(l.href as Href);
      return;
    }
    Alert.alert(l.title, "Coming soon.");
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-1 pt-1 mb-3">
          <Text className="text-[15px] font-sans-bold text-ink">Profile</Text>
        </View>

        {/* Profile card */}
        <View
          className="bg-white rounded-2xl px-4 py-4 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <View className="flex-row items-center gap-3">
            <PLAvatar initials={initialsOf(user?.name)} size={60} tone="primary" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[16px] font-sans-bold text-ink">
                  {user?.name ?? "Agent"}
                </Text>
                {me?.verified && (
                  <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
                )}
              </View>
              <Text className="text-[12px] text-ink-3 mt-0.5">
                {[me?.agency, me?.location].filter(Boolean).join(" · ") || "Estate agent"}
              </Text>
              <View className="flex-row items-center gap-3 mt-1">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={11} color="#b9842c" />
                  <Text className="text-[11.5px] font-sans-bold text-ink">
                    {me?.rating ?? 0}
                  </Text>
                  <Text className="text-[11.5px] text-ink-3">
                    · {me?.listingsCount ?? 0} listings
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Groups */}
        {GROUPS.map((g) => (
          <View key={g.label} className="mt-5">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2 px-1">
              {g.label}
            </Text>
            <View
              className="bg-white rounded-2xl overflow-hidden border-line"
              style={{ borderWidth: 0.5 }}
            >
              {g.rows.map((r, i) => (
                <Pressable
                  key={r.id}
                  onPress={() => onLink(r)}
                  className="flex-row items-center gap-3 px-3.5 py-3.5 active:opacity-90"
                  style={{
                    borderBottomWidth: i === g.rows.length - 1 ? 0 : 0.5,
                    borderBottomColor: "#ece6df",
                  }}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: r.destructive ? "#fde6e4" : "#f0f0f0" }}
                  >
                    <Ionicons
                      name={r.icon}
                      size={17}
                      color={r.destructive ? DESTRUCTIVE : INK_2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[13.5px] font-sans-bold"
                      style={{ color: r.destructive ? DESTRUCTIVE : "#1a2120" }}
                    >
                      {r.title}
                    </Text>
                    {r.detail && (
                      <Text className="text-[11.5px] text-ink-3 mt-0.5">{r.detail}</Text>
                    )}
                  </View>
                  {!r.destructive && (
                    <Ionicons name="chevron-forward" size={14} color={INK_3} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text className="text-center text-[11px] text-ink-3 mt-6">
          PropertyLoop · v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
