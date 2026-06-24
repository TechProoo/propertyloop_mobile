import { useCallback, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { Appear, PressableScale, stagger } from "@/components/anim/motion";
import messagesService, { type Conversation } from "@/api/services/messages";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type Tone = "primary" | "accent" | "neutral";

const toneForRole = (role?: string): Tone =>
  role === "VENDOR" ? "accent" : role === "AGENT" ? "primary" : "neutral";

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

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export default function InboxScreen({ vendor = false }: { vendor?: boolean } = {}) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await messagesService.listConversations();
      setItems(res.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = query.trim()
    ? items.filter((c) =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : items;

  const unreadTotal = items.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Appear from="down">
          <View className="px-5 pt-1 flex-row items-end justify-between">
            <View className="flex-1 pr-3">
              <Text
                className="text-[11px] font-sans-bold text-ink-3 uppercase"
                style={{ letterSpacing: 1.3 }}
              >
                Inbox
              </Text>
              <Text
                className="font-serif text-ink mt-1.5"
                style={{ fontSize: 28, lineHeight: 32, letterSpacing: -0.7 }}
              >
                {vendor && items.length === 0 ? (
                  <Text className="font-serif-italic">Conversations</Text>
                ) : (
                  <>
                    Your{" "}
                    <Text className="font-serif-italic">conversations</Text>
                  </>
                )}
              </Text>
              {unreadTotal > 0 ? (
                <Text className="text-[12px] font-sans-semibold text-primary mt-1">
                  {unreadTotal} unread
                </Text>
              ) : null}
            </View>
            <PressableScale
              onPress={() => router.push("/new-message" as Href)}
              activeScale={0.9}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: PRIMARY,
                shadowColor: PRIMARY,
                shadowOpacity: 0.28,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <Ionicons name="create-outline" size={20} color="#ffffff" />
            </PressableScale>
          </View>
        </Appear>

        {/* Search */}
        <Appear delay={60} from="down">
          <View className="px-5 pt-4">
            <View
              className="bg-white rounded-full px-4 py-3 flex-row items-center gap-2.5"
              style={{
                borderWidth: 1,
                borderColor: "#ece6df",
                shadowColor: "#1a2120",
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              }}
            >
              <Ionicons name="search" size={17} color={INK_2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search messages"
                placeholderTextColor={INK_3}
                className="flex-1 text-[14px] text-ink font-sans-medium"
                style={{ paddingVertical: 0 }}
              />
              {query.length > 0 ? (
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={INK_3}
                  onPress={() => setQuery("")}
                />
              ) : null}
            </View>
          </View>
        </Appear>

        {/* List */}
        {loading ? (
          <View className="py-20 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : error ? (
          <Empty
            icon="cloud-offline-outline"
            title="Couldn’t load messages"
            body="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => {
              setLoading(true);
              load();
            }}
          />
        ) : filtered.length === 0 ? (
          <Empty
            icon="chatbubbles-outline"
            title={query ? "No matches" : "No conversations yet"}
            body={
              query
                ? "Try a different name."
                : "Message an agent or vendor from a listing to start a conversation."
            }
          />
        ) : (
          <View className="px-3 pt-3">
            {filtered.map((c, i) => (
              <ConversationRow key={c.id} conv={c} index={i} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConversationRow({
  conv,
  index,
}: {
  conv: Conversation;
  index: number;
}) {
  const hasUnread = conv.unread > 0;
  const preview = `${conv.lastMessageIsYou ? "You: " : ""}${conv.lastMessage || "No messages yet"}`;
  return (
    <Appear delay={stagger(index)}>
      <PressableScale
        onPress={() => router.push(`/conversation/${conv.id}` as Href)}
        activeScale={0.98}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 10,
          paddingVertical: 11,
          borderRadius: 20,
          marginBottom: 2,
          backgroundColor: hasUnread ? "rgba(31,111,67,0.06)" : "transparent",
        }}
      >
        <View>
          <PLAvatar
            initials={initialsOf(conv.name)}
            uri={conv.avatar}
            size={52}
            tone={toneForRole(conv.role)}
          />
          {hasUnread ? (
            <View
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: PRIMARY,
                borderWidth: 2.5,
                borderColor: "#ffffff",
              }}
            />
          ) : null}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text
              className={`text-[15px] text-ink ${
                hasUnread ? "font-sans-bold" : "font-sans-semibold"
              }`}
              numberOfLines={1}
              style={{ maxWidth: 200 }}
            >
              {conv.name}
            </Text>
            {conv.role === "AGENT" || conv.role === "VENDOR" ? (
              <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
            ) : null}
            <Text
              className={`ml-auto text-[11px] font-sans-semibold ${
                hasUnread ? "text-primary" : "text-ink-3"
              }`}
            >
              {timeAgo(conv.lastMessageAt)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 mt-1">
            <Text
              className={`text-[13px] flex-1 ${
                hasUnread ? "font-sans-semibold text-ink-2" : "text-ink-3"
              }`}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {hasUnread && (
              <View
                className="bg-primary rounded-full items-center justify-center"
                style={{ minWidth: 20, height: 20, paddingHorizontal: 6 }}
              >
                <Text className="text-[10.5px] font-sans-bold text-white">
                  {conv.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </PressableScale>
    </Appear>
  );
}

function Empty({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Appear delay={80} from="fade">
      <View className="px-8 pt-24 items-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <Ionicons name={icon} size={32} color={PRIMARY} />
        </View>
        <Text className="text-[17px] font-sans-bold text-ink mt-5 text-center">
          {title}
        </Text>
        <Text className="text-[13px] text-ink-3 mt-2 text-center leading-5">
          {body}
        </Text>
        {actionLabel && onAction && (
          <PressableScale
            onPress={onAction}
            activeScale={0.95}
            style={{
              marginTop: 18,
              paddingHorizontal: 20,
              paddingVertical: 11,
              borderRadius: 999,
              backgroundColor: INK,
            }}
          >
            <Text className="text-white text-[13px] font-sans-bold">
              {actionLabel}
            </Text>
          </PressableScale>
        )}
      </View>
    </Appear>
  );
}
