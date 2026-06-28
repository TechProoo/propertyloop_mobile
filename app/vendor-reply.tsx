import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import vendorsService from "@/api/services/vendors";

const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const SUGGESTIONS = [
  "Thanks for the kind words — see you next time!",
  "Appreciate you taking the time to leave this 🙏",
  "Glad the result lived up to expectations.",
];

export default function VendorReplyScreen() {
  const params = useLocalSearchParams<{ reviewId?: string }>();
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);

  const onPost = async () => {
    if (reply.trim().length < 4) {
      Alert.alert("Too short", "Write a few words before posting.");
      return;
    }
    if (!params.reviewId || posting) return;
    setPosting(true);
    try {
      await vendorsService.replyToReview(params.reviewId, reply.trim());
      Alert.alert("Reply posted", "Your public reply is now visible under this review.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? "Please try again.");
      setPosting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Drag handle */}
        <View className="items-center pt-2 pb-1">
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "#d3cdc1" }} />
        </View>

        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-ink-2">Cancel</Text>
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">Reply publicly</Text>
          <Pressable onPress={onPost} hitSlop={8} disabled={posting}>
            <Text className="text-[13px] font-sans-bold text-primary">{posting ? "Posting…" : "Post"}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick suggestions */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-2 mb-2">
            Suggestions
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setReply(s)}
                className="px-3.5 py-2 rounded-full bg-cream-2 active:opacity-80"
              >
                <Text className="text-[12px] font-sans-bold text-ink-2">{s}</Text>
              </Pressable>
            ))}
          </View>

          {/* Composer */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
            Your reply
          </Text>
          <TextInput
            value={reply}
            onChangeText={(t) => setReply(t.slice(0, 280))}
            multiline
            textAlignVertical="top"
            placeholder="Keep it warm and professional. Visible to anyone viewing this review."
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px]"
            style={{ minHeight: 120, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
          />
          <Text className="text-[11px] text-ink-3 mt-1.5">{reply.length} / 280</Text>

          <View
            className="mt-4 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start"
            style={{ backgroundColor: "#e3efe7" }}
          >
            <Ionicons name="information-circle-outline" size={15} color="#134a2d" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11.5px] leading-4" style={{ color: "#134a2d" }}>
              Replies are public. You can edit your reply once after posting.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
