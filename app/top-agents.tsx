// Top agents — the full, paginated directory behind the Home rail's
// "View more". Agents are ranked by listing count (same ordering as the
// rail), each row opening the agent's public profile.
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { PressableScale } from "@/components/anim";
import { tapLight } from "@/lib/haptics";
import agentsService, { type PublicAgent } from "@/api/services/agents";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const ACCENT = "#b9842c";

const PAGE_SIZE = 20;

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function TopAgentsScreen() {
  const [items, setItems] = useState<PublicAgent[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const fetchPage = useCallback(async (p: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError(false);
    try {
      const res = await agentsService.list({
        sort: "most_listings",
        page: p,
        limit: PAGE_SIZE,
      });
      setItems((prev) =>
        replace
          ? res.items
          : [
              ...prev,
              ...res.items.filter((n) => !prev.some((o) => o.id === n.id)),
            ],
      );
      setPage(p);
      setPages(res.pages);
    } catch {
      if (replace) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = () => {
    if (!loading && !loadingMore && page < pages) fetchPage(page + 1, false);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center gap-2.5 px-4 pt-1 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Top agents</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={28} color={INK_3} />
          <Text className="text-[15px] font-sans-bold text-ink mt-3 text-center">
            Couldn’t load agents
          </Text>
          <Pressable
            onPress={() => fetchPage(1, true)}
            className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
          >
            <Text className="text-white text-[13px] font-sans-bold">Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => <AgentRow agent={item} />}
          ListEmptyComponent={
            <View className="items-center px-6 py-16">
              <Ionicons name="people-outline" size={28} color={INK_3} />
              <Text className="text-[13px] text-ink-3 mt-3 text-center">
                No agents to show yet.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <BouncyLoader color={PRIMARY} style={{ marginTop: 8 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function AgentRow({ agent }: { agent: PublicAgent }) {
  // No rating shown until the agent has actually been rated.
  const hasRating = (agent.rating ?? 0) > 0;
  const meta = [
    `${agent.listingsCount ?? 0} listing${(agent.listingsCount ?? 0) === 1 ? "" : "s"}`,
    agent.location ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PressableScale
      onPress={() => {
        tapLight();
        router.push(`/agent-profile/${agent.id}` as Href);
      }}
      activeScale={0.98}
      className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line"
      style={{ borderWidth: 0.5 }}
    >
      <PLAvatar
        initials={initialsOf(agent.name)}
        uri={agent.avatarUrl ?? undefined}
        size={46}
        tone="primary"
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
            {agent.name}
          </Text>
          {agent.verified && (
            <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
          )}
        </View>
        <View className="flex-row items-center gap-1 mt-0.5">
          {hasRating && (
            <>
              <Ionicons name="star" size={11} color={ACCENT} />
              <Text className="text-[11.5px] font-sans-bold text-ink">
                {agent.rating}
              </Text>
              <Text className="text-[11.5px] text-ink-3">·</Text>
            </>
          )}
          <Text className="text-[11.5px] font-sans-semibold text-ink-3" numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={15} color={INK_3} />
    </PressableScale>
  );
}
