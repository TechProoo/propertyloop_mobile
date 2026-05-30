import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SAVED_LISTINGS, SAVED_TABS, type SavedListing } from "@/mocks/saved";

const PRIMARY = "#1f6f43";
const ACCENT_INK = "#6b4a16";
const ACCENT_DOT = "#d18d2f";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/300/300`;
}

export default function SavedScreen() {
  const [tab, setTab] = useState<(typeof SAVED_TABS)[number]["id"]>("all");
  const [unsaved, setUnsaved] = useState<Set<string>>(new Set());

  const list = useMemo(
    () => SAVED_LISTINGS.filter((l) => !unsaved.has(l.id)),
    [unsaved],
  );

  const handleUnsave = (id: string, title: string) => {
    Alert.alert("Remove from shortlist?", title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setUnsaved((s) => new Set(s).add(id)),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-1">
          <Text
            className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase"
            style={{ letterSpacing: 1.3 }}
          >
            Saved
          </Text>
          <Text
            className="font-serif text-ink mt-1.5"
            style={{ fontSize: 32, lineHeight: 34, letterSpacing: -0.7 }}
          >
            Your <Text className="font-serif-italic">shortlist</Text>
          </Text>
        </View>

        {/* Tab strip */}
        <View
          className="flex-row gap-[18px] px-5 mt-3"
          style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
        >
          {SAVED_TABS.map((t) => {
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
                  className={`text-[13.5px] ${
                    isOn ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"
                  }`}
                >
                  {t.label} · {t.count}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Saved cards */}
        <View className="px-5 pt-4 gap-3.5">
          {list.map((c) => (
            <SavedCard key={c.id} card={c} onUnsave={handleUnsave} />
          ))}

          {/* Empty-state / collection prompt */}
          <Pressable
            onPress={() => {}}
            className="bg-cream-2 rounded-[18px] p-4 flex-row items-center gap-3 active:opacity-90"
            style={{
              borderWidth: 1,
              borderColor: LINE,
              borderStyle: "dashed",
              marginTop: 4,
            }}
          >
            <View className="w-[42px] h-[42px] rounded-xl bg-cream-3 items-center justify-center">
              <Ionicons name="add" size={20} color={INK_2} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-sans-bold text-ink">
                Start a new collection
              </Text>
              <Text className="text-xs text-ink-3 mt-0.5">
                Group homes by trip, budget, or whim.
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SavedCard({
  card,
  onUnsave,
}: {
  card: SavedListing;
  onUnsave: (id: string, title: string) => void;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/property/${card.id}` as Href)}
      className="bg-white rounded-[18px] overflow-hidden active:opacity-90"
      style={{ borderWidth: 0.5, borderColor: LINE }}
    >
      {/* Body */}
      <View className="flex-row gap-3 p-3">
        <Image
          source={picsum(card.imageSeed)}
          style={{ width: 110, height: 110, borderRadius: 12 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text
                className="text-[14.5px] font-sans-bold text-ink"
                style={{ letterSpacing: -0.1 }}
                numberOfLines={1}
              >
                {card.title}
              </Text>
              <Text className="text-xs text-ink-3 mt-0.5">{card.area}</Text>
            </View>
            <Pressable
              hitSlop={6}
              className="w-7 h-7 items-center justify-center"
              onPress={(e) => {
                e.stopPropagation();
                onUnsave(card.id, card.title);
              }}
            >
              <Ionicons name="heart" size={19} color={PRIMARY} />
            </Pressable>
          </View>

          <View className="flex-row items-baseline mt-2">
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 19, letterSpacing: -0.4 }}
            >
              {card.price}
            </Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3 ml-1">
              /yr
            </Text>
            {card.priceDropPct ? (
              <View className="ml-auto flex-row items-center gap-1">
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 6,
                    backgroundColor: ACCENT_DOT,
                  }}
                />
                <Text
                  className="text-[11px] font-sans-bold"
                  style={{ color: ACCENT_INK }}
                >
                  Price ↓ {card.priceDropPct}%
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-[11px] font-sans-semibold text-ink-3 mt-1">
            {card.savedAt}
          </Text>
        </View>
      </View>

      {/* Note overlay — accent-soft strip, italic Playfair */}
      {card.note ? (
        <View
          className="flex-row items-center gap-2 px-3.5 py-2.5 bg-accent-soft"
          style={{ borderTopWidth: 0.5, borderTopColor: LINE }}
        >
          <Text
            className="text-[11px] font-sans-bold tracking-widest uppercase"
            style={{ color: ACCENT_INK }}
          >
            Note
          </Text>
          <Text
            className="flex-1 text-[13.5px]"
            style={{
              color: "#3d2f12",
              fontFamily: "PlayfairDisplay_400Regular_Italic",
            }}
          >
            {card.note}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
