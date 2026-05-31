import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { SETTINGS_GROUPS, SETTINGS_PROFILE, type SettingsLink } from "@/mocks/buyer-extra";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DESTRUCTIVE = "#b3261e";

export default function SettingsScreen() {
  const onSignOut = () =>
    Alert.alert("Sign out?", "You'll need your email and password to come back.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => router.replace("/welcome" as Href),
      },
    ]);

  const onLink = (link: SettingsLink) => {
    if (link.id === "out") return onSignOut();
    if (link.href) return router.push(link.href as Href);
    Alert.alert(link.title, "Coming soon.");
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View
          className="bg-white rounded-2xl px-4 py-4 flex-row items-center gap-3 border-line mt-1"
          style={{ borderWidth: 0.5 }}
        >
          <PLAvatar initials={SETTINGS_PROFILE.initials} size={56} tone="primary" />
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[15px] font-sans-bold text-ink">
                {SETTINGS_PROFILE.name}
              </Text>
              {SETTINGS_PROFILE.verified && (
                <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
              )}
            </View>
            <Text className="text-[12px] text-ink-3 mt-0.5">
              {SETTINGS_PROFILE.email}
            </Text>
            <Text className="text-[12px] text-ink-3">
              {SETTINGS_PROFILE.phone}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/edit-profile" as Href)}
            hitSlop={8}
          >
            <Text className="text-[12px] font-sans-bold text-primary">Edit</Text>
          </Pressable>
        </View>

        {/* Groups */}
        {SETTINGS_GROUPS.map((g) => (
          <View key={g.label} className="mt-5">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2 px-1">
              {g.label}
            </Text>
            <View
              className="bg-white rounded-2xl overflow-hidden border-line"
              style={{ borderWidth: 0.5 }}
            >
              {g.links.map((l, i) => (
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
                    style={{
                      backgroundColor: l.destructive ? "#fde6e4" : "#ece6df",
                    }}
                  >
                    <Ionicons
                      name={l.icon}
                      size={17}
                      color={l.destructive ? DESTRUCTIVE : INK_2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[13.5px] font-sans-bold"
                      style={{ color: l.destructive ? DESTRUCTIVE : "#1a2120" }}
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
