import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { PhotoViewer } from "@/components/PhotoViewer";
import { Alert } from "@/lib/dialog";
import vendorsService from "@/api/services/vendors";
import messagesService, { type ConversationRole } from "@/api/services/messages";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const ACCENT = "#b9842c";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function PublicVendorProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  // Full-screen portfolio viewer: -1 = closed, otherwise the tapped index.
  const [viewerIndex, setViewerIndex] = useState(-1);

  // Vendors without a bookable service menu can't be scheduled, so let the
  // client open a chat to ask about the work instead. Reuses the same
  // conversation store as agent messaging, so it lands in the Inbox.
  const enquire = async () => {
    if (!id || starting) return;
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to message this vendor.");
      return;
    }
    setStarting(true);
    try {
      const conv = await messagesService.createOrFind({
        recipientId: id,
        recipientRole: "VENDOR",
        senderRole: user.role as ConversationRole,
      });
      router.push(`/conversation/${conv.conversationId}` as Href);
    } catch (e: any) {
      Alert.alert(
        "Couldn't start chat",
        e?.response?.data?.message ?? "Please try again.",
      );
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let on = true;
    Promise.all([vendorsService.getPublic(id), vendorsService.getPublicServices(id)])
      .then(([v, s]) => {
        if (!on) return;
        setVendor(v);
        setServices(s);
      })
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <BouncyLoader color={PRIMARY} />
      </View>
    );
  }
  if (!vendor) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-[15px] font-sans-bold text-ink">Vendor not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80">
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const reviews: any[] = vendor.reviews ?? [];
  const portfolio: string[] = vendor.portfolioImages ?? [];
  const firstReview = reviews[0];
  // A vendor who finished signup but not the setup wizard has no bio, services,
  // portfolio or reviews — the directory now hides them, but a stale direct
  // link can still land here, so show a clear "still setting up" state rather
  // than a blank page.
  const profileEmpty =
    !vendor.bio &&
    services.length === 0 &&
    portfolio.length === 0 &&
    reviews.length === 0;

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={{ height: 170, backgroundColor: "#e1dcd3" }} className="relative">
          {!!vendor.bannerImage && (
            <Image source={vendor.bannerImage} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          )}
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }} pointerEvents="box-none">
            <View className="flex-row items-center justify-between px-4 pt-2">
              <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                <Ionicons name="chevron-back" size={18} color="#ffffff" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Header card */}
        <View className="px-5" style={{ marginTop: -34 }}>
          <View className="self-start rounded-full overflow-hidden" style={{ borderWidth: 4, borderColor: "#ffffff", backgroundColor: "#ffffff" }}>
            {vendor.avatarUrl ? (
              <Image source={vendor.avatarUrl} style={{ width: 72, height: 72, borderRadius: 36 }} contentFit="cover" />
            ) : (
              <PLAvatar initials={initialsOf(vendor.name)} size={72} tone="primary" />
            )}
          </View>

          <View className="flex-row items-center gap-1.5 mt-2.5">
            <Text className="text-[21px] font-sans-bold text-ink">{vendor.name}</Text>
            {vendor.verified && <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />}
          </View>
          {!!vendor.category && (
            <Text className="text-[13px] font-sans-semibold text-ink-2 mt-1">{vendor.category}</Text>
          )}
          {!!vendor.serviceArea && (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="location-outline" size={13} color={INK_3} />
              <Text className="text-[12.5px] text-ink-3">{vendor.serviceArea}</Text>
            </View>
          )}

          {/* Stat strip */}
          <View className="mt-4 rounded-2xl overflow-hidden border-line flex-row" style={{ borderWidth: 0.5, backgroundColor: "#ffffff" }}>
            {[
              // Only show a star + score once the vendor actually has a rating;
              // a bare "★ 0" reads as a bad score rather than "not yet rated".
              (vendor.rating ?? 0) > 0
                ? { n: `${vendor.rating}`, l: "Rating", star: true }
                : { n: "New", l: "Rating", star: false },
              { n: (vendor.jobsCount ?? 0) > 0 ? `${vendor.jobsCount}` : "—", l: "Jobs" },
              { n: `${vendor.yearsExperience ?? 0} yr`, l: "Exp." },
            ].map((s, i) => (
              <View key={s.l} className="flex-1 items-center py-3" style={{ borderLeftWidth: i > 0 ? 0.5 : 0, borderLeftColor: "#ece6df" }}>
                <View className="flex-row items-center gap-1">
                  {s.star && <Ionicons name="star" size={11} color={ACCENT} />}
                  <Text className="font-serif text-ink" style={{ fontSize: 17 }}>{s.n}</Text>
                </View>
                <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">{s.l}</Text>
              </View>
            ))}
          </View>

          {/* Empty profile — vendor hasn't finished setting up */}
          {profileEmpty && (
            <View className="bg-white rounded-2xl px-4 py-8 items-center mt-4 border-line" style={{ borderWidth: 0.5 }}>
              <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: "#f0f0f0" }}>
                <Ionicons name="construct-outline" size={22} color={INK_3} />
              </View>
              <Text className="text-[13.5px] font-sans-bold text-ink">Still setting up</Text>
              <Text className="text-[12px] text-ink-3 mt-1 text-center leading-5">
                {vendor.name?.split(/\s+/)[0] ?? "This vendor"} hasn&apos;t added their services or details yet. Check back soon.
              </Text>
            </View>
          )}

          {/* Bio */}
          {!!vendor.bio && (
            <Text className="text-[13.5px] text-ink-2 mt-4 leading-5">{vendor.bio}</Text>
          )}

          {/* Services */}
          {services.length > 0 && (
            <>
              <Text className="text-[16px] font-sans-bold text-ink mt-5 mb-2">Services</Text>
              <View className="gap-2">
                {services.map((s) => (
                  <View key={s.id} className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line" style={{ borderWidth: 0.5 }}>
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-sans-bold text-ink">{s.name}</Text>
                      {!!s.duration && <Text className="text-[11px] text-ink-3 mt-0.5">{s.duration}</Text>}
                    </View>
                    <Text className="font-serif text-ink" style={{ fontSize: 16, letterSpacing: -0.3 }}>{s.priceLabel}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {portfolio.length > 0 && <Text className="text-[16px] font-sans-bold text-ink mt-5 mb-2">Recent work</Text>}
        </View>

        {portfolio.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {portfolio.map((url, i) => (
              <Pressable key={i} onPress={() => setViewerIndex(i)} accessibilityRole="imagebutton">
                <Image source={url} style={{ width: 130, height: 130, borderRadius: 14 }} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Reviews preview */}
        {firstReview && (
          <View className="px-5 mt-5">
            <Text className="text-[16px] font-sans-bold text-ink mb-2">Reviews · {reviews.length}</Text>
            <View className="bg-white rounded-2xl p-3.5 border-line" style={{ borderWidth: 0.5 }}>
              <View className="flex-row items-center gap-2">
                <PLAvatar initials={initialsOf(firstReview.clientName)} size={30} tone="primary" />
                <Text className="flex-1 text-[13px] font-sans-bold text-ink">{firstReview.clientName ?? "Customer"}</Text>
                <View className="flex-row gap-0.5">
                  {Array.from({ length: Math.round(firstReview.rating) }).map((_, i) => (
                    <Ionicons key={i} name="star" size={11} color={ACCENT} />
                  ))}
                </View>
              </View>
              {!!firstReview.comment && (
                <Text className="font-serif-italic text-ink-2 mt-2" style={{ fontSize: 13.5, lineHeight: 20 }}>
                  &quot;{firstReview.comment}&quot;
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky hire — hidden when viewing your own profile (you can't book yourself) */}
      {user?.id !== id && (
        <SafeAreaView edges={["bottom"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
          <View className="bg-cream border-line flex-row items-center gap-3 px-4" style={{ borderTopWidth: 0.5, paddingTop: 14, paddingBottom: 14 }}>
            <View className="flex-1">
              {services.length > 0 ? (
                <>
                  <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">From</Text>
                  {/* priceLabel may already start with "from " (FROM price mode);
                      strip it so the eyebrow doesn't read "From from ₦20,000". */}
                  <Text className="font-serif text-ink" style={{ fontSize: 20, letterSpacing: -0.4 }}>
                    {services[0].priceLabel?.replace(/^from\s+/i, "")}
                  </Text>
                </>
              ) : (
                <Text className="text-[13px] font-sans-semibold text-ink-2">Contact for pricing</Text>
              )}
            </View>
            {services.length > 0 ? (
              <Pressable onPress={() => router.push(`/book-service?vendorId=${id}` as Href)} className="bg-primary rounded-full px-6 py-3.5 active:opacity-80">
                <Text className="text-white font-sans-bold text-[14px]">Hire {vendor.name?.split(/\s+/)[0] ?? "vendor"}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={enquire}
                disabled={starting}
                className="bg-primary rounded-full px-5 py-3.5 flex-row items-center gap-2 active:opacity-80"
                style={{ opacity: starting ? 0.6 : 1 }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={15} color="#ffffff" />
                <Text className="text-white font-sans-bold text-[14px]">Enquire about service</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      )}

      {/* Own profile — the hire bar is hidden, so offer a quick edit action */}
      {user?.id === id && (
        <SafeAreaView edges={["bottom"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
          <View className="bg-cream border-line px-4" style={{ borderTopWidth: 0.5, paddingTop: 14, paddingBottom: 14 }}>
            <Pressable
              onPress={() => router.push("/vendor-edit-profile" as Href)}
              className="bg-primary rounded-full py-3.5 flex-row items-center justify-center gap-2 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Edit your profile"
            >
              <Ionicons name="create-outline" size={16} color="#ffffff" />
              <Text className="text-white font-sans-bold text-[14px]">Edit profile</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}

      <PhotoViewer
        visible={viewerIndex >= 0}
        images={portfolio}
        initialIndex={Math.max(0, viewerIndex)}
        onClose={() => setViewerIndex(-1)}
      />
    </View>
  );
}
