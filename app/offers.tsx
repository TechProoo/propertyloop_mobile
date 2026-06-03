import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  OFFERS,
  OFFERS_STAT_STRIP,
  type Offer,
  type OfferStatus,
} from "@/mocks/buyer-dashboard";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS = [
  { id: "all",      label: "All",      filter: (_: Offer) => true },
  { id: "active",   label: "Active",   filter: (o: Offer) => o.status !== "accepted" },
  { id: "accepted", label: "Accepted", filter: (o: Offer) => o.status === "accepted" },
  { id: "closed",   label: "Closed",   filter: (_: Offer) => false },
] as const;
type TabId = (typeof TABS)[number]["id"];

function counts(): Record<TabId, number> {
  return {
    all:      OFFERS.length,
    active:   OFFERS.filter((o) => o.status !== "accepted").length,
    accepted: OFFERS.filter((o) => o.status === "accepted").length,
    closed:   0,
  };
}

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/200/200`;
}

const STATUS_STYLE: Record<
  OfferStatus,
  { bg: string; fg: string; dot: string; label: string }
> = {
  pending:  { bg: "#f5ead4", fg: "#6b4a16", dot: "#b9842c", label: "Awaiting reply" },
  counter:  { bg: "#fbe6d8", fg: "#7a3a13", dot: "#c05a1f", label: "Counter-offer" },
  accepted: { bg: "#e3efe7", fg: PRIMARY_INK, dot: PRIMARY,   label: "Accepted · closing" },
};

export default function OffersScreen() {
  const [tab, setTab] = useState<TabId>("active");
  const c = counts();
  const filtered = OFFERS.filter(TABS.find((t) => t.id === tab)!.filter);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-1">
          <Text
            className="text-[11px] font-sans-bold text-primary tracking-widest uppercase"
            style={{ letterSpacing: 1.3 }}
          >
            Buyer dashboard
          </Text>
          <Text
            className="font-serif text-ink mt-1"
            style={{ fontSize: 30, letterSpacing: -0.7, lineHeight: 32 }}
          >
            Your <Text className="font-serif-italic">offers</Text>
          </Text>
        </View>

        {/* Stat strip */}
        <View className="flex-row gap-2 px-4 pt-3.5">
          {OFFERS_STAT_STRIP.map((s) => {
            const isPrimary = "tone" in s && s.tone === "primary";
            return (
              <View
                key={s.l}
                className={`flex-1 rounded-xl px-3 py-3 ${
                  isPrimary ? "bg-primary" : "bg-white border-line"
                }`}
                style={!isPrimary ? { borderWidth: 0.5 } : undefined}
              >
                <Text
                  className="font-serif"
                  style={{
                    fontSize: 20,
                    letterSpacing: -0.4,
                    color: isPrimary ? "#ffffff" : "#1a2120",
                  }}
                >
                  {s.n}
                </Text>
                <Text
                  className="text-[11px] font-sans-semibold mt-0.5"
                  style={{
                    color: isPrimary ? "rgba(255,255,255,0.8)" : INK_3,
                  }}
                >
                  {s.l}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Tabs */}
        <View
          className="flex-row gap-4 px-5 pt-3.5"
          style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
        >
          {TABS.map((t) => {
            const isOn = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{
                  paddingBottom: 12,
                  marginBottom: -1,
                  borderBottomWidth: isOn ? 2 : 0,
                  borderBottomColor: "#1a2120",
                }}
              >
                <Text
                  className={`text-[13px] ${
                    isOn ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"
                  }`}
                >
                  {t.label} · {c[t.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Offer cards */}
        <View className="px-5 pt-3.5 gap-3">
          {filtered.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
          {filtered.length === 0 && (
            <View className="bg-white rounded-2xl px-4 py-8 items-center border-line" style={{ borderWidth: 0.5 }}>
              <Text className="text-[13px] text-ink-3">
                Nothing here yet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const T = STATUS_STYLE[offer.status];
  return (
    <View
      className="bg-white rounded-[18px] overflow-hidden border-line"
      style={{ borderWidth: 0.5 }}
    >
      {/* Status bar */}
      <View
        className="flex-row items-center gap-2 px-3.5 py-2"
        style={{ backgroundColor: T.bg }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 7, backgroundColor: T.dot }} />
        <Text
          className="text-[11px] font-sans-bold tracking-widest uppercase"
          style={{ color: T.fg }}
        >
          {T.label}
        </Text>
        {offer.deadline ? (
          <Text
            className="ml-auto text-[11px] font-sans-bold tracking-widest uppercase"
            style={{ color: T.fg, opacity: 0.85 }}
          >
            {offer.deadline}
          </Text>
        ) : null}
      </View>

      {/* Body */}
      <Pressable
        onPress={() =>
          offer.status === "accepted"
            ? router.push("/purchase-progress" as Href)
            : undefined
        }
        className="flex-row gap-3 p-3 active:opacity-90"
      >
        <Image
          source={picsum(offer.imageSeed)}
          style={{ width: 80, height: 80, borderRadius: 12 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text
            className="text-[14px] font-sans-bold text-ink"
            style={{ letterSpacing: -0.1 }}
            numberOfLines={1}
          >
            {offer.home}
          </Text>
          <Text className="text-xs text-ink-3 mt-0.5">
            {offer.area} · {offer.since}
          </Text>
          <View
            className="mt-2 flex-row gap-2"
            style={{ flexWrap: "wrap" }}
          >
            <PriceTag label="Asking" value={offer.asking} />
            <PriceTag label="Your offer" value={offer.yours} highlight />
            {offer.counter ? (
              <PriceTag label="Counter" value={offer.counter} dark />
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* Counter actions */}
      {offer.status === "counter" && (
        <View
          className="flex-row"
          style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}
        >
          <ActionBtn
            label="Decline"
            soft
            onPress={() =>
              Alert.alert(
                "Decline counter?",
                `Decline the ₦${offer.counter} counter on ${offer.home}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Decline", style: "destructive" },
                ],
              )
            }
          />
          <ActionBtn
            label="Counter"
            color={PRIMARY}
            onPress={() => router.push("/offer-action" as Href)}
          />
          <ActionBtn
            label="Accept"
            filled
            onPress={() =>
              Alert.alert(
                "Accept counter?",
                `Accept the seller's ${offer.counter} counter on ${offer.home}? This kicks off the purchase process.`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Accept", style: "default" },
                ],
              )
            }
          />
        </View>
      )}
    </View>
  );
}

function PriceTag({
  label,
  value,
  highlight,
  dark,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  dark?: boolean;
}) {
  const bg = highlight ? "#e3efe7" : dark ? "#1a2120" : "#f0f0f0";
  const fg = dark ? "#ffffff" : highlight ? PRIMARY_INK : "#1a2120";
  const labelColor = dark
    ? "rgba(255,255,255,0.6)"
    : highlight
      ? PRIMARY_INK
      : INK_3;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
      <Text
        className="text-[9.5px] font-sans-bold tracking-widest uppercase"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      <Text
        className="text-[13px] font-sans-bold mt-0.5"
        style={{ color: fg, letterSpacing: -0.2 }}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionBtn({
  label,
  soft,
  filled,
  color,
  onPress,
}: {
  label: string;
  soft?: boolean;
  filled?: boolean;
  color?: string;
  onPress?: () => void;
}) {
  const bg = filled ? PRIMARY : "transparent";
  const fg = filled ? "#ffffff" : soft ? INK_3 : color ?? "#1a2120";
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center active:opacity-80"
      style={{
        backgroundColor: bg,
        paddingVertical: 13,
        borderRightWidth: filled ? 0 : 0.5,
        borderRightColor: "#ece6df",
      }}
    >
      <Text className="text-[13px] font-sans-bold" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}
