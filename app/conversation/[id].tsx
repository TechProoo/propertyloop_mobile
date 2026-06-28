import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { Appear, PressableScale } from "@/components/anim/motion";
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
const CREAM_2 = "#efeae1";

const MAX_ATT = 10;

type PendingAttachment = {
  localUri: string;
  name: string;
  mimeType: string;
  kind: "image" | "file";
};

// A message in the UI: the server shape plus client-only optimistic state.
type ChatMessage = Message & {
  pending?: boolean;
  failed?: boolean;
  localAttachments?: PendingAttachment[];
};

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

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    let h = d.getHours();
    const m = d.getMinutes();
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
  } catch {
    return "";
  }
}

function dayLabel(iso: string) {
  try {
    const d = new Date(iso);
    const start = (x: Date) =>
      new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((start(new Date()) - start(d)) / 86400000);
    if (diff <= 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7)
      return d.toLocaleDateString(undefined, { weekday: "long" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const isImageUrl = (u: string) =>
  /\.(jpe?g|png|webp|gif|avif|heic|bmp)(\?|$)/i.test(u);

const fileNameFromUrl = (u: string) => {
  try {
    return decodeURIComponent(u.split("?")[0].split("/").pop() ?? "file");
  } catch {
    return "file";
  }
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
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

  // Mark the thread read once it's open.
  useEffect(() => {
    if (id) messagesService.markRead(id).catch(() => {});
  }, [id]);

  // Realtime: join the conversation room and append incoming messages live.
  useEffect(() => {
    if (!id) return;
    const socket = getChatSocket();
    const join = () => socket.emit("join_conversation", { conversationId: id });
    if (socket.connected) join();
    socket.on("connect", join);

    const onNew = (msg: Message & { conversationId: string }) => {
      if (msg.conversationId !== id) return;
      setMessages((arr) => {
        if (arr.some((m) => m.id === msg.id)) return arr;
        // Drop a matching optimistic bubble so our own message isn't doubled.
        const cleaned = msg.isYou
          ? arr.filter((m) => !(m.pending && m.text === msg.text))
          : arr;
        return [...cleaned, msg];
      });
    };
    socket.on("new_message", onNew);

    return () => {
      socket.off("new_message", onNew);
      socket.off("connect", join);
    };
  }, [id]);

  useEffect(() => {
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(t);
  }, [messages.length]);

  const addAttachments = (items: PendingAttachment[]) =>
    setAttachments((cur) => [...cur, ...items].slice(0, MAX_ATT));

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos", "Allow photo access in Settings to attach images.");
      return;
    }
    const remaining = MAX_ATT - attachments.length;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (r.canceled) return;
    addAttachments(
      r.assets.map((a) => ({
        localUri: a.uri,
        name: a.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: a.mimeType ?? "image/jpeg",
        kind: "image" as const,
      })),
    );
  };

  const pickDocs = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (r.canceled) return;
    addAttachments(
      r.assets.map((a) => ({
        localUri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? "application/octet-stream",
        kind: a.mimeType?.startsWith("image/") ? "image" : "file",
      })),
    );
  };

  const onAttach = () => {
    if (attachments.length >= MAX_ATT) {
      Alert.alert("Limit reached", `You can attach up to ${MAX_ATT} files.`);
      return;
    }
    Alert.alert("Add attachment", undefined, [
      { text: "Photo", onPress: pickImages },
      { text: "Document", onPress: pickDocs },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Upload any attachments, then send. Replaces the optimistic bubble (tempId)
  // with the server message, or marks it failed so the user can retry.
  const deliver = async (
    tempId: string,
    text: string,
    atts: PendingAttachment[],
  ) => {
    if (!id) return;
    try {
      const urls: string[] = [];
      for (const a of atts) {
        const { url } = await messagesService.uploadAttachment(a.localUri, {
          name: a.name,
          type: a.mimeType,
        });
        urls.push(url);
      }
      const msg = await messagesService.sendMessage(id, text, urls);
      setMessages((arr) => {
        const withoutTemp = arr.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === msg.id)
          ? withoutTemp
          : [...withoutTemp, msg];
      });
    } catch {
      setMessages((arr) =>
        arr.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m,
        ),
      );
    }
  };

  const send = () => {
    const text = draft.trim();
    if ((!text && attachments.length === 0) || !id) return;
    const atts = attachments;
    const tempId = `temp-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId: id,
      senderUserId: "me",
      senderName: "You",
      senderAvatar: null,
      isYou: true,
      text,
      attachmentUrls: [],
      createdAt: new Date().toISOString(),
      pending: true,
      localAttachments: atts,
    };
    setMessages((arr) => [...arr, optimistic]);
    setDraft("");
    setAttachments([]);
    void deliver(tempId, text, atts);
  };

  const retry = (m: ChatMessage) => {
    setMessages((arr) =>
      arr.map((x) =>
        x.id === m.id ? { ...x, failed: false, pending: true } : x,
      ),
    );
    void deliver(m.id, m.text, m.localAttachments ?? []);
  };

  const title = conv?.name ?? "Conversation";
  const canSend = draft.trim().length > 0 || attachments.length > 0;

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
          <PressableScale
            onPress={() => router.back()}
            activeScale={0.85}
            hitSlop={6}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={22} color={INK} />
          </PressableScale>
          {conv?.avatar ? (
            <Image
              source={{ uri: conv.avatar }}
              style={{ width: 38, height: 38, borderRadius: 19 }}
              contentFit="cover"
            />
          ) : (
            <PLAvatar initials={initialsOf(title)} size={38} tone="primary" />
          )}
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text
                className="text-[14.5px] font-sans-bold text-ink"
                numberOfLines={1}
              >
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
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <Appear delay={60} from="fade">
                <View className="items-center mt-16 px-8">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                    style={{ backgroundColor: "#e3efe7" }}
                  >
                    <Ionicons name="chatbubbles" size={26} color={PRIMARY} />
                  </View>
                  <Text className="text-center text-[15px] font-sans-bold text-ink">
                    Say hello
                  </Text>
                  <Text className="text-center text-[12.5px] text-ink-3 mt-1.5 leading-5">
                    This is the start of your conversation
                    {conv?.name ? ` with ${conv.name}` : ""}.
                  </Text>
                </View>
              </Appear>
            ) : (
              messages.map((m, i) => {
                const prev = messages[i - 1];
                const showDay =
                  !prev ||
                  dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
                return (
                  <View key={m.id}>
                    {showDay ? <DaySeparator iso={m.createdAt} /> : null}
                    <Appear from="up" duration={320}>
                      <Bubble message={m} onRetry={() => retry(m)} />
                    </Appear>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Staged attachments */}
        {attachments.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="bg-cream"
            contentContainerStyle={{
              paddingHorizontal: 14,
              paddingTop: 8,
              gap: 8,
            }}
            style={{ borderTopWidth: 0.5, borderTopColor: LINE }}
          >
            {attachments.map((a, i) => (
              <View key={`${a.localUri}-${i}`} style={{ position: "relative" }}>
                {a.kind === "image" ? (
                  <Image
                    source={{ uri: a.localUri }}
                    style={{ width: 58, height: 58, borderRadius: 12 }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 12,
                      backgroundColor: CREAM_2,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Ionicons name="document-text" size={20} color={INK_2} />
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 8, color: INK_3, marginTop: 2 }}
                    >
                      {a.name}
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={() =>
                    setAttachments((cur) => cur.filter((_, j) => j !== i))
                  }
                  hitSlop={6}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: INK,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Composer */}
        <View
          className="px-3 pt-2.5 pb-6 flex-row items-end gap-2 bg-cream"
          style={{ borderTopWidth: 0.5, borderTopColor: LINE }}
        >
          <PressableScale
            onPress={onAttach}
            activeScale={0.88}
            hitSlop={6}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CREAM_2,
            }}
          >
            <Ionicons name="add" size={20} color={INK_2} />
          </PressableScale>
          <View
            className="flex-1 rounded-3xl px-4 py-2.5"
            style={{
              maxHeight: 120,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#ece6df",
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${conv?.name ?? ""}…`}
              placeholderTextColor={INK_3}
              className="text-[14px] text-ink"
              style={{
                fontFamily: "Inter_500Medium",
                paddingVertical: 0,
                minHeight: 22,
              }}
              multiline
            />
          </View>
          <PressableScale
            onPress={send}
            disabled={!canSend}
            activeScale={0.86}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: canSend ? PRIMARY : CREAM_2,
              shadowColor: PRIMARY,
              shadowOpacity: canSend ? 0.3 : 0,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: canSend ? 3 : 0,
            }}
          >
            <Ionicons
              name="arrow-up"
              size={19}
              color={canSend ? "#ffffff" : INK_3}
            />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DaySeparator({ iso }: { iso: string }) {
  return (
    <View style={{ alignItems: "center", marginVertical: 6 }}>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: CREAM_2,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 11,
            color: INK_3,
            letterSpacing: 0.2,
          }}
        >
          {dayLabel(iso)}
        </Text>
      </View>
    </View>
  );
}

type RenderAttachment = { uri: string; isImage: boolean; name: string; remote: boolean };

function attachmentsOf(m: ChatMessage): RenderAttachment[] {
  if (m.localAttachments?.length) {
    return m.localAttachments.map((a) => ({
      uri: a.localUri,
      isImage: a.kind === "image",
      name: a.name,
      remote: false,
    }));
  }
  return (m.attachmentUrls ?? []).map((u) => ({
    uri: u,
    isImage: isImageUrl(u),
    name: fileNameFromUrl(u),
    remote: true,
  }));
}

function Bubble({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: () => void;
}) {
  const isMe = message.isYou;
  const atts = attachmentsOf(message);
  const bubbleBg = isMe ? PRIMARY : "#ffffff";
  const textColor = isMe ? "#ffffff" : INK;
  const subColor = isMe ? "rgba(255,255,255,0.75)" : INK_3;

  const openRemote = (a: RenderAttachment) => {
    if (a.remote) Linking.openURL(a.uri).catch(() => {});
  };

  return (
    <View style={{ alignItems: isMe ? "flex-end" : "flex-start" }}>
      <View
        style={{
          maxWidth: "80%",
          paddingHorizontal: atts.length && !message.text ? 6 : 12,
          paddingVertical: atts.length && !message.text ? 6 : 9,
          borderRadius: 20,
          borderBottomRightRadius: isMe ? 6 : 20,
          borderBottomLeftRadius: isMe ? 20 : 6,
          backgroundColor: bubbleBg,
          borderWidth: isMe ? 0 : 0.5,
          borderColor: LINE,
          gap: atts.length ? 6 : 0,
          shadowColor: isMe ? PRIMARY : "#1a2120",
          shadowOpacity: isMe ? 0.18 : 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        {/* Attachments */}
        {atts.map((a, i) =>
          a.isImage ? (
            <Pressable key={i} onPress={() => openRemote(a)}>
              <Image
                source={{ uri: a.uri }}
                style={{ width: 200, height: 150, borderRadius: 12 }}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <Pressable
              key={i}
              onPress={() => openRemote(a)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: isMe ? "rgba(255,255,255,0.15)" : CREAM_2,
                minWidth: 160,
              }}
            >
              <Ionicons
                name="document-text"
                size={20}
                color={isMe ? "#fff" : PRIMARY}
              />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12.5,
                  color: textColor,
                }}
              >
                {a.name}
              </Text>
            </Pressable>
          ),
        )}

        {/* Text */}
        {message.text ? (
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              lineHeight: 20,
              color: textColor,
              paddingHorizontal: atts.length && !message.text ? 6 : 0,
            }}
          >
            {message.text}
          </Text>
        ) : null}

        {/* Meta: time / sending / failed */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-end",
            gap: 4,
            marginTop: 3,
          }}
        >
          {message.failed ? (
            <Pressable
              onPress={onRetry}
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <Ionicons name="alert-circle" size={12} color="#d9534f" />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 10.5,
                  color: "#d9534f",
                }}
              >
                Failed · Tap to retry
              </Text>
            </Pressable>
          ) : message.pending ? (
            <>
              <Ionicons name="time-outline" size={11} color={subColor} />
              <Text
                style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: subColor }}
              >
                Sending…
              </Text>
            </>
          ) : (
            <Text
              style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: subColor }}
            >
              {formatTime(message.createdAt)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
