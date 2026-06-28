import { useCallback, useState } from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { Image } from "expo-image";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import bookmarksService, {
  type PropertyBookmark,
} from "@/api/services/bookmarks";
import { toggleSaved } from "@/lib/favourites";
import { Appear, PressableScale, Reveal, RevealScrollView } from "@/components/anim";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

export default function SavedScreen() {
  const [items, setItems] = useState<PropertyBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await bookmarksService.listProperties();
      setItems(res.filter((b) => b.listing));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever the tab regains focus so newly-saved homes appear.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const unsave = (b: PropertyBookmark) => {
    Alert.alert("Remove from shortlist?", b.listing?.title ?? "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          toggleSaved(b.listingId); // optimistic + server
          setItems((arr) => arr.filter((x) => x.id !== b.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <RevealScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Appear>
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
            {!loading && items.length > 0 ? (
              <Text className="font-sans-semibold text-ink-3" style={{ fontSize: 16 }}>
                {"  "}· {items.length}
              </Text>
            ) : null}
          </Text>
        </View>
        </Appear>

        {loading ? (
          <View className="py-20 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : error ? (
          <EmptyBlock
            icon="cloud-offline-outline"
            title="Couldn’t load your shortlist"
            body="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => {
              setLoading(true);
              load();
            }}
          />
        ) : items.length === 0 ? (
          <EmptyBlock
            icon="heart-outline"
            title="No saved homes yet"
            body="Tap the heart on any home to add it to your shortlist."
            actionLabel="Browse homes"
            onAction={() => router.push("/(tabs)" as Href)}
          />
        ) : (
          <View className="px-5 pt-5 gap-3.5">
            {items.map((b) => (
              <Animated.View
                key={b.id}
                exiting={FadeOut.duration(220)}
                layout={LinearTransition.springify().damping(20).stiffness(160)}
              >
                <Reveal>
                  <SavedCard bookmark={b} onUnsave={() => unsave(b)} />
                </Reveal>
              </Animated.View>
            ))}
          </View>
        )}
      </RevealScrollView>
    </SafeAreaView>
  );
}

function SavedCard({
  bookmark,
  onUnsave,
}: {
  bookmark: PropertyBookmark;
  onUnsave: () => void;
}) {
  const l = bookmark.listing!;
  return (
    <PressableScale
      onPress={() => router.push(`/property/${l.id}` as Href)}
      activeScale={0.975}
      className="bg-white rounded-[18px] overflow-hidden"
      style={{ borderWidth: 0.5, borderColor: LINE }}
    >
      <View className="flex-row gap-3 p-3">
        <Image
          source={l.coverImage}
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
                {l.title}
              </Text>
              <Text className="text-xs text-ink-3 mt-0.5" numberOfLines={1}>
                {l.location}
              </Text>
            </View>
            <Pressable
              hitSlop={6}
              className="w-7 h-7 items-center justify-center"
              onPress={(e) => {
                e.stopPropagation();
                onUnsave();
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
              {l.priceLabel}
            </Text>
            {!!l.period && (
              <Text className="text-[11px] font-sans-semibold text-ink-3 ml-1">
                {l.period}
              </Text>
            )}
            <View className="ml-auto flex-row items-center gap-1">
              <Ionicons name="star" size={12} color={ACCENT} />
              <Text className="text-[11px] font-sans-bold text-ink-2">
                {l.rating}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-2">
            <Stat icon="bed-outline" value={`${l.beds} bed`} />
            <Stat icon="water-outline" value={`${l.baths} bath`} />
            {!!l.sqft && <Stat icon="resize-outline" value={`${l.sqft} m²`} />}
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

function Stat({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={13} color={INK_2} />
      <Text className="text-[11.5px] font-sans-semibold text-ink-2">{value}</Text>
    </View>
  );
}

function EmptyBlock({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Appear from="fade" duration={500}>
    <View className="px-5 pt-16 items-center">
      <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={28} color={INK_2} />
      </View>
      <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
        {title}
      </Text>
      <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
        {body}
      </Text>
      <PressableScale
        onPress={onAction}
        className="mt-5 px-5 py-2.5 rounded-full bg-ink"
      >
        <Text className="text-white text-[13px] font-sans-bold">{actionLabel}</Text>
      </PressableScale>
    </View>
    </Appear>
  );
}
