import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { Appear, PressableScale, stagger } from "@/components/anim/motion";
import { useAuth } from "@/context/auth";
import messagesService, { type ConversationRole } from "@/api/services/messages";
import viewingsService from "@/api/services/viewings";
import offersService from "@/api/services/offers";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type Tone = "primary" | "accent" | "neutral";

type Recipient = {
  /** Recipient's user id — used to create/find a conversation. */
  userId: string;
  name: string;
  avatar?: string | null;
  role: ConversationRole;
  subtitle: string;
  tone: Tone;
  /** Set when a conversation already exists — tap navigates straight in. */
  conversationId?: string;
  recent: boolean;
};

const ROLE_TONE: Record<string, Tone> = {
  AGENT: "primary",
  VENDOR: "accent",
  BUYER: "neutral",
  ADMIN: "neutral",
};
const ROLE_LABEL: Record<string, string> = {
  AGENT: "Listing agent",
  VENDOR: "Vendor",
  BUYER: "Buyer",
  ADMIN: "PropertyLoop",
};

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "PL"
  );
}

export default function NewMessageScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [convs, vw, of] = await Promise.all([
        messagesService.listConversations().catch(() => ({ items: [] })),
        viewingsService.listMine().catch(() => ({ items: [] })),
        offersService.listMine().catch(() => ({ items: [] })),
      ]);

      const byUser = new Map<string, Recipient>();

      // 1) Existing conversations — these continue an existing thread.
      for (const c of convs.items) {
        if (!c.otherUserId) continue;
        const role = (c.role?.toUpperCase() as ConversationRole) ?? "AGENT";
        byUser.set(c.otherUserId, {
          userId: c.otherUserId,
          name: c.name,
          avatar: c.avatar,
          role,
          subtitle: c.lastMessage?.trim() || ROLE_LABEL[role] || "Conversation",
          tone: ROLE_TONE[role] ?? "neutral",
          conversationId: c.id,
          recent: true,
        });
      }

      // 2) Agents from the buyer's viewings + offers — start a new chat.
      const addAgent = (
        agent: { id: string; name: string; avatarUrl?: string | null } | undefined | null,
        context: string,
      ) => {
        if (!agent?.id || byUser.has(agent.id)) return;
        byUser.set(agent.id, {
          userId: agent.id,
          name: agent.name,
          avatar: agent.avatarUrl,
          role: "AGENT",
          subtitle: context,
          tone: "primary",
          recent: false,
        });
      };
      for (const v of vw.items) {
        addAgent(v.agent, v.listing?.title ? `Agent · ${v.listing.title}` : "Listing agent");
      }
      for (const o of of.items) {
        addAgent(o.agent, o.listing?.title ? `Agent · ${o.listing.title}` : "Listing agent");
      }

      setRecipients([...byUser.values()]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const recent = useMemo(() => recipients.filter((r) => r.recent), [recipients]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q),
    );
  }, [query, recipients]);

  const onTap = async (r: Recipient) => {
    if (startingId) return;
    if (r.conversationId) {
      router.replace(`/conversation/${r.conversationId}` as Href);
      return;
    }
    if (!user) return;
    setStartingId(r.userId);
    try {
      const { conversationId } = await messagesService.createOrFind({
        recipientId: r.userId,
        recipientRole: r.role,
        senderRole: user.role as ConversationRole,
      });
      router.replace(`/conversation/${conversationId}` as Href);
    } catch {
      setStartingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <Appear from="down">
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <PressableScale
            onPress={() => router.back()}
            activeScale={0.88}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#f0f0f0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={18} color={INK_2} />
          </PressableScale>
          <Text className="text-[15px] font-sans-bold text-ink">
            New message
          </Text>
          <View style={{ width: 36 }} />
        </View>
      </Appear>

      {/* Search */}
      <Appear delay={50} from="down">
      <View className="px-5 pt-2">
        <View
          className="bg-white rounded-full px-3.5 py-2.5 flex-row items-center gap-2.5"
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
          <Ionicons name="search" size={16} color={INK_2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search agents you've worked with"
            placeholderTextColor={INK_3}
            className="flex-1 text-[14px] text-ink"
            style={{ fontFamily: "Inter_500Medium", paddingVertical: 0 }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={INK_3} />
            </Pressable>
          )}
        </View>
      </View>
      </Appear>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : recipients.length === 0 ? (
        <Appear delay={80} from="fade">
        <View className="flex-1 items-center justify-start px-10 pt-10">
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: "#e3efe7" }}
          >
            <Ionicons name="chatbubbles-outline" size={30} color={PRIMARY} />
          </View>
          <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
            No one to message yet
          </Text>
          <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
            Message an agent straight from a property, viewing, or offer and they’ll appear here.
          </Text>
        </View>
        </Appear>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {query.trim().length === 0 && recent.length > 0 && (
            <>
              <SectionLabel>Recent</SectionLabel>
              <View className="px-2 pt-1">
                {recent.map((r, i) => (
                  <ContactRow
                    key={r.conversationId ?? r.userId}
                    recipient={r}
                    index={i}
                    busy={startingId === r.userId}
                    onPress={() => onTap(r)}
                  />
                ))}
              </View>
            </>
          )}

          <SectionLabel>
            {query.trim().length === 0
              ? "Agents you can message"
              : `Results · ${filtered.length}`}
          </SectionLabel>
          <View className="px-2 pt-1">
            {filtered.length === 0 ? (
              <Text className="text-[13px] text-ink-3 px-3 py-6 text-center">
                No matches for “{query}”.
              </Text>
            ) : (
              (query.trim().length === 0
                ? filtered.filter((r) => !r.recent)
                : filtered
              ).map((r, i) => (
                <ContactRow
                  key={r.conversationId ?? r.userId}
                  recipient={r}
                  index={i}
                  busy={startingId === r.userId}
                  onPress={() => onTap(r)}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-1.5 px-5">
      {children}
    </Text>
  );
}

function ContactRow({
  recipient,
  index,
  busy,
  onPress,
}: {
  recipient: Recipient;
  index: number;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Appear delay={stagger(index)}>
      <PressableScale
        onPress={onPress}
        disabled={busy}
        activeScale={0.98}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 18,
          opacity: busy ? 0.6 : 1,
        }}
      >
        <PLAvatar
          initials={initialsOf(recipient.name)}
          uri={recipient.avatar}
          size={46}
          tone={recipient.tone}
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[14.5px] font-sans-bold text-ink">
              {recipient.name}
            </Text>
            {recipient.role === "AGENT" && (
              <Ionicons name="shield-checkmark" size={12} color={PRIMARY} />
            )}
          </View>
          <Text className="text-[12px] text-ink-3 mt-0.5" numberOfLines={1}>
            {recipient.subtitle}
          </Text>
        </View>
        {busy ? (
          <BouncyLoader color={PRIMARY} />
        ) : (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#f0f0f0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-forward" size={14} color={INK_3} />
          </View>
        )}
      </PressableScale>
    </Appear>
  );
}
