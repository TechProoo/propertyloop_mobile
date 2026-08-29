import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import agentsService from "@/api/services/agents";
import messagesService, { type ConversationRole } from "@/api/services/messages";
import { useAuth } from "@/context/auth";
import { blockUser, reportContent } from "@/lib/moderation";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function naira(n?: number) {
  return n != null ? `₦${Math.round(n).toLocaleString("en-NG")}` : "—";
}

export default function PublicAgentProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, requireAuth } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let on = true;
    agentsService.getPublic(id)
      .then((a) => on && setAgent(a))
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [id]);

  const messageAgent = async () => {
    if (!id || starting) return;
    if (!requireAuth("message this agent")) return;
    if (!user) return;
    setStarting(true);
    try {
      const conv = await messagesService.createOrFind({
        recipientId: id,
        recipientRole: "AGENT",
        senderRole: user.role as ConversationRole,
      });
      router.push(`/conversation/${conv.conversationId}` as Href);
    } catch (e: any) {
      Alert.alert("Couldn't start chat", e?.response?.data?.message ?? "Please try again.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <BouncyLoader color={PRIMARY} />
      </View>
    );
  }
  if (!agent) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-[15px] font-sans-bold text-ink">Agent not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80">
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const listings: any[] = agent.activeListings ?? [];
  const reviews: any[] = agent.reviews ?? [];
  const specialties: string[] = agent.specialty ?? [];
  const hasUsefulBio = (agent.bio ?? "").trim().length > 12;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Agent profile</Text>
        <Pressable
          onPress={() => {
            if (!id) return;
            Alert.alert(agent.name, undefined, [
              {
                text: `Report ${agent.name}`,
                onPress: () => reportContent("AGENT", id, agent.name),
              },
              {
                text: `Block ${agent.name}`,
                style: "destructive",
                onPress: () => blockUser(id, agent.name, () => router.back()),
              },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Report or block"
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={INK_2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View
          className="bg-primary-soft px-5 pt-5 pb-6 items-center"
          style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          {/* White ring lifts the avatar off the green and hides the seam on
              logo-style headshots, which are rarely cropped to a circle. */}
          <View className="rounded-full p-1" style={{ backgroundColor: "#ffffff" }}>
            {agent.avatarUrl ? (
              <Image
                source={agent.avatarUrl}
                style={{ width: 84, height: 84, borderRadius: 42 }}
                contentFit="cover"
              />
            ) : (
              <PLAvatar initials={initialsOf(agent.name)} size={84} tone="primary" />
            )}
          </View>

          <Text
            className="font-serif text-ink text-center mt-3"
            style={{ fontSize: 23, lineHeight: 28, letterSpacing: -0.4 }}
            numberOfLines={2}
          >
            {agent.name}
          </Text>

          {!!agent.agency && (
            <Text
              className="text-[12.5px] text-center mt-1 leading-4"
              style={{ color: PRIMARY_INK }}
              numberOfLines={2}
            >
              {agent.agency}
            </Text>
          )}

          {/* One verification signal, not two — a shield sat beside the name as
              well as inside this pill. */}
          <View
            className="mt-2.5 rounded-full px-2.5 py-1 flex-row items-center gap-1"
            style={{ backgroundColor: "rgba(255,255,255,0.8)" }}
          >
            <Ionicons
              name={agent.verified ? "shield-checkmark" : "person-outline"}
              size={11}
              color={PRIMARY}
            />
            <Text className="text-[10.5px] font-sans-bold" style={{ color: PRIMARY_INK }}>
              {agent.verified ? "Verified agent" : "PropertyLoop agent"}
            </Text>
          </View>

          {/* Rating line hidden until the agent has reviews — no "★ 0 · 0 reviews". */}
          {reviews.length > 0 && (
            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="star" size={12} color={ACCENT} />
              <Text className="text-[12.5px] font-sans-bold text-ink">{agent.rating}</Text>
              <Text className="text-[12.5px] text-ink-3">· {reviews.length} reviews</Text>
            </View>
          )}

          {/* Only surface metrics the agent has actually earned; a "0" stat
              reads as a negative rather than "just getting started". Centred
              and fixed-width: these were flex-1, so an agent with one earned
              stat got a full-bleed card with a small number in its corner. */}
          {((agent.yearsExperience ?? 0) > 0 ||
            (agent.soldRentedCount ?? 0) > 0 ||
            (agent.listingsCount ?? 0) > 0) && (
            <View className="flex-row justify-center gap-2 mt-5">
              {(agent.listingsCount ?? 0) > 0 && (
                <Stat n={`${agent.listingsCount}`} l="Listings" />
              )}
              {(agent.soldRentedCount ?? 0) > 0 && (
                <Stat n={`${agent.soldRentedCount}`} l="Closed" />
              )}
              {(agent.yearsExperience ?? 0) > 0 && (
                <Stat n={`${agent.yearsExperience}y`} l="Experience" />
              )}
            </View>
          )}
        </View>

        {/* Bio */}
        <View className="px-5 pt-5">
          {hasUsefulBio && (
            <>
              <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2">About</Text>
              <Text className="text-[13.5px] text-ink-2 leading-5">{agent.bio}</Text>
            </>
          )}

          {!hasUsefulBio && (
            <View className="bg-white rounded-2xl border-line p-4" style={{ borderWidth: 0.5 }}>
              <Text className="text-[13px] font-sans-bold text-ink">A local property specialist</Text>
              <Text className="text-[12px] text-ink-3 leading-5 mt-1">
                Browse active listings or message {agent.name?.split(" ")[0] ?? "this agent"} to discuss your property search.
              </Text>
            </View>
          )}

          {specialties.length > 0 && (
            <View className="flex-row gap-2 flex-wrap mt-4">
              {specialties.map((s) => (
                <View key={s} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: "#e3efe7" }}>
                  <Text className="text-[11.5px] font-sans-bold" style={{ color: PRIMARY_INK }}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {listings.length > 0 && (
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-6 mb-2">
              {listings.length} active listings
            </Text>
          )}
        </View>

        {listings.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {listings.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => router.push(`/property/${l.id}` as Href)}
                className="bg-white rounded-2xl overflow-hidden border-line active:opacity-90"
                style={{ width: 210, borderWidth: 0.5 }}
              >
                <Image source={l.coverImage} style={{ width: "100%", height: 136 }} contentFit="cover" />
                <View className="px-3.5 py-3">
                  <Text className="font-serif text-ink" style={{ fontSize: 16, letterSpacing: -0.3 }}>
                    {l.priceLabel ?? naira(Number(l.priceNaira))}
                  </Text>
                  <Text className="text-[12px] font-sans-bold text-ink mt-0.5" numberOfLines={2} style={{ lineHeight: 16 }}>{l.title}</Text>
                  <Text className="text-[11px] text-ink-3 mt-0.5" numberOfLines={1}>{l.location}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-2">Recent reviews</Text>
            <View className="gap-2.5">
              {reviews.map((r, idx) => (
                <View key={r.id ?? idx} className="bg-white rounded-2xl p-3.5 border-line" style={{ borderWidth: 0.5 }}>
                  <View className="flex-row items-center gap-2.5">
                    <PLAvatar initials={initialsOf(r.reviewerName ?? r.clientName)} size={32} tone="primary" />
                    <View className="flex-1">
                      <Text className="text-[13px] font-sans-bold text-ink">{r.reviewerName ?? r.clientName ?? "Buyer"}</Text>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons key={i} name={i < Math.round(r.rating) ? "star" : "star-outline"} size={11} color={ACCENT} />
                        ))}
                      </View>
                    </View>
                  </View>
                  {!!(r.comment ?? r.body) && (
                    <Text className="text-[12.5px] text-ink-2 mt-2 leading-5">{r.comment ?? r.body}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream"
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 20) + 10,
          shadowColor: "#1a2120",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        }}
      >
        <Pressable
          onPress={messageAgent}
          disabled={starting}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16, opacity: starting ? 0.6 : 1 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">{starting ? "Opening…" : "Message agent"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View
      className="rounded-2xl items-center px-3.5 py-2.5"
      style={{ minWidth: 94, backgroundColor: "rgba(255,255,255,0.85)" }}
    >
      <Text className="font-serif text-ink" style={{ fontSize: 19, letterSpacing: -0.3 }}>
        {n}
      </Text>
      <Text className="text-[9.5px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
        {l}
      </Text>
    </View>
  );
}
