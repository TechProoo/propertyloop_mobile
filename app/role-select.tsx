import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "BUYER" | "AGENT" | "VENDOR";

type RoleCard = {
  id: Role;
  badge: string;
  badgeTone: "emerald" | "slate" | "amber";
  iconBg: string;
  glyph: string;
  title: string;
  desc: string;
  chips: string[];
  /** Optional footnote shown below the chips (e.g. KYC requirement). */
  footnote?: string;
  /** What the bottom CTA reads when this role is selected. */
  ctaLabel: string;
};

const CARDS: RoleCard[] = [
  {
    id: "BUYER",
    badge: "BUYER · RENTER",
    badgeTone: "emerald",
    iconBg: "bg-emerald-100",
    glyph: "🔑",
    title: "I'm looking for a home",
    desc: "Search verified listings, save favourites, make offers, and book viewings.",
    chips: ["Search & save", "Mortgage tools", "Make offers"],
    ctaLabel: "Continue as buyer",
  },
  {
    id: "AGENT",
    badge: "AGENT",
    badgeTone: "slate",
    iconBg: "bg-slate-100",
    glyph: "🏢",
    title: "I'm an estate agent",
    desc: "List properties, manage viewings, handle offers, and earn commissions.",
    chips: ["Listings dashboard", "Lead inbox", "Earnings"],
    footnote: "Verified KYC required",
    ctaLabel: "Continue as agent",
  },
  {
    id: "VENDOR",
    badge: "SERVICE LOOP",
    badgeTone: "amber",
    iconBg: "bg-amber-100",
    glyph: "🛠️",
    title: "I provide property services",
    desc: "Plumbers, cleaners, inspectors, movers — find verified work near you.",
    chips: ["Job board", "Quotes", "Reviews"],
    footnote: "Trade verification required",
    ctaLabel: "Continue as service provider",
  },
];

const badgeClasses: Record<RoleCard["badgeTone"], string> = {
  emerald: "bg-emerald-700",
  slate: "bg-slate-900",
  amber: "bg-amber-500",
};

export default function RoleSelectScreen() {
  const [selected, setSelected] = useState<Role>("BUYER");
  const current = CARDS.find((c) => c.id === selected)!;

  const handleContinue = () => {
    if (selected === "BUYER") {
      router.push("/buyer-preferences" as Href);
    } else if (selected === "AGENT") {
      router.push("/agent-setup" as Href);
    } else {
      router.push({ pathname: "/signup", params: { role: selected } } as Href);
    }
  };

  return (
    <View className="flex-1 bg-[#f5f0eb]">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Top bar — back left, step counter right */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
          >
            <Text className="text-slate-700 text-xl">‹</Text>
          </Pressable>
          <Text className="text-slate-500 text-sm font-medium">Step 1 of 3</Text>
        </View>

        <ScrollView
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text className="text-slate-900 font-serif text-3xl mt-6 leading-[36px]">
            How will you use{"\n"}
            <Text className="italic">propertyloop</Text>?
          </Text>
          <Text className="text-slate-500 text-sm mt-2 leading-5">
            Pick one to start — you can add other roles later from settings.
          </Text>

          {/* Role cards */}
          <View className="mt-6 gap-4">
            {CARDS.map((card) => (
              <RoleCardView
                key={card.id}
                card={card}
                selected={selected === card.id}
                onPress={() => setSelected(card.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-[#f5f0eb]">
          <Pressable
            onPress={handleContinue}
            className="bg-emerald-700 rounded-full py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">
              {current.ctaLabel}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function RoleCardView({
  card,
  selected,
  onPress,
}: {
  card: RoleCard;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-3xl p-5 border-2 active:opacity-90 ${
        selected
          ? "bg-emerald-50 border-emerald-600"
          : "bg-white border-slate-200"
      }`}
    >
      {/* Top row: badge pill (left) + check circle (right) */}
      <View className="flex-row items-start justify-between">
        <View className={`${badgeClasses[card.badgeTone]} px-3 py-1 rounded-full`}>
          <Text className="text-white text-[10px] font-bold tracking-wider">
            {card.badge}
          </Text>
        </View>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            selected
              ? "bg-emerald-600 border-emerald-600"
              : "bg-white border-slate-300"
          }`}
        >
          {selected && <Text className="text-white text-xs font-bold">✓</Text>}
        </View>
      </View>

      {/* Icon + title row */}
      <View className="flex-row items-center gap-3 mt-4">
        <View
          className={`w-12 h-12 rounded-2xl ${card.iconBg} items-center justify-center`}
        >
          <Text className="text-2xl">{card.glyph}</Text>
        </View>
        <Text className="text-slate-900 font-bold text-lg flex-1">
          {card.title}
        </Text>
      </View>

      {/* Description */}
      <Text className="text-slate-600 text-sm leading-5 mt-3">{card.desc}</Text>

      {/* Feature chips */}
      <View className="flex-row flex-wrap gap-2 mt-3">
        {card.chips.map((chip) => (
          <View
            key={chip}
            className="px-3 py-1.5 bg-slate-100 rounded-full"
          >
            <Text className="text-slate-700 text-xs font-medium">{chip}</Text>
          </View>
        ))}
      </View>

      {/* Footnote — verification requirement */}
      {card.footnote && (
        <View className="flex-row items-center gap-1.5 mt-3">
          <Text className="text-slate-400 text-base">○</Text>
          <Text className="text-slate-500 text-xs">{card.footnote}</Text>
        </View>
      )}
    </Pressable>
  );
}
