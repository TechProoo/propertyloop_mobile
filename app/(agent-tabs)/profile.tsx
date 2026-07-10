import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import AgentDashboard from "@/components/agent/AgentDashboard";
import { useAuth } from "@/context/auth";
import agentsService from "@/api/services/agents";
import usersService from "@/api/services/users";
import { confirmAccountDeletion } from "@/lib/accountSecurity";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DESTRUCTIVE = "#b3261e";

const ROW_TINTS: Record<string, { bg: string; fg: string }> = {
  browse: { bg: "#e3efe7", fg: PRIMARY },
  vendors: { bg: "#dcf0ef", fg: "#0e7c7b" },
  edit: { bg: "#e3efe7", fg: PRIMARY },
  public: { bg: "#e4ecfb", fg: "#3b5bdb" },
  notif: { bg: "#fbeacd", fg: "#b9842c" },
  help: { bg: "#e4ecfb", fg: "#3b5bdb" },
  escrow: { bg: "#e3efe7", fg: PRIMARY },
  logbook: { bg: "#dcf0ef", fg: "#0e7c7b" },
  terms: { bg: "#ebe6fb", fg: "#6741d9" },
  privacy: { bg: "#e4ecfb", fg: "#3b5bdb" },
  out: { bg: "#fde6e4", fg: DESTRUCTIVE },
  deactivate: { bg: "#fbeacd", fg: "#b9842c" },
  delete: { bg: "#fde6e4", fg: DESTRUCTIVE },
};

type ToggleTab = "profile" | "settings";
const TOGGLE_OPTIONS = [
  { id: "profile" as const, label: "Profile" },
  { id: "settings" as const, label: "Settings" },
];

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
    label: "Marketplace",
    rows: [
      { id: "browse",  icon: "home-outline",         title: "Browse properties",  detail: "Search & save listings", href: "/(tabs)" },
      { id: "vendors", icon: "construct-outline",    title: "Hire vendors",       detail: "Find service professionals", href: "/services" },
    ],
  },
  {
    label: "Practice",
    rows: [
      { id: "edit",     icon: "create-outline",          title: "Edit profile",   detail: "Name, bio, agency", href: "/edit-profile" },
      { id: "public",   icon: "eye-outline",              title: "Preview public profile" },
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
      { id: "logbook", icon: "document-text-outline", title: "Using the Logbook", href: "/logbook-info" },
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
  {
    label: "Danger zone",
    rows: [
      { id: "deactivate", icon: "pause-circle-outline", title: "Deactivate account", detail: "Sign back in anytime to reactivate", destructive: true },
      { id: "delete",     icon: "trash-outline",        title: "Delete account",     detail: "Permanently close your account", destructive: true },
    ],
  },
];

export default function AgentProfileTab() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<ToggleTab>("profile");
  const [me, setMe] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      agentsService.getMe().then(setMe).catch(() => {});
    }, []),
  );

  const doDeactivate = async () => {
    try {
      await usersService.deactivateAccount();
      await signOut();
      router.replace("/welcome" as Href);
      Alert.alert(
        "Account deactivated",
        "Your account is hidden until you sign back in. Log in anytime to reactivate it.",
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Please try again in a moment.";
      Alert.alert("Couldn't deactivate", Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  const doDelete = async () => {
    try {
      if (!(await confirmAccountDeletion())) return;
      await usersService.deleteAccount();
      await signOut();
      router.replace("/welcome" as Href);
      Alert.alert("Account deleted", "Your account has been closed. We're sorry to see you go.");
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Please try again in a moment.";
      Alert.alert("Couldn't delete account", Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

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
    if (l.id === "deactivate") {
      Alert.alert(
        "Deactivate your account?",
        "Your public profile and listings will be hidden and you'll be signed out everywhere. Sign back in anytime with your email and password to reactivate — nothing is deleted.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Deactivate", style: "destructive", onPress: doDeactivate },
        ],
      );
      return;
    }
    if (l.id === "delete") {
      Alert.alert(
        "Delete your account?",
        "This permanently closes your PropertyLoop account and signs you out everywhere. Your listings, leads, messages and reviews will no longer be accessible. This can't be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete account",
            style: "destructive",
            onPress: () =>
              Alert.alert(
                "Are you absolutely sure?",
                `${user?.email ?? "Your account"} will be closed. This is your last chance to keep it.`,
                [
                  { text: "Keep my account", style: "cancel" },
                  { text: "Yes, delete", style: "destructive", onPress: doDelete },
                ],
              ),
          },
        ],
      );
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
    <View className="flex-1 bg-cream">
      {/* Toggle header — flips between the dashboard ("Profile") and Settings */}
      <SafeAreaView edges={["top"]} className="bg-cream">
        <View className="px-4 pt-1 pb-2">
          <SegmentedToggle options={TOGGLE_OPTIONS} value={tab} onChange={setTab} />
        </View>
      </SafeAreaView>

      {tab === "profile" ? (
        <AgentDashboard embedded />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 104 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card */}
          <View
            className="bg-white rounded-2xl px-4 py-4 border-line mt-1"
            style={{ borderWidth: 0.5 }}
          >
            <View className="flex-row items-center gap-3">
              <PLAvatar initials={initialsOf(user?.name)} uri={user?.avatarUrl} size={60} tone="primary" />
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
                {((me?.rating ?? 0) > 0 || (me?.listingsCount ?? 0) > 0) && (
                  <View className="flex-row items-center gap-3 mt-1">
                    <View className="flex-row items-center gap-1">
                      {(me?.rating ?? 0) > 0 && (
                        <>
                          <Ionicons name="star" size={11} color="#b9842c" />
                          <Text className="text-[11.5px] font-sans-bold text-ink">
                            {me.rating}
                          </Text>
                        </>
                      )}
                      {(me?.listingsCount ?? 0) > 0 && (
                        <Text className="text-[11.5px] text-ink-3">
                          {(me?.rating ?? 0) > 0 ? "· " : ""}
                          {me.listingsCount} listings
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* PropertyLoop is free for all agents — no subscription/billing. */}

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
                      style={{ backgroundColor: ROW_TINTS[r.id]?.bg ?? "#f0f0f0" }}
                    >
                      <Ionicons
                        name={r.icon}
                        size={17}
                        color={ROW_TINTS[r.id]?.fg ?? INK_2}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-[13.5px] font-sans-bold"
                        style={{ color: r.destructive ? (ROW_TINTS[r.id]?.fg ?? DESTRUCTIVE) : "#1a2120" }}
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
      )}
    </View>
  );
}
