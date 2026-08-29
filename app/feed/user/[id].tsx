import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
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
  type FeedPost,
  type FeedUserProfile,
} from "@/api/services/feed";
import { PostCard } from "@/components/feed/PostCard";
import { FeedToast } from "@/components/feed/FeedToast";
import { useFeedInteractions } from "@/components/feed/useFeedInteractions";
import {
  Avatar,
  INK_3,
  LINE,
  PRIMARY,
  ROLE_LABEL,
  RolePill,
  VerifiedTick,
} from "@/components/feed/FeedPrimitives";
import { PhotoViewer } from "@/components/PhotoViewer";
import { drainFeedSync } from "@/components/feed/feedSync";

const PAGE_SIZE = 10;

/** A feed author's profile and their posts — the mobile FeedProfile page. */
export default function FeedUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<FeedUserProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  // Keep the header's follow state and follower count in step with a follow
  // toggled from any post card in the list.
  const feed = useFeedInteractions(setPosts, {
    onFollowChange: (userId, following) =>
      setProfile((p) =>
        p && p.id === userId
          ? {
              ...p,
              viewer: { ...p.viewer, following },
              counts: {
                ...p.counts,
                followers: p.counts.followers + (following ? 1 : -1),
              },
            }
          : p,
      ),
  });

  const load = useCallback(
    async (nextPage: number) => {
      if (!id) return;
      const res = await feedService.userPosts(id, {
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setPages(res.pages);
      setPage(res.page);
      setPosts((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([feedService.userProfile(id), load(1)])
      .then(([p]) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, load]);

  // Same drain as the main list — a comment added from this screen's post, or
  // a post written while viewing your own profile, lands back here on focus.
  useFocusEffect(
    useCallback(() => {
      const { created, patches } = drainFeedSync();
      if (!created.length && !patches.size) return;
      setPosts((prev) => {
        const next = patches.size
          ? prev.map((p) =>
              patches.has(p.id) ? { ...p, ...patches.get(p.id) } : p,
            )
          : prev;
        const mine = created.filter(
          (c) => c.author.id === id && !next.some((p) => p.id === c.id),
        );
        return mine.length ? [...mine, ...next] : next;
      });
    }, [id]),
  );

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const [p] = await Promise.all([feedService.userProfile(id), load(1)]);
      setProfile(p);
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
      await load(page + 1);
    } catch {
      /* pull to refresh retries */
    } finally {
      setLoadingMore(false);
    }
  };

  const onFollow = async () => {
    if (!profile) return;
    const res = await feed.handleFollow(profile.id);
    if (typeof res === "boolean") {
      setProfile((p) =>
        p
          ? {
              ...p,
              viewer: { ...p.viewer, following: res },
              counts: {
                ...p.counts,
                followers: p.counts.followers + (res ? 1 : -1),
              },
            }
          : p,
      );
    }
  };

  const openRoleProfile = () => {
    if (!profile) return;
    if (profile.role === "AGENT") {
      router.push(`/agent-profile/${profile.id}` as Href);
    } else if (profile.role === "VENDOR") {
      router.push(`/vendor/${profile.id}` as Href);
    }
  };

  const joined = profile
    ? new Date(profile.createdAt).toLocaleDateString("en-NG", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <View className="flex-1 bg-cream-2">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center gap-3 px-5 pt-2 pb-1">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color="#4d524f" />
          </Pressable>
          <Text numberOfLines={1} className="text-ink font-sans-bold text-base">
            {profile?.name ?? "Profile"}
          </Text>
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
            profile ? (
              <View className="bg-white rounded-[20px] p-5 mt-3 mb-4">
                <View className="flex-row items-start gap-3">
                  <Avatar author={profile} size={64} />
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5">
                      <Text
                        numberOfLines={1}
                        className="text-ink text-[19px] font-sans-bold shrink"
                      >
                        {profile.name}
                      </Text>
                      {profile.verified && <VerifiedTick size={16} />}
                    </View>
                    <View className="flex-row mt-1">
                      <RolePill role={profile.role} />
                    </View>
                    <Text className="text-ink-3 text-[12.5px] mt-1.5">
                      {[
                        ROLE_LABEL[profile.role] ?? profile.role,
                        profile.agency,
                        profile.serviceCategory,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                </View>

                {!profile.viewer.isSelf && (
                  <View className="flex-row gap-2 mt-4">
                    <Pressable
                      onPress={onFollow}
                      className="flex-1 rounded-full py-3 items-center"
                      style={
                        profile.viewer.following
                          ? { borderWidth: 1, borderColor: LINE }
                          : { backgroundColor: PRIMARY }
                      }
                    >
                      <Text
                        className="text-[14px] font-sans-bold"
                        style={{
                          color: profile.viewer.following ? "#4d524f" : "#fff",
                        }}
                      >
                        {profile.viewer.following ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                    {(profile.role === "AGENT" ||
                      profile.role === "VENDOR") && (
                      <Pressable
                        onPress={openRoleProfile}
                        className="flex-1 rounded-full py-3 items-center"
                        style={{ borderWidth: 1, borderColor: LINE }}
                      >
                        <Text className="text-ink-2 text-[14px] font-sans-bold">
                          View full profile
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Counts */}
                <View className="flex-row mt-5">
                  {[
                    { n: profile.counts.posts, l: "Posts" },
                    { n: profile.counts.followers, l: "Followers" },
                    { n: profile.counts.following, l: "Following" },
                  ].map((s) => (
                    <View key={s.l} className="flex-1 items-center">
                      <Text className="text-ink text-[17px] font-sans-bold">
                        {s.n}
                      </Text>
                      <Text className="text-ink-3 text-[11.5px] mt-0.5">
                        {s.l}
                      </Text>
                    </View>
                  ))}
                </View>

                {!!profile.bio && (
                  <Text className="text-ink-2 text-[14px] leading-5 mt-4">
                    {profile.bio}
                  </Text>
                )}

                <View className="mt-3 gap-1.5">
                  {!!profile.location && (
                    <Meta icon="location-outline" text={profile.location} />
                  )}
                  {!!profile.serviceArea && (
                    <Meta
                      icon="map-outline"
                      text={`Serves ${profile.serviceArea}`}
                    />
                  )}
                  {!!profile.businessAddress && (
                    <Meta
                      icon="business-outline"
                      text={profile.businessAddress}
                    />
                  )}
                  {!!profile.specialty?.length && (
                    <Meta
                      icon="pricetag-outline"
                      text={profile.specialty.join(", ")}
                    />
                  )}
                  {typeof profile.rating === "number" && profile.rating > 0 && (
                    <Meta
                      icon="star-outline"
                      text={`${profile.rating.toFixed(1)} rating`}
                    />
                  )}
                  {typeof profile.listingsCount === "number" && (
                    <Meta
                      icon="home-outline"
                      text={`${profile.listingsCount} listings`}
                    />
                  )}
                  {typeof profile.jobsCount === "number" && (
                    <Meta
                      icon="hammer-outline"
                      text={`${profile.jobsCount} jobs completed`}
                    />
                  )}
                  {!!profile.website && (
                    <Pressable
                      onPress={() =>
                        Linking.openURL(
                          profile.website!.startsWith("http")
                            ? profile.website!
                            : `https://${profile.website}`,
                        ).catch(() => {})
                      }
                    >
                      <Meta
                        icon="link-outline"
                        text={profile.website.replace(/^https?:\/\//, "")}
                        tint={PRIMARY}
                      />
                    </Pressable>
                  )}
                  <Meta icon="calendar-outline" text={`Joined ${joined}`} />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => void feed.handleLike(item)}
              onSave={() => void feed.handleSave(item)}
              onComments={() => feed.openComments(item.id)}
              onShare={() => void feed.handleShare(item)}
              onVote={(optionId) => void feed.handleVote(item, optionId)}
              onProfile={() => feed.openProfile(item.author.id)}
              onListing={() => item.listing && feed.openListing(item.listing.id)}
              onHashtag={() => router.push("/feed" as Href)}
              onMore={() => feed.openMore(item)}
              onImage={(i) => setLightbox({ images: item.images, index: i })}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <View className="py-20 items-center">
                <ActivityIndicator color={PRIMARY} />
              </View>
            ) : (
              <View className="py-14 items-center">
                <Text className="text-ink-3 text-[13px]">No posts yet.</Text>
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

function Meta({
  icon,
  text,
  tint,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
  tint?: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={14} color={tint ?? INK_3} />
      <Text
        className="text-[13px] flex-1"
        style={{ color: tint ?? "#4d524f" }}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}
