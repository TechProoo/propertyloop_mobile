import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LOGBOOK, type LogbookEvent } from "@/mocks/buyer-extra";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TABS = ["All", "Verified", "Owner"] as const;
type TabId = (typeof TABS)[number];

export default function LogbookScreen() {
  const [tab, setTab] = useState<TabId>("All");
  const events =
    tab === "Verified"
      ? LOGBOOK.events.filter((e) => e.verified)
      : tab === "Owner"
        ? LOGBOOK.events.filter((e) => !e.verified)
        : LOGBOOK.events;

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
          Logbook
        </Text>
        <Pressable
          onPress={() => router.push("/logbook-info" as Href)}
          hitSlop={8}
        >
          <Ionicons name="information-circle-outline" size={20} color={INK_2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Property hero */}
        <View className="px-5 pt-1">
          <View
            className="bg-white rounded-2xl overflow-hidden flex-row gap-3 p-3 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Image
              source={`https://picsum.photos/seed/${LOGBOOK.property.imageSeed}/200/200`}
              style={{ width: 64, height: 64, borderRadius: 12 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase"
                style={{ color: PRIMARY_INK }}
              >
                Property Logbook
              </Text>
              <Text className="text-[14.5px] font-sans-bold text-ink mt-0.5">
                {LOGBOOK.property.name}
              </Text>
              <Text className="text-[11.5px] text-ink-3">
                {LOGBOOK.property.area} · {LOGBOOK.property.since}
              </Text>
            </View>
          </View>

          {/* Summary stat strip */}
          <View className="flex-row gap-2 mt-3">
            <Stat n={String(LOGBOOK.summary.entries)} l="Entries" />
            <Stat n={String(LOGBOOK.summary.verified)} l="Verified" tone="primary" />
            <Stat n={String(LOGBOOK.summary.selfReported)} l="Owner" />
            <Stat n={LOGBOOK.summary.spend} l="Spend" />
          </View>
        </View>

        {/* Tabs */}
        <View
          className="flex-row gap-5 px-5 mt-5 border-line"
          style={{ borderBottomWidth: 0.5 }}
        >
          {TABS.map((t) => {
            const on = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={{
                  paddingBottom: 12,
                  marginBottom: -1,
                  borderBottomWidth: on ? 2 : 0,
                  borderBottomColor: "#1a2120",
                }}
              >
                <Text
                  className={`text-[13px] ${
                    on ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"
                  }`}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Timeline */}
        <View className="px-5 pt-4">
          {events.map((e, i) => (
            <EventRow key={e.id} event={e} last={i === events.length - 1} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  n,
  l,
  tone,
}: {
  n: string;
  l: string;
  tone?: "primary";
}) {
  return (
    <View
      className="flex-1 rounded-xl border-line px-2 py-2.5"
      style={{
        borderWidth: 0.5,
        backgroundColor: tone === "primary" ? "#e3efe7" : "#ffffff",
      }}
    >
      <Text
        className="font-serif"
        style={{
          fontSize: 18,
          letterSpacing: -0.3,
          color: tone === "primary" ? PRIMARY_INK : "#1a2120",
        }}
      >
        {n}
      </Text>
      <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
        {l}
      </Text>
    </View>
  );
}

function EventRow({ event, last }: { event: LogbookEvent; last: boolean }) {
  return (
    <View className="flex-row gap-3" style={{ alignItems: "stretch" }}>
      {/* Rail */}
      <View style={{ width: 32, alignItems: "center" }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: event.verified ? PRIMARY : "#f0f0f0",
            borderWidth: event.verified ? 0 : 1.5,
            borderColor: "#d3cdc1",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {event.verified && (
            <Ionicons name="checkmark" size={12} color="#ffffff" />
          )}
        </View>
        {!last && (
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor: "#e1dcd3",
              marginVertical: 4,
              minHeight: 16,
            }}
          />
        )}
      </View>

      {/* Card */}
      <View
        className="flex-1 bg-white rounded-2xl px-3.5 py-3 border-line"
        style={{ borderWidth: 0.5, marginBottom: last ? 0 : 12 }}
      >
        <View className="flex-row items-baseline justify-between gap-2">
          <Text
            className="text-[10.5px] font-sans-bold tracking-widest uppercase"
            style={{ color: event.verified ? PRIMARY_INK : ACCENT_INK }}
          >
            {event.category}
          </Text>
          <Text className="text-[11px] font-sans-semibold text-ink-3">
            {event.date}
          </Text>
        </View>
        <Text className="text-[14px] font-sans-bold text-ink mt-1">
          {event.title}
        </Text>
        <Text className="text-[12px] text-ink-3 mt-0.5 leading-5">
          {event.detail}
        </Text>
        <View className="flex-row items-center gap-3 mt-2 flex-wrap">
          {event.vendor && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="person-outline" size={12} color={INK_2} />
              <Text className="text-[11.5px] font-sans-semibold text-ink-2">
                {event.vendor}
              </Text>
            </View>
          )}
          {event.cost && (
            <Text className="text-[11.5px] font-sans-bold text-ink">
              {event.cost}
            </Text>
          )}
          {event.receipt && (
            <View className="flex-row items-center gap-1 ml-auto">
              <Ionicons name="document-attach-outline" size={12} color={ACCENT} />
              <Text className="text-[11px] font-sans-bold text-accent">
                Receipt
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
