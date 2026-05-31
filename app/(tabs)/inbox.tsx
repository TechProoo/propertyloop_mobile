import { Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { CONVERSATIONS, type Conversation } from "@/mocks/inbox";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const ONLINE = "#3aa365";
const LINE = "#e1dcd3";

export default function InboxScreen() {
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
            <Text className="flex-1 text-[14px] text-ink-3 font-sans-medium">
              Search messages
            </Text>
          </View>
        </View>

        {/* Conversation list */}
        <View className="px-2 pt-2">
          {CONVERSATIONS.map((c) => (
            <ConversationRow key={c.id} conv={c} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConversationRow({ conv }: { conv: Conversation }) {
  const hasUnread = (conv.unread ?? 0) > 0;
  return (
    <Pressable
      onPress={() => router.push(`/conversation/${conv.id}` as Href)}
      className="flex-row items-center gap-3 px-3 py-3 active:bg-cream-2"
      style={{
        borderBottomWidth: 0.5,
        borderBottomColor: LINE,
      }}
    >
      {/* Avatar with online dot */}
      <View className="relative">
        <PLAvatar initials={conv.initials} size={48} tone={conv.tone} />
        {conv.online && (
          <View
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
            style={{
              backgroundColor: ONLINE,
              borderWidth: 2,
              borderColor: "#f5f0eb",
            }}
          />
        )}
      </View>

      {/* Name / about / preview */}
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-[14.5px] font-sans-bold text-ink"
            numberOfLines={1}
            style={{ maxWidth: 180 }}
          >
            {conv.name}
          </Text>
          {conv.verified && (
            <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
          )}
          <Text className="ml-auto text-[11px] font-sans-semibold text-ink-3">
            {conv.time}
          </Text>
        </View>
        <Text
          className="text-[11.5px] font-sans-bold text-primary mt-0.5"
          numberOfLines={1}
        >
          {conv.about}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text
            className={`text-[12.5px] flex-1 ${
              hasUnread ? "font-sans-semibold text-ink" : "text-ink-3"
            }`}
            numberOfLines={1}
          >
            {conv.lastMessage}
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
