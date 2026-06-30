import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const INK_2 = "#4d524f";

const SECTIONS: { h: string; b: string[] }[] = [
  {
    h: "1. Who we are",
    b: [
      "PropertyLoop (\"we\", \"our\") operates the PropertyLoop mobile and web platform connecting buyers, renters, agents and service vendors across Nigeria.",
      "Registered in Lagos, Nigeria. RC9151459. Office: 36 Lekki-Epe Expressway, Wing A, 2nd Floor, Lekki Swiss Mall.",
    ],
  },
  {
    h: "2. Using the service",
    b: [
      "You must be at least 18 years old to create an account. By signing up you confirm the information you provide is accurate, and you accept these Terms.",
      "Listings, vendor profiles and price data are submitted by third parties. PropertyLoop verifies identity and licence where indicated by a verified badge, but we are not the seller, landlord or vendor.",
    ],
  },
  {
    h: "3. Offers, viewings & rentals",
    b: [
      "Offers and viewing requests made through PropertyLoop are non-binding until both parties sign the relevant off-platform contract (e.g. tenancy agreement, sale deed).",
      "PropertyLoop facilitates introductions and coordination but is not party to the underlying property transaction.",
    ],
  },
  {
    h: "4. Service Loop & escrow",
    b: [
      "When you book a vendor through Service Loop, payment is held in escrow by PropertyLoop. Funds are released to the vendor only after you confirm the work is complete.",
      "If you raise a dispute before release, our team will review evidence from both sides. Refunds and partial releases are at PropertyLoop's reasonable discretion based on that evidence.",
    ],
  },
  {
    h: "5. Fees",
    b: [
      "Buyers, renters and shortlet guests use PropertyLoop free of charge. Payment processing fees (typically 1.5% via Paystack) are shown at checkout and added to the total.",
      "Agents and vendors are billed per their listing or membership plan, separately accepted on signup.",
    ],
  },
  {
    h: "6. Acceptable use",
    b: [
      "Do not post false listings, impersonate another person, scrape data, attempt unauthorised access, or use the service for unlawful purposes.",
      "We may suspend or terminate accounts that breach these Terms, with or without prior notice depending on severity.",
    ],
  },
  {
    h: "7. Limitation of liability",
    b: [
      "To the maximum extent permitted by Nigerian law, PropertyLoop's aggregate liability arising out of your use of the service is limited to the fees you paid us in the preceding 12 months.",
      "We are not liable for indirect or consequential losses, including loss of profit, reputation or expected gains from a property transaction.",
    ],
  },
  {
    h: "8. Changes",
    b: [
      "We may update these Terms. If a change is material, we will notify you in-app or by email at least 14 days before it takes effect.",
    ],
  },
  {
    h: "9. Governing law",
    b: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes will be resolved in the courts of Lagos State.",
    ],
  },
  {
    h: "10. Contact",
    b: [
      "Questions about these Terms: support@propertyloop.ng.",
    ],
  },
];

export default function TermsScreen() {
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
          Terms of service
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
          Terms of <Text className="font-serif-italic">service</Text>
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-2 font-sans-semibold">
          Last updated · 28 May 2026 · v3.2
        </Text>

        <Text className="text-[13px] text-ink-2 mt-3 leading-5">
          Please read these Terms carefully — they govern your use of the
          PropertyLoop platform. By signing up or continuing to use the app,
          you agree to be bound by them.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.h} className="mt-6">
            <Text className="text-[14px] font-sans-bold text-ink">{s.h}</Text>
            {s.b.map((p, i) => (
              <Text
                key={i}
                className="text-[12.5px] text-ink-2 mt-2 leading-5"
              >
                {p}
              </Text>
            ))}
          </View>
        ))}

        <Text className="text-[11px] text-ink-3 mt-8 text-center leading-4">
          © 2026 PropertyLoop. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
