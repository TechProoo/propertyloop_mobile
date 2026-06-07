import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import messagesService, { type Conversation } from "@/api/services/messages";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

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

export default function InboxScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-1 flex-row items-end justify-between">
          <View>
            <Text
              className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase"
              style={{ letterSpacing: 1.3 }}
            >
              Inbox
            </Text>
            <Text
              className="font-serif text-ink mt-1.5"
              style={{ fontSize: 32, lineHeight: 34, letterSpacing: -0.7 }}
            >
              Your <Text className="font-serif-italic">conversations</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/new-message" as Href)}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="create-outline" size={18} color={INK} />
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-5 pt-4">
          <View
            className="bg-white rounded-full px-3.5 py-3 flex-row items-center gap-2.5 border-line"
            style={{ borderWidth: 1 }}
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
          </View>
        </View>

        {/* List */}
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color={PRIMARY} />
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
          <View className="px-2 pt-2">
            {filtered.map((c) => (
              <ConversationRow key={c.id} conv={c} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConversationRow({ conv }: { conv: Conversation }) {
  const hasUnread = conv.unread > 0;
  const preview = `${conv.lastMessageIsYou ? "You: " : ""}${conv.lastMessage || "No messages yet"}`;
  return (
    <Pressable
      onPress={() => router.push(`/conversation/${conv.id}` as Href)}
      className="flex-row items-center gap-3 px-3 py-3 active:bg-cream-2"
      style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
    >
      <PLAvatar initials={initialsOf(conv.name)} size={48} tone="primary" />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-[14.5px] font-sans-bold text-ink"
            numberOfLines={1}
            style={{ maxWidth: 200 }}
          >
            {conv.name}
          </Text>
          {conv.role === "AGENT" || conv.role === "VENDOR" ? (
            <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
          ) : null}
          <Text className="ml-auto text-[11px] font-sans-semibold text-ink-3">
            {timeAgo(conv.lastMessageAt)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Text
            className={`text-[12.5px] flex-1 ${
              hasUnread ? "font-sans-semibold text-ink" : "text-ink-3"
            }`}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {hasUnread && (
            <View
              className="bg-primary rounded-full items-center justify-center"
              style={{ minWidth: 18, height: 18, paddingHorizontal: 5 }}
            >
              <Text className="text-[10px] font-sans-bold text-white">
                {conv.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
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
    <View className="px-8 pt-20 items-center">
      <View className="w-16 h-16 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={28} color={INK_2} />
      </View>
      <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
        {title}
      </Text>
      <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
        {body}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
