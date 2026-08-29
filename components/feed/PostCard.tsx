import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { FeedPost } from "@/api/services/feed";
import {
  Avatar,
  HashBody,
  INK_2,
  INK_3,
  LINE,
  PRIMARY,
  PRIMARY_INK,
  PRIMARY_SOFT,
  RolePill,
  SURFACE_2,
  TYPE_TAG,
  VerifiedTick,
  authorSubtitle,
} from "./FeedPrimitives";
import { VideoTile } from "./VideoTile";

/**
 * One feed post. Ports the web PostCard (components/feed/FeedUI.tsx) element
 * for element: type tag, hashtag body, project chip, image collage, market
 * insight card with bars, listing card, poll with live percentages, and the
 * like / comment / save / share bar.
 */
export function PostCard({
  post,
  onLike,
  onSave,
  onComments,
  onShare,
  onVote,
  onProfile,
  onListing,
  onHashtag,
  onMore,
  onImage,
}: {
  post: FeedPost;
  onLike: () => void;
  onSave: () => void;
  onComments: () => void;
  onShare: () => void;
  onVote: (optionId: string) => void;
  onProfile: () => void;
  onListing: () => void;
  onHashtag: (tag: string) => void;
  onMore: () => void;
  onImage: (index: number) => void;
}) {
  const tag = TYPE_TAG[post.type];
  const pollEnded =
    post.poll?.endsAt != null && new Date(post.poll.endsAt) < new Date();

  return (
    <View className="bg-white rounded-[20px] p-4 mb-4">
      {/* Head */}
      <View className="flex-row items-center gap-3">
        <Avatar author={post.author} size={48} onPress={onProfile} />
        <View className="flex-1">
          <Pressable
            onPress={onProfile}
            className="flex-row items-center gap-1.5 active:opacity-70"
          >
            <Text
              numberOfLines={1}
              className="text-ink text-[15.5px] font-sans-bold shrink"
            >
              {post.author.name}
            </Text>
            {post.author.verified && <VerifiedTick />}
            <RolePill role={post.author.role} />
          </Pressable>
          <Text numberOfLines={1} className="text-ink-3 text-[12.5px] mt-0.5">
            {authorSubtitle(post.author, post.createdAt)}
          </Text>
        </View>
        <Pressable
          onPress={onMore}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Post options"
          className="w-[34px] h-[34px] rounded-full items-center justify-center active:opacity-60"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={INK_3} />
        </Pressable>
      </View>

      {tag && (
        <View className="flex-row items-center gap-1.5 mt-3.5">
          <Ionicons name={tag.icon} size={13} color={tag.color} />
          <Text
            className="text-[11px] font-sans-bold uppercase"
            style={{ color: tag.color, letterSpacing: 0.4 }}
          >
            {tag.label}
          </Text>
        </View>
      )}

      <View className="mt-3">
        <HashBody text={post.body} onHashtag={onHashtag} />
      </View>

      {post.project && (
        <View
          className="mt-3 self-start flex-row items-center gap-2 px-3.5 py-2 rounded-full"
          style={{ backgroundColor: SURFACE_2 }}
        >
          <Ionicons name="business" size={13} color={INK_3} />
          <Text className="text-ink-2 text-[13px] font-sans-semibold">
            {[post.project.name, post.project.location, post.project.units]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      )}

      {/* A post carries either a collage or one clip, never both — the server
          drops images when a video is present. */}
      {post.videos.length > 0 ? (
        <VideoTile uri={post.videos[0]} />
      ) : (
        post.images.length > 0 && (
          <ImageCollage images={post.images} onPress={onImage} />
        )
      )}

      {post.insight && (
        <View
          className="mt-4 rounded-2xl overflow-hidden"
          style={{ borderWidth: 1, borderColor: LINE }}
        >
          <View
            className="flex-row items-center gap-2.5 px-4 py-3.5"
            style={{ backgroundColor: PRIMARY_SOFT }}
          >
            <Ionicons name="trending-up" size={17} color={PRIMARY} />
            <Text className="flex-1 text-ink text-sm font-sans-bold">
              {post.insight.metric}
              {post.insight.period ? ` · ${post.insight.period}` : ""}
            </Text>
            {!!post.insight.delta && (
              <Text
                className="text-[13px] font-sans-bold"
                style={{ color: PRIMARY }}
              >
                {post.insight.delta}
              </Text>
            )}
          </View>
          {post.insight.bars.length > 0 && (
            <View className="flex-row items-end gap-1.5 px-4 py-4 h-[120px]">
              {post.insight.bars.map((h, i) => (
                <View
                  key={i}
                  className="flex-1 rounded-t-[5px]"
                  style={{
                    height: `${Math.max(10, h)}%`,
                    minHeight: 14,
                    backgroundColor: PRIMARY,
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {post.listing && (
        <Pressable
          onPress={onListing}
          className="mt-4 rounded-2xl overflow-hidden flex-row active:opacity-90"
          style={{ borderWidth: 1, borderColor: LINE }}
        >
          <Image
            source={{ uri: post.listing.coverImage }}
            style={{
              width: 120,
              alignSelf: "stretch",
              backgroundColor: "#16321f",
            }}
            contentFit="cover"
          />
          <View className="flex-1 p-3.5">
            <Text className="text-ink font-serif text-[21px]">
              {post.listing.priceLabel}
              {post.listing.period ? (
                <Text className="text-ink-3 text-xs font-sans-semibold">
                  {" "}
                  {post.listing.period}
                </Text>
              ) : null}
            </Text>
            <Text
              numberOfLines={1}
              className="text-ink text-[15px] font-sans-bold mt-1"
            >
              {post.listing.title}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Ionicons name="location-outline" size={11} color={INK_3} />
              <Text
                numberOfLines={1}
                className="text-ink-3 text-[12.5px] flex-1"
              >
                {post.listing.address}
              </Text>
            </View>
            <View className="flex-row gap-3.5 mt-2.5">
              {post.listing.beds > 0 && (
                <Stat icon="bed-outline" label={String(post.listing.beds)} />
              )}
              {post.listing.baths > 0 && (
                <Stat icon="water-outline" label={String(post.listing.baths)} />
              )}
              {!!post.listing.sqft && (
                <Stat
                  icon="resize-outline"
                  label={`${post.listing.sqft} m²`}
                />
              )}
            </View>
          </View>
        </Pressable>
      )}

      {post.poll && (
        <View className="mt-4 gap-2">
          {post.poll.options.map((opt) => {
            const total = post.poll!.totalVotes;
            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
            const lead =
              total > 0 &&
              opt.votes === Math.max(...post.poll!.options.map((o) => o.votes));
            const mine = post.viewer.votedOptionId === opt.id;
            return (
              <Pressable
                key={opt.id}
                disabled={pollEnded}
                onPress={() => onVote(opt.id)}
                className="rounded-xl px-4 py-3 overflow-hidden"
                style={{
                  borderWidth: 1,
                  borderColor: lead || mine ? PRIMARY : LINE,
                }}
              >
                {/* Result bar sits behind the label, as on web. */}
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: PRIMARY_SOFT,
                  }}
                />
                <View className="flex-row items-center">
                  <Text className="text-ink text-sm font-sans-bold">
                    {opt.text}
                  </Text>
                  {mine && (
                    <View className="ml-1.5">
                      <Ionicons name="checkmark" size={13} color={PRIMARY} />
                    </View>
                  )}
                  <Text
                    className="ml-auto text-sm font-sans-bold"
                    style={{ color: PRIMARY_INK }}
                  >
                    {pct}%
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Text className="text-ink-3 text-xs mt-0.5">
            {post.poll.totalVotes}{" "}
            {post.poll.totalVotes === 1 ? "vote" : "votes"}
            {pollEnded
              ? " · Final results"
              : post.poll.endsAt
                ? ` · Ends ${new Date(post.poll.endsAt).toLocaleDateString(
                    "en-NG",
                    { day: "numeric", month: "short" },
                  )}`
                : ""}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View
        className="flex-row items-center gap-1 mt-4 pt-3.5"
        style={{ borderTopWidth: 1, borderTopColor: "#ece6df" }}
      >
        <Action
          icon={post.viewer.liked ? "heart" : "heart-outline"}
          label={post.likesCount > 0 ? String(post.likesCount) : "Like"}
          active={post.viewer.liked}
          onPress={onLike}
        />
        <Action
          icon="chatbubble-outline"
          label={
            post.commentsCount > 0 ? String(post.commentsCount) : "Comment"
          }
          onPress={onComments}
        />
        <Action
          icon={post.viewer.saved ? "bookmark" : "bookmark-outline"}
          label={post.viewer.saved ? "Saved" : "Save"}
          active={post.viewer.saved}
          onPress={onSave}
        />
        <View className="ml-auto">
          <Action icon="share-social-outline" label="Share" onPress={onShare} />
        </View>
      </View>
    </View>
  );
}

type IonName = React.ComponentProps<typeof Ionicons>["name"];

function Stat({ icon, label }: { icon: IonName; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={13} color={INK_3} />
      <Text className="text-ink-2 text-[12.5px] font-sans-semibold">
        {label}
      </Text>
    </View>
  );
}

function Action({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IonName;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 px-3 py-2 rounded-full active:opacity-60"
    >
      <Ionicons name={icon} size={18} color={active ? PRIMARY : INK_2} />
      <Text
        className="text-[13.5px] font-sans-bold"
        style={{ color: active ? PRIMARY : INK_2 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * 1 image full-width; 2 side by side; 3+ a 2fr/1fr split with a "+N" overlay
 * on the third — the same arrangement the web CSS grid produces.
 */
function ImageCollage({
  images,
  onPress,
}: {
  images: string[];
  onPress: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  // Screen padding (20 each side) + card padding (16 each side).
  const w = width - 40 - 32;

  if (images.length === 1) {
    return (
      <Pressable
        onPress={() => onPress(0)}
        className="mt-4 rounded-2xl overflow-hidden"
      >
        <Image
          source={{ uri: images[0] }}
          style={{ width: w, height: 300, backgroundColor: "#16321f" }}
          contentFit="cover"
        />
      </Pressable>
    );
  }

  if (images.length === 2) {
    return (
      <View className="mt-4 rounded-2xl overflow-hidden flex-row gap-1">
        {images.map((src, i) => (
          <Pressable key={i} onPress={() => onPress(i)}>
            <Image
              source={{ uri: src }}
              style={{
                width: (w - 4) / 2,
                height: 170,
                backgroundColor: "#16321f",
              }}
              contentFit="cover"
            />
          </Pressable>
        ))}
      </View>
    );
  }

  const bigW = ((w - 4) * 2) / 3;
  const smallW = (w - 4) / 3;
  return (
    <View className="mt-4 rounded-2xl overflow-hidden flex-row gap-1">
      <Pressable onPress={() => onPress(0)}>
        <Image
          source={{ uri: images[0] }}
          style={{ width: bigW, height: 300, backgroundColor: "#16321f" }}
          contentFit="cover"
        />
      </Pressable>
      <View className="gap-1">
        <Pressable onPress={() => onPress(1)}>
          <Image
            source={{ uri: images[1] }}
            style={{ width: smallW, height: 148, backgroundColor: "#16321f" }}
            contentFit="cover"
          />
        </Pressable>
        <Pressable onPress={() => onPress(2)}>
          <Image
            source={{ uri: images[2] }}
            style={{ width: smallW, height: 148, backgroundColor: "#16321f" }}
            contentFit="cover"
          />
          {images.length > 3 && (
            <View
              className="items-center justify-center"
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(0,0,0,0.5)" },
              ]}
            >
              <Text className="text-white font-sans-bold text-lg">
                +{images.length - 3}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
