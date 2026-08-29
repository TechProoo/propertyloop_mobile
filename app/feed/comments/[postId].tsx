import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Stack,
  router,
  useLocalSearchParams,
  type Href,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import feedService, { type FeedComment } from "@/api/services/feed";
import { useAuth } from "@/context/auth";
import {
  Avatar,
  INK_3,
  PRIMARY,
  RolePill,
  SURFACE_2,
  VerifiedTick,
  timeAgo,
} from "@/components/feed/FeedPrimitives";
import { tapLight } from "@/lib/haptics";
import { queuePostPatch } from "@/components/feed/feedSync";

/**
 * Comments for one post. The web renders this as a right-hand drawer; on a
 * phone it's a pushed screen, but the behaviour matches: one level of
 * threading (replies hang off a top-level comment, replies can't be replied
 * to), newest appended at the bottom, and the total counts replies too.
 */
export default function FeedCommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { requireAuth } = useAuth();
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [sending, setSending] = useState(false);

  const total = comments
    ? comments.reduce((a, c) => a + 1 + (c.replies?.length ?? 0), 0)
    : 0;

  useEffect(() => {
    if (!postId) return;
    feedService
      .comments(postId)
      .then(setComments)
      .catch(() => setComments([]));
  }, [postId]);

  const send = async () => {
    if (!requireAuth("comment")) return;
    if (!draft.trim() || sending || !postId) return;
    setSending(true);
    try {
      const c = await feedService.addComment(
        postId,
        draft.trim(),
        replyTo?.id,
      );
      setComments((prev) => {
        if (!prev) return prev;
        if (c.parentId) {
          return prev.map((top) =>
            top.id === c.parentId
              ? { ...top, replies: [...(top.replies ?? []), c] }
              : top,
          );
        }
        return [...prev, { ...c, replies: [] }];
      });
      queuePostPatch(postId, { commentsCount: total + 1 });
      setDraft("");
      setReplyTo(null);
    } catch {
      /* keep the draft so nothing is lost */
    }
    setSending(false);
  };

  // Top-level comments, each followed by its replies — flattened so one
  // FlatList can render both with the right indent.
  const rows: { comment: FeedComment; reply: boolean }[] = [];
  for (const c of comments ?? []) {
    rows.push({ comment: c, reply: false });
    for (const r of c.replies ?? []) rows.push({ comment: r, reply: true });
  }

  const openProfile = (userId: string) => {
    router.push(`/feed/user/${userId}` as Href);
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View
          className="flex-row items-center justify-between px-5 py-3"
          style={{ borderBottomWidth: 1, borderBottomColor: "#ece6df" }}
        >
          <Text className="text-ink text-[17px] font-sans-bold">
            Comments{comments ? ` · ${total}` : ""}
          </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: SURFACE_2 }}
          >
            <Ionicons name="close" size={18} color="#4d524f" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <FlatList
            data={rows}
            keyExtractor={(r) => r.comment.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View
                className="flex-row gap-2.5 mb-4"
                style={item.reply ? { marginLeft: 46 } : undefined}
              >
                <Avatar
                  author={item.comment.author}
                  size={38}
                  onPress={() => openProfile(item.comment.author.id)}
                />
                <View className="flex-1">
                  <View
                    className="px-3.5 py-2.5"
                    style={{
                      backgroundColor: SURFACE_2,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 16,
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-ink text-[13.5px] font-sans-bold">
                        {item.comment.author.name}
                      </Text>
                      {item.comment.author.verified && (
                        <VerifiedTick size={12} />
                      )}
                      <RolePill role={item.comment.author.role} />
                    </View>
                    <Text className="text-ink text-sm mt-0.5 leading-5">
                      {item.comment.body}
                    </Text>
                  </View>
                  <View className="flex-row gap-4 mt-1.5 pl-1">
                    {!item.reply && (
                      <Pressable
                        onPress={() => {
                          tapLight();
                          setReplyTo(item.comment);
                        }}
                        hitSlop={6}
                      >
                        <Text className="text-ink-3 text-xs font-sans-bold">
                          Reply
                        </Text>
                      </Pressable>
                    )}
                    <Text className="text-ink-3 text-xs font-sans-bold">
                      {timeAgo(item.comment.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              comments === null ? (
                <View className="py-16 items-center">
                  <ActivityIndicator color={PRIMARY} />
                </View>
              ) : (
                <View className="py-16 items-center">
                  <Ionicons name="chatbubble-outline" size={32} color={INK_3} />
                  <Text className="text-ink-3 text-[13px] mt-3">
                    No comments yet. Say something.
                  </Text>
                </View>
              )
            }
          />

          {/* Composer */}
          <View
            className="px-4 pt-2 pb-2"
            style={{ borderTopWidth: 1, borderTopColor: "#ece6df" }}
          >
            {replyTo && (
              <View className="flex-row items-center gap-2 pb-2">
                <Text className="text-ink-3 text-xs flex-1">
                  Replying to{" "}
                  <Text className="font-sans-bold text-ink-2">
                    {replyTo.author.name}
                  </Text>
                </Text>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                  <Ionicons name="close" size={16} color={INK_3} />
                </Pressable>
              </View>
            )}
            <View className="flex-row items-end gap-2">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={replyTo ? "Write a reply…" : "Add a comment…"}
                placeholderTextColor="#7f857f"
                multiline
                maxLength={2000}
                className="flex-1 bg-cream-2 rounded-2xl px-4 py-3 text-ink text-[15px] max-h-28"
              />
              <Pressable
                onPress={send}
                disabled={!draft.trim() || sending}
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{
                  backgroundColor: PRIMARY,
                  opacity: !draft.trim() || sending ? 0.4 : 1,
                }}
              >
                {sending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#ffffff" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
