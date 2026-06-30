import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { HELP_CONTACT, HELP_FAQ } from "@/mocks/buyer-extra";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TOPICS: { id: string; icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; label: string; href: string }[] = [
  { id: "escrow",  icon: "lock-closed-outline",   label: "Escrow",   href: "/escrow-info"   },
  { id: "logbook", icon: "document-text-outline", label: "Logbook",  href: "/logbook-info"  },
  { id: "offers",  icon: "swap-horizontal-outline", label: "Offers",  href: "/offers"        },
];

export default function HelpScreen() {
  const [openId, setOpenId] = useState<string | null>(HELP_FAQ[0].q);

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
          Help centre
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Text
          className="font-serif text-ink mt-3"
          style={{ fontSize: 28, lineHeight: 30, letterSpacing: -0.6 }}
        >
          How can we <Text className="font-serif-italic">help</Text>?
        </Text>
        <Text className="text-[13px] text-ink-2 mt-2 leading-5">
          Search articles, browse a topic, or reach our team directly.
        </Text>

        {/* Search */}
        <View
          className="mt-4 bg-white rounded-full px-4 py-3 flex-row items-center gap-2.5 border-line"
          style={{ borderWidth: 1 }}
        >
          <Ionicons name="search" size={16} color={INK_2} />
          <Text className="flex-1 text-[13.5px] text-ink-3 font-sans-medium">
            Search help articles…
          </Text>
        </View>

        {/* Topic tiles */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Browse by topic
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {TOPICS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(t.href as Href)}
              className="bg-white items-center justify-center gap-1.5 rounded-2xl border-line active:opacity-90"
              style={{
                width: "23.5%",
                paddingVertical: 14,
                borderWidth: 1,
              }}
            >
              <Ionicons name={t.icon} size={20} color={PRIMARY} />
              <Text className="text-[11px] font-sans-bold text-ink">
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* FAQ */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Frequently asked
        </Text>
        <View
          className="bg-white rounded-2xl overflow-hidden border-line"
          style={{ borderWidth: 0.5 }}
        >
          {HELP_FAQ.map((f, i) => {
            const open = openId === f.q;
            return (
              <View
                key={f.q}
                style={{
                  borderBottomWidth: i === HELP_FAQ.length - 1 ? 0 : 0.5,
                  borderBottomColor: "#ece6df",
                }}
              >
                <Pressable
                  onPress={() => setOpenId(open ? null : f.q)}
                  className="flex-row items-center gap-2 px-4 py-3.5 active:opacity-90"
                >
                  <Text className="flex-1 text-[13.5px] font-sans-bold text-ink">
                    {f.q}
                  </Text>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={INK_2}
                  />
                </Pressable>
                {open && (
                  <Text className="text-[12.5px] text-ink-2 px-4 pb-4 leading-5">
                    {f.a}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact strip */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Still need help?
        </Text>
        <View className="gap-2">
          <ContactRow
            icon="call-outline"
            title="Call us"
            detail={`${HELP_CONTACT.phoneLabel} · ${HELP_CONTACT.hours}`}
            onPress={() => Linking.openURL(`tel:${HELP_CONTACT.phoneTel}`)}
          />
          <ContactRow
            icon="mail-outline"
            title="Email"
            detail={HELP_CONTACT.email}
            onPress={() => Linking.openURL(`mailto:${HELP_CONTACT.emailTarget}`)}
          />
          <ContactRow
            icon="chatbubble-ellipses-outline"
            title="Message us in-app"
            detail="Avg. reply in 12 min"
            onPress={() => router.push("/(tabs)/inbox" as Href)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: "#e3efe7" }}
      >
        <Ionicons name={icon} size={18} color={PRIMARY_INK} />
      </View>
      <View className="flex-1">
        <Text className="text-[13.5px] font-sans-bold text-ink">{title}</Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={INK_3} />
    </Pressable>
  );
}
