import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import messagesService, {
  type Conversation,
  type Message,
} from "@/api/services/messages";
import { getChatSocket } from "@/api/socket";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
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

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [msgs, convos] = await Promise.all([
        messagesService.getMessages(id),
        messagesService.listConversations(),
      ]);
      setMessages(msgs);
      setConv(convos.items.find((c) => c.id === id) ?? null);
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: join the conversation room and append incoming messages live.
  useEffect(() => {
    if (!id) return;
    const socket = getChatSocket();
    const join = () => socket.emit("join_conversation", { conversationId: id });
    if (socket.connected) join();
    socket.on("connect", join);

    const onNew = (msg: Message & { conversationId: string }) => {
      if (msg.conversationId !== id) return;
      setMessages((arr) => (arr.some((m) => m.id === msg.id) ? arr : [...arr, msg]));
    };
    socket.on("new_message", onNew);

    return () => {
      socket.off("new_message", onNew);
      socket.off("connect", join);
    };
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearTimeout(t);
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !id || sending) return;
    setDraft("");
    setSending(true);
    try {
      const msg = await messagesService.sendMessage(id, text);
      setMessages((arr) => [...arr, msg]);
    } catch {
      setDraft(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const title = conv?.name ?? "Conversation";

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center gap-2.5 px-4 pt-1 pb-3 bg-cream"
          style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
        >
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color={INK} />
          </Pressable>
          <PLAvatar initials={initialsOf(title)} size={38} tone="primary" />
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-[14.5px] font-sans-bold text-ink" numberOfLines={1}>
                {title}
              </Text>
              {conv?.role === "AGENT" || conv?.role === "VENDOR" ? (
                <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
              ) : null}
            </View>
            {conv?.role ? (
              <Text className="text-[11px] font-sans-semibold text-ink-3 mt-0.5">
                {conv.role.charAt(0) + conv.role.slice(1).toLowerCase()}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Pinned listing */}
        {conv?.listingId ? (
          <View className="px-4 pt-2.5">
            <Pressable
              onPress={() => router.push(`/property/${conv.listingId}` as Href)}
              className="flex-row items-center gap-2.5 p-2.5 bg-primary-soft rounded-2xl active:opacity-90"
            >
              <View className="w-9 h-9 rounded-xl bg-white items-center justify-center">
                <Ionicons name="home" size={16} color={PRIMARY} />
              </View>
              <Text
                className="flex-1 text-[12.5px] font-sans-bold"
                style={{ color: PRIMARY_INK }}
              >
                View the property in this chat
              </Text>
              <Ionicons name="chevron-forward" size={14} color={PRIMARY_INK} />
            </Pressable>
          </View>
        ) : null}

        {/* Messages */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            {messages.length === 0 ? (
              <Text className="text-center text-[12.5px] text-ink-3 mt-10">
                Say hello — your messages will appear here.
              </Text>
            ) : (
              messages.map((m) => <Bubble key={m.id} message={m} />)
            )}
          </ScrollView>
        )}

        {/* Composer */}
        <View
          className="px-3.5 pt-2 pb-6 flex-row items-center gap-2 bg-cream"
          style={{ borderTopWidth: 0.5, borderTopColor: LINE }}
        >
          <View className="flex-1 bg-cream-2 rounded-full px-4 py-2.5">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${conv?.name ?? ""}…`}
              placeholderTextColor={INK_3}
              className="text-[14px] text-ink"
              style={{ fontFamily: "Inter_500Medium", paddingVertical: 0, minHeight: 20 }}
              multiline
              onSubmitEditing={send}
            />
          </View>
          <Pressable
            className="w-9 h-9 rounded-full bg-primary items-center justify-center active:opacity-80"
            onPress={send}
            disabled={draft.trim().length === 0 || sending}
            style={{ opacity: draft.trim().length === 0 || sending ? 0.5 : 1 }}
          >
            <Ionicons name="send" size={15} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: Message }) {
  const isMe = message.isYou;
  return (
    <View
      style={{ flexDirection: "row", justifyContent: isMe ? "flex-end" : "flex-start" }}
    >
      <View
        style={{
          maxWidth: "78%",
          paddingHorizontal: 13,
          paddingVertical: 9,
          borderRadius: 18,
          borderBottomRightRadius: isMe ? 6 : 18,
          borderBottomLeftRadius: isMe ? 18 : 6,
          backgroundColor: isMe ? INK : "#f0f0f0",
        }}
      >
        {message.text ? (
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              lineHeight: 20,
              color: isMe ? "#ffffff" : INK,
            }}
          >
            {message.text}
          </Text>
        ) : null}
        {message.attachmentUrls?.length > 0 && (
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              marginTop: message.text ? 4 : 0,
              color: isMe ? "rgba(255,255,255,0.8)" : INK_2,
            }}
          >
            📎 {message.attachmentUrls.length} attachment
            {message.attachmentUrls.length === 1 ? "" : "s"}
          </Text>
        )}
      </View>
    </View>
  );
}
