import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
  type Href,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import feedService, {
  type FeedMeta,
  type FeedPost,
} from "@/api/services/feed";
import { useAuth } from "@/context/auth";
import { PostCard } from "@/components/feed/PostCard";
import { FeedToast } from "@/components/feed/FeedToast";
import { useFeedInteractions } from "@/components/feed/useFeedInteractions";
import {
  Avatar,
  INK_3,
  LINE,
  PRIMARY,
  ACCENT,
} from "@/components/feed/FeedPrimitives";
import { PhotoViewer } from "@/components/PhotoViewer";
import { tapLight } from "@/lib/haptics";
import { drainFeedSync } from "@/components/feed/feedSync";

/**
 * Every filter the website exposes, flattened into one chip row. The web splits
 * them between a left sidebar (Home feed / Explore / Market insights /
 * Discussions / Saved) and a chip row (For you / Following / Insights /
 * Projects / Tips / News); a phone has one row, so they merge here.
 *
 * "for-you" isn't a server filter — listPosts ignores anything that isn't
 * following/saved/explore/a FeedPostType and falls back to newest-first, which
 * is exactly what the home feed should be.
 */
const FILTERS: { key: string; label: string; auth?: boolean }[] = [
  { key: "for-you", label: "For you" },
  { key: "following", label: "Following", auth: true },
  { key: "explore", label: "Explore" },
  { key: "INSIGHT", label: "Market insights" },
  { key: "PROJECT", label: "Completed projects" },
  { key: "TIP", label: "Property tips" },
  { key: "NEWS", label: "Industry news" },
  { key: "POLL", label: "Discussions" },
  { key: "saved", label: "Saved", auth: true },
];

const COMPOSER_SHORTCUTS: {
  label: string;
  type: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}[] = [
  { label: "Photo", type: "Photos", icon: "image-outline", color: PRIMARY },
  { label: "Insight", type: "Insight", icon: "trending-up", color: ACCENT },
  { label: "Project", type: "Project", icon: "business-outline", color: "#2a6f9e" },
  { label: "Poll", type: "Poll", icon: "stats-chart-outline", color: "#9e2a6f" },
];

const PAGE_SIZE = 10;

export default function FeedScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ hashtag?: string }>();
  const [filter, setFilter] = useState("for-you");
  // Seeded from the route so a hashtag tapped on a profile opens filtered.
  const [hashtag, setHashtag] = useState<string | null>(
    params.hashtag ?? null,
  );
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const feed = useFeedInteractions(setPosts);

  // Every fetch takes a ticket; only the newest one is allowed to write. Without
  // this, switching filters faster than the network could let an earlier
  // response land last and paint the wrong list.
  const reqId = useRef(0);

  const load = useCallback(
    async (opts: { page: number; filter: string; hashtag: string | null }) => {
      const ticket = ++reqId.current;
      const res = await feedService.list({
        filter: opts.hashtag ? undefined : opts.filter,
        hashtag: opts.hashtag ?? undefined,
        page: opts.page,
        limit: PAGE_SIZE,
      });
      if (ticket !== reqId.current) return;
      setPages(res.pages);
      setPage(res.page);
      setPosts((prev) =>
        opts.page === 1 ? res.items : [...prev, ...res.items],
      );
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load({ page: 1, filter, hashtag })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, hashtag, load]);

  // Meta (trending tags, people to follow, saved count) refreshes on focus so
  // a post made on the composer screen shows up in the trending list.
  useFocusEffect(
    useCallback(() => {
      feedService
        .meta()
        .then(setMeta)
        .catch(() => setMeta(null));

      // Pick up anything the composer or comments screen changed while they
      // were on top: new posts go to the front, comment counts get patched.
      const { created, patches } = drainFeedSync();
      if (created.length || patches.size) {
        setPosts((prev) => {
          const next = patches.size
            ? prev.map((p) =>
                patches.has(p.id) ? { ...p, ...patches.get(p.id) } : p,
              )
            : prev;
          if (!created.length) return next;
          const fresh = created.filter((c) => !next.some((p) => p.id === c.id));
          return [...fresh, ...next];
        });
      }
    }, []),
  );

  const selectFilter = (key: string, needsAuth?: boolean) => {
    if (needsAuth && !feed.requireAuth("see this")) return;
    tapLight();
    setHashtag(null);
    setFilter(key);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load({ page: 1, filter, hashtag });
      setMeta(await feedService.meta());
    } catch {
      /* keep what's on screen */
    } finally {
      setRefreshing(false);
    }
  };

  const onEndReached = async () => {
    if (loadingMore || loading || page >= pages) return;
    setLoadingMore(true);
    try {
      await load({ page: page + 1, filter, hashtag });
    } catch {
      /* leave the list as-is; pull to refresh retries */
    } finally {
      setLoadingMore(false);
    }
  };

  const openComposer = (type?: string) => {
    if (!feed.requireAuth("post to the community")) return;
    tapLight();
    router.push(
      (type ? `/feed/compose?type=${type}` : "/feed/compose") as Href,
    );
  };

  return (
    <View className="flex-1 bg-cream-2">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color="#4d524f" />
          </Pressable>
          <Text className="text-ink font-sans-bold text-base">Community</Text>
          <Pressable
            onPress={() => openComposer()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Create a post"
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListHeaderComponent={
            <View>
              {/* Composer prompt */}
              <Pressable
                onPress={() => openComposer()}
                className="bg-white rounded-[20px] p-4 mt-3 mb-4 active:opacity-90"
              >
                <View className="flex-row items-center gap-3">
                  <Avatar
                    author={{
                      name: user?.name ?? "You",
                      avatarUrl: user?.avatarUrl ?? null,
                    }}
                    size={40}
                  />
                  <Text className="text-ink-3 text-[14.5px] flex-1">
                    Share an update, insight, or project…
                  </Text>
                </View>
                <View
                  className="flex-row gap-1.5 mt-3.5 pt-3.5"
                  style={{ borderTopWidth: 1, borderTopColor: "#ece6df" }}
                >
                  {COMPOSER_SHORTCUTS.map((b) => (
                    <Pressable
                      key={b.label}
                      onPress={() => openComposer(b.type)}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-70"
                    >
                      <Ionicons name={b.icon} size={17} color={b.color} />
                      <Text className="text-ink-2 text-[13px] font-sans-bold">
                        {b.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Pressable>

              {hashtag ? (
                <View
                  className="flex-row items-center gap-3 bg-white rounded-full pl-5 pr-2 py-2 mb-4"
                  style={{ borderWidth: 1, borderColor: LINE }}
                >
                  <Text
                    className="text-[15px] font-sans-bold"
                    style={{ color: PRIMARY }}
                  >
                    #{hashtag}
                  </Text>
                  <Text className="text-ink-3 text-[13px]">Tagged posts</Text>
                  <Pressable
                    onPress={() => selectFilter("for-you")}
                    className="ml-auto flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cream-2 active:opacity-70"
                  >
                    <Ionicons name="close" size={13} color="#4d524f" />
                    <Text className="text-ink-2 text-[13px] font-sans-bold">
                      Clear
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                >
                  {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                      <Pressable
                        key={f.key}
                        onPress={() => selectFilter(f.key, f.auth)}
                        className="px-4 py-2 rounded-full"
                        style={{
                          borderWidth: 1,
                          borderColor: active ? "#1a2120" : LINE,
                          backgroundColor: active ? "#1a2120" : "#ffffff",
                        }}
                      >
                        <Text
                          className="text-[13.5px] font-sans-bold"
                          style={{ color: active ? "#ffffff" : "#4d524f" }}
                        >
                          {f.label}
                          {f.key === "saved" && meta?.savedCount
                            ? ` · ${meta.savedCount}`
                            : ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Trending now */}
              {!hashtag && !!meta?.trending.length && (
                <View className="mb-4">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Ionicons name="trending-up" size={14} color={INK_3} />
                    <Text className="text-ink-3 text-[11px] font-sans-bold uppercase tracking-widest">
                      Trending now
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {meta.trending.map((t) => (
                      <Pressable
                        key={t.tag}
                        onPress={() => {
                          tapLight();
                          setHashtag(t.tag.replace(/^#/, ""));
                        }}
                        className="bg-white px-3.5 py-2 rounded-full active:opacity-80"
                        style={{ borderWidth: 1, borderColor: LINE }}
                      >
                        <Text
                          className="text-[13px] font-sans-bold"
                          style={{ color: PRIMARY }}
                        >
                          {t.tag}{" "}
                          <Text className="text-ink-3 font-sans">{t.count}</Text>
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View>
              <PostCard
                post={item}
                onLike={() => void feed.handleLike(item)}
                onSave={() => void feed.handleSave(item)}
                onComments={() => feed.openComments(item.id)}
                onShare={() => void feed.handleShare(item)}
                onVote={(optionId) => void feed.handleVote(item, optionId)}
                onProfile={() => feed.openProfile(item.author.id)}
                onListing={() =>
                  item.listing && feed.openListing(item.listing.id)
                }
                onHashtag={(tag) => setHashtag(tag)}
                onMore={() => feed.openMore(item)}
                onImage={(i) => setLightbox({ images: item.images, index: i })}
              />
              {/* People to follow, slotted mid-feed the way web slots it into
                  the right sidebar. */}
              {index === Math.min(2, posts.length - 1) &&
                !!meta?.suggestions.length && (
                <Suggestions
                  meta={meta}
                  onFollow={(id) => void feed.handleFollow(id)}
                  onProfile={feed.openProfile}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <View className="py-20 items-center">
                <ActivityIndicator color={PRIMARY} />
              </View>
            ) : (
              <View className="py-16 items-center px-8">
                <Ionicons name="chatbubbles-outline" size={40} color={INK_3} />
                <Text className="text-ink font-sans-bold text-base mt-3 text-center">
                  {filter === "saved"
                    ? "Nothing saved yet"
                    : filter === "following"
                      ? "No posts from people you follow"
                      : "No posts yet"}
                </Text>
                <Text className="text-ink-3 text-[13px] mt-1 text-center leading-5">
                  {filter === "following"
                    ? "Follow a few agents and vendors to fill this up."
                    : "Be the first to share something with the community."}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator color={PRIMARY} />
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      <FeedToast message={feed.toast} />

      <PhotoViewer
        visible={lightbox !== null}
        images={lightbox?.images ?? []}
        initialIndex={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
      />
    </View>
  );
}

function Suggestions({
  meta,
  onFollow,
  onProfile,
}: {
  meta: FeedMeta;
  onFollow: (userId: string) => void;
  onProfile: (userId: string) => void;
}) {
  return (
    <View className="bg-white rounded-[20px] p-4 mb-4">
      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name="person-add-outline" size={14} color={INK_3} />
        <Text className="text-ink-3 text-[11px] font-sans-bold uppercase tracking-widest">
          People to follow
        </Text>
      </View>
      <View className="gap-3">
        {meta.suggestions.slice(0, 4).map((s) => (
          <View key={s.id} className="flex-row items-center gap-3">
            <Avatar author={s} size={40} onPress={() => onProfile(s.id)} />
            <Pressable
              onPress={() => onProfile(s.id)}
              className="flex-1 active:opacity-70"
            >
              <Text
                numberOfLines={1}
                className="text-ink text-[14px] font-sans-bold"
              >
                {s.name}
              </Text>
              <Text numberOfLines={1} className="text-ink-3 text-[12px]">
                {[s.agency || s.serviceCategory, `${s.followersCount} followers`]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onFollow(s.id)}
              className="px-3.5 py-1.5 rounded-full active:opacity-80"
              style={{ backgroundColor: PRIMARY }}
            >
              <Text className="text-white text-[12.5px] font-sans-bold">
                Follow
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
