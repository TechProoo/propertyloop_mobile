import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";

const PRINCIPLES = [
  {
    icon: "shield-checkmark-outline" as const,
    title: "Encrypted at rest",
    detail:
      "ID documents and bank details are encrypted; only verification staff can decrypt them.",
  },
  {
    icon: "eye-off-outline" as const,
    title: "Never sold",
    detail:
      "We don't sell your data to advertisers, brokers or data aggregators. Ever.",
  },
  {
    icon: "people-outline" as const,
    title: "Minimum sharing",
    detail:
      "Agents and vendors only see what they need — name, contact, the listing you're enquiring about.",
  },
];

const SECTIONS: { h: string; b: string[] }[] = [
  {
    h: "1. What we collect",
    b: [
      "Account info: name, email, phone, password hash, profile photo.",
      "Verification: NIN, selfie, proof-of-address documents (when you choose to verify).",
      "Activity: listings viewed, searches saved, offers made, vendors booked, messages sent.",
      "Device: model, OS, app version, language, time zone, approximate location (city level) when you grant permission.",
      "Payment: tokenised card references via Paystack — we never store full card numbers.",
    ],
  },
  {
    h: "2. Why we use it",
    b: [
      "To run the service — show you relevant listings, route messages, process escrow payments.",
      "To verify identity and prevent fraud — comparing submitted ID against authoritative sources (e.g. NIMC for NIN).",
      "To improve the product — anonymised usage metrics to understand which flows work.",
      "To comply with Nigerian law — NDPR, AML obligations, tax reporting where required.",
    ],
  },
  {
    h: "3. Who we share with",
    b: [
      "Agents, landlords and vendors you contact — only your name, contact and the listing context.",
      "Processors acting on our behalf — Paystack (payments), Twilio (SMS), AWS (hosting), all under data-processing agreements.",
      "Regulators and courts when legally compelled. We will challenge over-broad requests where appropriate.",
    ],
  },
  {
    h: "4. How long we keep it",
    b: [
      "Account data: while your account is active, plus 24 months after closure to handle disputes and legal claims.",
      "Verification documents: 5 years from submission, in line with AML retention rules.",
      "Transaction records: 7 years, in line with tax record-keeping rules.",
    ],
  },
  {
    h: "5. Your rights",
    b: [
      "Under the NDPR you may request access to, correction of, or deletion of your personal data.",
      "You can delete your account any time from Settings → Delete account — this closes your account and revokes access immediately.",
      "For access or correction requests, email support.propertyloop@propertyloop.ng. We respond within 30 days.",
      "You can also withdraw consent for non-essential processing (e.g. marketing) from Settings → Notifications.",
    ],
  },
  {
    h: "6. Cookies & analytics",
    b: [
      "We use minimal, first-party analytics to measure app performance. No third-party advertising trackers are embedded.",
    ],
  },
  {
    h: "7. Children",
    b: [
      "PropertyLoop is not intended for users under 18. We do not knowingly collect data from minors.",
    ],
  },
  {
    h: "8. Changes",
    b: [
      "We will notify you in-app at least 14 days before any material change to this Policy takes effect.",
    ],
  },
];

export default function PrivacyScreen() {
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
          Privacy policy
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="font-serif text-ink mt-2"
          style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}
        >
          Privacy <Text className="font-serif-italic">policy</Text>
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-2 font-sans-semibold">
          Last updated · 28 May 2026 · v2.4
        </Text>
        <Text className="text-[13px] text-ink-2 mt-3 leading-5">
          The short version: we collect what we need to run the service, encrypt
          the sensitive bits, share only with people you've chosen to contact,
          and never sell anything.
        </Text>

        {/* Principles */}
        <View className="mt-5 gap-2">
          {PRINCIPLES.map((p) => (
            <View
              key={p.title}
              className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line"
              style={{ borderWidth: 0.5 }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Ionicons name={p.icon} size={18} color={PRIMARY} />
              </View>
              <View className="flex-1">
                <Text className="text-[13.5px] font-sans-bold text-ink">
                  {p.title}
                </Text>
                <Text className="text-[11.5px] text-ink-3 mt-0.5 leading-4">
                  {p.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {SECTIONS.map((s) => (
          <View key={s.h} className="mt-6">
            <Text className="text-[14px] font-sans-bold text-ink">{s.h}</Text>
            {s.b.map((p, i) => (
              <Text key={i} className="text-[12.5px] text-ink-2 mt-2 leading-5">
                {p}
              </Text>
            ))}
          </View>
        ))}

        <Text className="text-[11px] text-ink-3 mt-8 text-center leading-4">
          Questions? support.propertyloop@propertyloop.ng — we reply within 30
          days.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
