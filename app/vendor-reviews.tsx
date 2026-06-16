import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorsService, { type VendorStats } from "@/api/services/vendors";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

interface Review {
  id: string;
  clientName?: string | null;
  rating: number;
  comment: string;
  reply?: string | null;
  createdAt: string;
}

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function whenOf(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function VendorReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const me = await vendorsService.getMe();
      const [list, s] = await Promise.all([
        vendorsService.getReviews(me.id),
        vendorsService.getStats(),
      ]);
      setReviews(list);
      setStats(s);
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = reviews.length;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    return { stars, pct: total ? Math.round((count / total) * 100) : 0 };
  });
  const avg = stats?.reviews.averageRating ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Reputation</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View className="py-16 items-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Rating hero */}
          <View className="bg-white rounded-2xl p-4 flex-row items-center gap-4 border-line" style={{ borderWidth: 0.5 }}>
            <View className="items-center">
              <Text className="font-serif text-ink" style={{ fontSize: 40, letterSpacing: -1 }}>{avg}</Text>
              <View className="flex-row gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name="star" size={12} color={i < Math.round(avg) ? ACCENT : "#e1dcd3"} />
                ))}
              </View>
              <Text className="text-[11px] font-sans-semibold text-ink-3 mt-1">{total} reviews</Text>
            </View>
            <View className="flex-1 gap-1.5">
              {breakdown.map((r) => (
                <View key={r.stars} className="flex-row items-center gap-2">
                  <Text className="text-[10px] font-sans-bold text-ink-3" style={{ width: 8 }}>{r.stars}</Text>
                  <View className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "#f0f0f0" }}>
                    <View style={{ width: `${r.pct}%`, height: 5, backgroundColor: ACCENT }} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews */}
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
            Recent reviews
          </Text>
          {total === 0 ? (
            <View className="bg-white rounded-2xl py-12 items-center border-line" style={{ borderWidth: 0.5 }}>
              <Ionicons name="star-outline" size={26} color={INK_3} />
              <Text className="text-[13px] font-sans-bold text-ink mt-2">No reviews yet</Text>
              <Text className="text-[11.5px] text-ink-3 mt-1">Completed jobs earn you reviews here.</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View className="bg-white rounded-2xl p-3.5 border-line" style={{ borderWidth: 0.5 }}>
      <View className="flex-row items-center gap-2.5">
        <PLAvatar initials={initialsOf(review.clientName)} size={34} tone="primary" />
        <View className="flex-1">
          <Text className="text-[13px] font-sans-bold text-ink">{review.clientName ?? "Customer"}</Text>
          <Text className="text-[10.5px] font-sans-semibold text-ink-3">{whenOf(review.createdAt)}</Text>
        </View>
        <View className="flex-row gap-0.5">
          {Array.from({ length: Math.round(review.rating) }).map((_, i) => (
            <Ionicons key={i} name="star" size={12} color={ACCENT} />
          ))}
        </View>
      </View>
      {!!review.comment && (
        <Text className="font-serif-italic text-ink-2 mt-2.5" style={{ fontSize: 14, lineHeight: 21 }}>
          &quot;{review.comment}&quot;
        </Text>
      )}
      {review.reply ? (
        <View className="mt-2.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#f0f0f0", borderLeftWidth: 2, borderLeftColor: PRIMARY }}>
          <Text className="text-[10.5px] font-sans-bold text-primary mb-0.5">YOUR REPLY</Text>
          <Text className="text-[12.5px] text-ink-2 leading-4">{review.reply}</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push(`/vendor-reply?reviewId=${review.id}` as Href)}
          className="mt-2.5 self-start rounded-full px-3.5 py-1.5"
          style={{ backgroundColor: "#f0f0f0" }}
        >
          <Text className="text-[12px] font-sans-bold text-ink">Reply publicly</Text>
        </Pressable>
      )}
    </View>
  );
}
