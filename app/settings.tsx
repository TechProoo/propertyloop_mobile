import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import usersService from "@/api/services/users";
import { confirmAccountDeletion } from "@/lib/accountSecurity";

const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DESTRUCTIVE = "#b3261e";

// Per-row icon tints — colour breaks up the monochrome list and gives each
// destination its own identity. Kept on-brand (greens/amber) with a few calm
// accent hues for variety.
const TINTS: Record<string, { bg: string; fg: string }> = {
  edit:    { bg: "#e3efe7", fg: "#1f6f43" }, // green
  notif:   { bg: "#fbeacd", fg: "#b9842c" }, // amber
  help:    { bg: "#e4ecfb", fg: "#3b5bdb" }, // blue
  logbook: { bg: "#dcf0ef", fg: "#0e7c7b" }, // teal
  escrow:  { bg: "#e3efe7", fg: "#1f6f43" }, // green
  terms:   { bg: "#ebe6fb", fg: "#6741d9" }, // violet
  privacy: { bg: "#e4ecfb", fg: "#3b5bdb" }, // blue
  out:     { bg: "#fde6e4", fg: DESTRUCTIVE }, // red (destructive)
  deactivate: { bg: "#fbeacd", fg: "#b9842c" }, // amber — reversible, less severe than delete
  delete:  { bg: "#fde6e4", fg: DESTRUCTIVE }, // red (destructive)
};

type SettingsLink = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail?: string;
  href?: string;
  destructive?: boolean;
};

// Only features that hit a real backend (or are static info/legal pages).
const GROUPS: { label: string; links: SettingsLink[] }[] = [
  {
    label: "Account",
    links: [
      { id: "edit", icon: "person-outline", title: "Edit profile", detail: "Name, phone, bio", href: "/edit-profile" },
    ],
  },
  {
    label: "Preferences",
    links: [
      { id: "notif", icon: "notifications-outline", title: "Notifications", detail: "Messages, email, SMS", href: "/notification-settings" },
    ],
  },
  {
    label: "Support",
    links: [
      { id: "help", icon: "help-circle-outline", title: "Help centre", href: "/help" },
      { id: "logbook", icon: "document-text-outline", title: "Using the Logbook", href: "/logbook-info" },
      { id: "escrow", icon: "lock-closed-outline", title: "How escrow works", href: "/escrow-info" },
    ],
  },
  {
    label: "Legal",
    links: [
      { id: "terms", icon: "reader-outline", title: "Terms of service", href: "/terms" },
      { id: "privacy", icon: "eye-outline", title: "Privacy policy", href: "/privacy" },
      { id: "out", icon: "log-out-outline", title: "Sign out", destructive: true },
    ],
  },
  {
    label: "Danger zone",
    links: [
      { id: "deactivate", icon: "pause-circle-outline", title: "Deactivate account", detail: "Sign back in anytime to reactivate", destructive: true },
      { id: "delete", icon: "trash-outline", title: "Delete account", detail: "Permanently close your account", destructive: true },
    ],
  },
];

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const doDeactivate = async () => {
    try {
      await usersService.deactivateAccount();
      await signOut();
      router.replace("/welcome" as Href);
      Alert.alert("Account deactivated", "Your account is hidden until you sign back in.");
    } catch (e: any) {
      const message = e?.response?.data?.message ?? "Please try again in a moment.";
      Alert.alert("Couldn't deactivate", Array.isArray(message) ? message.join(", ") : message);
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
      const message = e?.response?.data?.message ?? "Please try again in a moment.";
      Alert.alert("Couldn't delete account", Array.isArray(message) ? message.join(", ") : message);
    }
  };
  const onSignOut = () =>
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

  const onLink = (link: SettingsLink) => {
    if (link.id === "out") return onSignOut();
    if (link.id === "deactivate") {
      return Alert.alert(
        "Deactivate your account?",
        "Your profile and activity will be hidden and you'll be signed out everywhere. Sign back in anytime to reactivate — nothing is deleted.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Deactivate", style: "destructive", onPress: doDeactivate },
        ],
      );
    }
    if (link.id === "delete") {
      return Alert.alert(
        "Delete your account?",
        "This permanently closes your PropertyLoop account. Your bookings, offers, messages and saved items will no longer be accessible. This can't be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete account",
            style: "destructive",
            onPress: () => Alert.alert(
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
    }
    if (link.href) router.push(link.href as Href);
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
          Settings
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 104 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View
          className="bg-primary-soft rounded-2xl px-4 py-4 flex-row items-center gap-3 mt-1"
          style={{ borderWidth: 1, borderColor: "#cfe5d8" }}
        >
          <PLAvatar initials={initialsOf(user?.name)} uri={user?.avatarUrl} size={56} tone="primary" />
          <View className="flex-1">
            <Text className="text-[15px] font-sans-bold text-ink">
              {user?.name ?? "Your account"}
            </Text>
            <Text className="text-[12px] text-ink-2 mt-0.5">
              {user?.email ?? ""}
            </Text>
            {!!user?.phone && (
              <Text className="text-[12px] text-ink-2">{user.phone}</Text>
            )}
          </View>
          <Pressable
            onPress={() => router.push("/edit-profile" as Href)}
            hitSlop={8}
            className="bg-primary rounded-full px-3.5 py-1.5 active:opacity-80"
          >
            <Text className="text-[12px] font-sans-bold text-white">Edit</Text>
          </Pressable>
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
              {g.links.map((l, i) => {
                const tint = TINTS[l.id] ?? { bg: "#f0f0f0", fg: INK_2 };
                return (
                <Pressable
                  key={l.id}
                  onPress={() => onLink(l)}
                  className="flex-row items-center gap-3 px-3.5 py-3.5 active:opacity-90"
                  style={{
                    borderBottomWidth: i === g.links.length - 1 ? 0 : 0.5,
                    borderBottomColor: "#ece6df",
                  }}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: tint.bg }}
                  >
                    <Ionicons name={l.icon} size={17} color={tint.fg} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[13.5px] font-sans-bold"
                      style={{ color: l.destructive ? tint.fg : "#1a2120" }}
                    >
                      {l.title}
                    </Text>
                    {l.detail && (
                      <Text className="text-[11.5px] text-ink-3 mt-0.5">
                        {l.detail}
                      </Text>
                    )}
                  </View>
                  {!l.destructive && (
                    <Ionicons name="chevron-forward" size={14} color={INK_3} />
                  )}
                </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Text className="text-center text-[11px] text-ink-3 mt-6">
          PropertyLoop · v{Constants.expoConfig?.version ?? "1.0.1"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
