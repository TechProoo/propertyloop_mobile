import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import vendorsService, { type VendorStats } from "@/api/services/vendors";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DESTRUCTIVE = "#b3261e";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

type IonName = keyof typeof Ionicons.glyphMap;

type LinkRow = {
  id: string;
  icon: IonName;
  title: string;
  detail?: string;
  href?: string;
  badge?: boolean;
  destructive?: boolean;
};

const GROUPS: { label: string; rows: LinkRow[] }[] = [
  {
    label: "Business",
    rows: [
      { id: "menu",     icon: "list-outline",       title: "Service menu",        href: "/vendor-menu" },
      { id: "avail",    icon: "calendar-outline",   title: "Availability",         href: "/vendor-availability" },
      { id: "reviews",  icon: "star-outline",       title: "Reputation & reviews", href: "/vendor-reviews" },
      { id: "cats",     icon: "grid-outline",       title: "Service categories",   href: "/vendor-categories?mode=manage" },
    ],
  },
  {
    label: "Money",
    rows: [
      { id: "bank",     icon: "wallet-outline",  title: "Payout account",          href: "/payout-bank" },
      { id: "earnings", icon: "receipt-outline", title: "Earnings & statements",   href: "/(vendor-tabs)/earnings" },
    ],
  },
  {
    label: "Account",
    rows: [
      { id: "edit",     icon: "create-outline",            title: "Edit business profile",      href: "/vendor-edit-profile" },
      { id: "public",   icon: "eye-outline",               title: "Preview public profile" },
      { id: "notif",    icon: "notifications-outline",     title: "Notifications", detail: "Messages, email, SMS", href: "/notification-settings" },
      { id: "help",     icon: "help-circle-outline",       title: "Help & vendor FAQ",          href: "/help" },
      { id: "terms",    icon: "reader-outline",            title: "Terms of service",           href: "/terms" },
      { id: "privacy",  icon: "eye-outline",               title: "Privacy policy",             href: "/privacy" },
      { id: "out",      icon: "log-out-outline",           title: "Sign out", destructive: true },
    ],
  },
];

export default function VendorProfileScreen() {
  const { user, signOut } = useAuth();
  const [me, setMe] = useState<any>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      vendorsService.getMe().then(setMe).catch(() => {});
      vendorsService.getStats().then(setStats).catch(() => {});
    }, []),
  );

  const category = me?.category ?? me?.serviceCategory ?? "Service Loop vendor";
  const completed = stats?.jobs.completed ?? 0;
  const totalJobs = stats?.jobs.total ?? 0;
  const completeRate = totalJobs ? `${Math.round((completed / totalJobs) * 100)}%` : "—";

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
      if (user?.id) router.push(`/vendor/${user.id}` as Href);
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-1 pt-1 mb-3">
          <Text className="text-[15px] font-sans-bold text-ink">Profile</Text>
        </View>

        {/* Profile card */}
        <View
          className="bg-white rounded-2xl px-4 py-4 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <View className="flex-row items-center gap-3">
            <PLAvatar initials={initialsOf(user?.name)} uri={user?.avatarUrl} size={60} tone="primary" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[16px] font-sans-bold text-ink">{user?.name ?? "Vendor"}</Text>
                {stats?.profile.verified && (
                  <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
                )}
              </View>
              <Text className="text-[12px] text-ink-3 mt-0.5">
                {category} · Service Loop vendor
              </Text>
              {!!me?.id && (
                <Pressable onPress={() => router.push(`/vendor/${me.id}` as Href)} hitSlop={6}>
                  <Text className="text-[12px] font-sans-bold text-primary mt-1">
                    View public profile →
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Stat strip */}
          <View
            className="mt-4 rounded-2xl overflow-hidden border-line flex-row"
            style={{ borderWidth: 0.5 }}
          >
            {[
              { n: `${stats?.profile.rating ?? 0}`, l: "Rating", star: true },
              { n: `${stats?.profile.jobsCount ?? 0}`, l: "Jobs" },
              { n: completeRate, l: "Complete" },
            ].map((s, i) => (
              <View
                key={s.l}
                className="flex-1 items-center py-3"
                style={{
                  borderLeftWidth: i > 0 ? 0.5 : 0,
                  borderLeftColor: "#ece6df",
                }}
              >
                <View className="flex-row items-center gap-1">
                  {s.star && <Ionicons name="star" size={12} color="#b9842c" />}
                  <Text className="font-serif text-ink" style={{ fontSize: 17 }}>
                    {s.n}
                  </Text>
                </View>
                <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
                  {s.l}
                </Text>
              </View>
            ))}
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
                  <Text
                    className="flex-1 text-[13.5px] font-sans-bold"
                    style={{ color: r.destructive ? DESTRUCTIVE : "#1a2120" }}
                  >
                    {r.title}
                  </Text>
                  {r.badge ? (
                    <View
                      className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#e3efe7" }}
                    >
                      <Ionicons name="shield-checkmark" size={10} color={PRIMARY_INK} />
                      <Text
                        className="text-[10px] font-sans-bold tracking-widest uppercase"
                        style={{ color: PRIMARY_INK }}
                      >
                        {r.detail}
                      </Text>
                    </View>
                  ) : (
                    r.detail && (
                      <Text className="text-[12px] font-sans-semibold text-ink-3">
                        {r.detail}
                      </Text>
                    )
                  )}
                  {!r.destructive && !r.badge && (
                    <Ionicons name="chevron-forward" size={14} color={INK_3} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text className="text-center text-[11px] text-ink-3 mt-6">
          propertyloop for vendors · v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
