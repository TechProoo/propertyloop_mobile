import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  VENDOR,
  VENDOR_REVIEW_BREAKDOWN,
  VENDOR_REVIEWS,
  type Review,
} from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorReviewsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Reputation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating hero */}
        <View
          className="bg-white rounded-2xl p-4 flex-row items-center gap-4 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <View className="items-center">
            <Text className="font-serif text-ink" style={{ fontSize: 40, letterSpacing: -1 }}>
              {VENDOR.rating}
            </Text>
            <View className="flex-row gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={12} color={ACCENT} />
              ))}
            </View>
            <Text className="text-[11px] font-sans-semibold text-ink-3 mt-1">
              {VENDOR.reviews} reviews
            </Text>
          </View>
          <View className="flex-1 gap-1.5">
            {VENDOR_REVIEW_BREAKDOWN.map((r) => (
              <View key={r.stars} className="flex-row items-center gap-2">
                <Text className="text-[10px] font-sans-bold text-ink-3" style={{ width: 8 }}>
                  {r.stars}
                </Text>
                <View
                  className="flex-1 rounded-full overflow-hidden"
                  style={{ height: 5, backgroundColor: "#ece6df" }}
                >
                  <View
                    style={{
                      width: `${r.pct}%`,
                      height: 5,
                      backgroundColor: ACCENT,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stat strip */}
        <View className="flex-row gap-2 mt-3">
          {[
            { n: VENDOR.completionRate, l: "Completion" },
            { n: VENDOR.responseTime,   l: "Response" },
            { n: VENDOR.onTimeRate,     l: "On time" },
          ].map((s) => (
            <View
              key={s.l}
              className="flex-1 bg-white rounded-2xl px-2 py-3 items-center border-line"
              style={{ borderWidth: 0.5 }}
            >
              <Text className="font-serif text-ink" style={{ fontSize: 18, letterSpacing: -0.3 }}>
                {s.n}
              </Text>
              <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-1">
                {s.l}
              </Text>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
          Recent reviews
        </Text>
        <View className="gap-2.5">
          {VENDOR_REVIEWS.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const reply = () =>
    Alert.alert("Reply publicly", "Public reply composer coming soon.");
  return (
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
          <Text className="text-[13px] font-sans-bold text-ink">{review.customer.name}</Text>
          <Text className="text-[10.5px] font-sans-semibold text-ink-3">{review.when}</Text>
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
      {review.reply ? (
        <View
          className="mt-2.5 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: "#ece6df", borderLeftWidth: 2, borderLeftColor: PRIMARY }}
        >
          <Text className="text-[10.5px] font-sans-bold text-primary mb-0.5">
            YOUR REPLY
          </Text>
          <Text className="text-[12.5px] text-ink-2 leading-4">{review.reply}</Text>
        </View>
      ) : (
        <Pressable
          onPress={reply}
          className="mt-2.5 self-start rounded-full px-3.5 py-1.5"
          style={{ backgroundColor: "#ece6df" }}
        >
          <Text className="text-[12px] font-sans-bold text-ink">Reply publicly</Text>
        </Pressable>
      )}
    </View>
  );
}
