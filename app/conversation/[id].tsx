import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { getThread, type Bubble as MsgBubble } from "@/mocks/inbox";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const ONLINE = "#3aa365";
const LINE = "#e1dcd3";

function picsum(seed: string, size = 200) {
  return `https://picsum.photos/seed/${seed}/${size}/${size}`;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = getThread(id);
  const [draft, setDraft] = useState("");

  // Mock attach handlers — would fire off an upload + chat-bubble insert.
  const pickPhoto = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings to attach photos.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) {
      Alert.alert("Photo attached", "Upload would be sent on next message.");
    }
  };

  const takePhoto = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert("Camera", "Allow camera access in Settings to take photos.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) {
      Alert.alert("Photo attached", "Upload would be sent on next message.");
    }
  };

  const pickDocument = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!r.canceled && r.assets[0]) {
      Alert.alert("Document attached", `${r.assets[0].name} ready to send.`);
    }
  };

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
          <PLAvatar initials={thread.initials} size={38} tone={thread.tone} />
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-[14.5px] font-sans-bold text-ink">
                {thread.name}
              </Text>
              {thread.verified && (
                <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
              )}
            </View>
            <View className="flex-row items-center gap-1 mt-0.5">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 6,
                  backgroundColor: ONLINE,
                }}
              />
              <Text className="text-[11px] font-sans-semibold text-ink-3">
                {thread.presence}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert(thread.name, "Conversation options", [
                {
                  text: "Mute notifications",
                  onPress: () =>
                    Alert.alert("Muted", `You won't be notified about new messages from ${thread.name}.`),
                },
                {
                  text: "Block",
                  style: "destructive",
                  onPress: () =>
                    Alert.alert("Blocked", `${thread.name} can no longer message you.`),
                },
                {
                  text: "Report",
                  style: "destructive",
                  onPress: () =>
                    Alert.alert("Reported", "Our team will review this conversation within 24 hours."),
                },
                { text: "Cancel", style: "cancel" },
              ])
            }
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={INK_2} />
          </Pressable>
        </View>

        {/* Pinned listing card */}
        <View className="px-4 pt-2.5">
          <Pressable
            onPress={() => router.push(`/property/${thread.id}` as Href)}
            className="flex-row items-center gap-2.5 p-2.5 bg-primary-soft rounded-2xl active:opacity-90"
          >
            <Image
              source={picsum(thread.pinned.imageSeed)}
              style={{ width: 52, height: 52, borderRadius: 10 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text
                className="text-[11px] font-sans-bold tracking-wider uppercase"
                style={{ color: PRIMARY_INK }}
              >
                {thread.pinned.label}
              </Text>
              <Text
                className="text-[13px] font-sans-bold text-ink mt-0.5"
                numberOfLines={1}
              >
                {thread.pinned.title}
              </Text>
              <Text className="text-[11.5px] font-sans-semibold text-ink-2">
                {thread.pinned.detail}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={INK_3} />
          </Pressable>
        </View>

        {/* Conversation */}
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <DateSeparator label="Today" />
          {thread.bubbles.map((b, i) => (
            <BubbleView key={i} bubble={b} />
          ))}
          <Text className="text-[11px] font-sans-semibold text-ink-3 text-right -mt-0.5">
            {thread.lastReceipt}
          </Text>
        </ScrollView>

        {/* Suggested replies */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8, gap: 6 }}
        >
          {thread.suggestedReplies.map((s) => (
            <Pressable
              key={s}
              onPress={() => setDraft(s)}
              className="rounded-full px-3.5 py-1.5 bg-transparent active:opacity-80"
              style={{ borderWidth: 1, borderColor: LINE }}
            >
              <Text className="text-[13px] font-sans-semibold text-ink-2">
                {s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Composer */}
        <View
          className="px-3.5 pt-2 pb-6 flex-row items-center gap-2 bg-cream"
          style={{ borderTopWidth: 0.5, borderTopColor: LINE }}
        >
          <Pressable
            onPress={() =>
              Alert.alert("Attach", "What would you like to attach?", [
                { text: "Photo from library", onPress: pickPhoto },
                { text: "Take a photo", onPress: takePhoto },
                { text: "Document", onPress: pickDocument },
                { text: "Cancel", style: "cancel" },
              ])
            }
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="add" size={18} color={INK_2} />
          </Pressable>
          <View className="flex-1 bg-cream-2 rounded-full px-4 py-2.5">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message Chinwe…"
              placeholderTextColor={INK_3}
              className="text-[14px] text-ink"
              style={{
                fontFamily: "Inter_500Medium",
                paddingVertical: 0,
                minHeight: 20,
              }}
            />
          </View>
          <Pressable
            className="w-9 h-9 rounded-full bg-primary items-center justify-center active:opacity-80"
            onPress={() => setDraft("")}
            disabled={draft.length === 0}
            style={{ opacity: draft.length === 0 ? 0.5 : 1 }}
          >
            <Ionicons name="send" size={15} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BubbleView({ bubble }: { bubble: MsgBubble }) {
  const isMe = bubble.side === "me";
  const isSending = bubble.kind === "text" && bubble.status === "sending";
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: isMe ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          maxWidth: "78%",
          paddingHorizontal: bubble.kind === "attachment" ? 12 : 13,
          paddingVertical: bubble.kind === "attachment" ? 10 : 9,
          borderRadius: 18,
          borderBottomRightRadius: isMe ? 6 : 18,
          borderBottomLeftRadius: isMe ? 18 : 6,
          backgroundColor: isMe ? INK : "#ece6df",
          opacity: isSending ? 0.55 : 1,
        }}
      >
        {bubble.kind === "text" ? (
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              lineHeight: 20,
              color: isMe ? "#ffffff" : INK,
            }}
          >
            {bubble.text}
          </Text>
        ) : (
          <View className="flex-row items-center gap-2.5">
            <View
              className="w-12 h-12 rounded-[10px] items-center justify-center"
              style={{
                backgroundColor: isMe ? "rgba(255,255,255,0.12)" : "#ddd5c9",
              }}
            >
              <Ionicons
                name="document-text"
                size={20}
                color={isMe ? "#ffffff" : INK_2}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[12px] font-sans-bold"
                style={{ color: isMe ? "#ffffff" : INK }}
              >
                {bubble.filename}
              </Text>
              <Text
                className="text-[11px] mt-0.5"
                style={{
                  color: isMe ? "rgba(255,255,255,0.7)" : INK_3,
                }}
              >
                {bubble.meta}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View className="flex-row items-center justify-center gap-2.5 my-2">
      <View className="flex-1 bg-line" style={{ height: 0.5 }} />
      <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
        {label}
      </Text>
      <View className="flex-1 bg-line" style={{ height: 0.5 }} />
    </View>
  );
}
