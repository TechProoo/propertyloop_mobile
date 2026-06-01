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
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { VENDOR_REVIEWS } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const SUGGESTIONS = [
  "Thanks for the kind words — see you next time!",
  "Appreciate you taking the time to leave this 🙏",
  "Glad the result lived up to expectations.",
];

export default function VendorReplyScreen() {
  const params = useLocalSearchParams<{ reviewId?: string }>();
  const review =
    VENDOR_REVIEWS.find((r) => r.id === params.reviewId) ?? VENDOR_REVIEWS[0];

  const [reply, setReply] = useState(review.reply ?? "");

  const onPost = () => {
    if (reply.trim().length < 4) {
      Alert.alert("Too short", "Write a few words before posting.");
      return;
    }
    Alert.alert("Reply posted", "Your public reply is now visible under this review.", [
      { text: "OK", onPress: () => router.back() },
    ]);
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
          <Pressable onPress={onPost} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-primary">Post</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Review preview */}
          <View
            className="bg-white rounded-2xl p-3.5 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <View className="flex-row items-center gap-2.5">
              <PLAvatar
                initials={review.customer.initials}
                size={34}
                tone={review.customer.tone}
              />
              <View className="flex-1">
                <Text className="text-[13px] font-sans-bold text-ink">
                  {review.customer.name}
                </Text>
                <Text className="text-[10.5px] font-sans-semibold text-ink-3">
                  {review.when}
                </Text>
              </View>
              <View className="flex-row gap-0.5">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Ionicons key={i} name="star" size={12} color={ACCENT} />
                ))}
              </View>
            </View>
            <Text
              className="font-serif-italic text-ink-2 mt-2.5"
              style={{ fontSize: 14, lineHeight: 21 }}
            >
              "{review.body}"
            </Text>
          </View>

          {/* Quick suggestions */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
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

void PRIMARY;
