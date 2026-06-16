import { useEffect, useMemo, useState } from "react";
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
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import offersService from "@/api/services/offers";
import type { Listing } from "@/api/types";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const QUICK_ADJUSTMENTS = [
  { label: "-₦1M", delta: -1_000_000 },
  { label: "-₦5M", delta: -5_000_000 },
  { label: "+₦1M", delta: 1_000_000 },
];

type Financing = "cash" | "own";

function formatNaira(n: number): string {
  return n.toLocaleString("en-NG");
}

export default function MakeOfferScreen() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [amount, setAmount] = useState(0);
  const [financing, setFinancing] = useState<Financing>("cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!listingId) {
      setLoadingListing(false);
      return;
    }
    let active = true;
    listingsService
      .getById(listingId)
      .then((l) => {
        if (!active) return;
        setListing(l);
        setAmount(l.priceNaira); // start at asking
      })
      .catch(() => {})
      .finally(() => active && setLoadingListing(false));
    return () => {
      active = false;
    };
  }, [listingId]);

  const asking = listing?.priceNaira ?? 0;

  const pctOff = useMemo(() => {
    if (!asking) return 0;
    return Math.round(((asking - amount) / asking) * 100);
  }, [amount, asking]);

  const offerLabel =
    pctOff > 0
      ? `${pctOff}% below asking`
      : pctOff < 0
        ? `${-pctOff}% above asking`
        : "Matching asking";

  const offerColor = pctOff > 0 ? "#a8421a" : pctOff < 0 ? PRIMARY : INK_2;

  const submit = async () => {
    if (!listingId || amount <= 0) {
      Alert.alert("Enter an amount", "Set your offer amount to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await offersService.create({
        listingId,
        amountNaira: amount,
        financing: financing === "cash" ? "CASH" : "OWN_FINANCING",
        note: note.trim() || undefined,
      });
      Alert.alert(
        "Offer sent",
        "The agent has been notified. You can track it in your offers.",
        [{ text: "View offers", onPress: () => router.replace("/offers" as Href) }],
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        "Couldn't send your offer. Please try again.";
      Alert.alert("Offer failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center gap-2.5 px-5 pt-1 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={INK_2} />
          </Pressable>
          <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">
            Make an offer
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Property pin */}
          <View className="flex-row gap-3 p-2.5 bg-cream-2 rounded-2xl">
            {loadingListing ? (
              <View
                className="items-center justify-center"
                style={{ width: 60, height: 60, borderRadius: 10 }}
              >
                <BouncyLoader color={PRIMARY} />
              </View>
            ) : (
              <Image
                source={listing?.coverImage}
                style={{ width: 60, height: 60, borderRadius: 10 }}
                contentFit="cover"
              />
            )}
            <View className="flex-1">
              <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
                For sale
              </Text>
              <Text
                className="text-[14px] font-sans-bold text-ink mt-0.5"
                numberOfLines={1}
              >
                {listing?.title ?? "Loading…"}
              </Text>
              <Text className="text-xs text-ink-3" numberOfLines={1}>
                {listing ? `Asking ${listing.priceLabel} · ${listing.location}` : ""}
              </Text>
            </View>
          </View>

          {/* Your offer */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-6 mb-2">
            Your offer
          </Text>
          <View
            className="bg-white rounded-2xl"
            style={{
              borderWidth: 1.5,
              borderColor: "#1a2120",
              paddingHorizontal: 18,
              paddingVertical: 20,
            }}
          >
            <View className="flex-row items-baseline gap-1">
              <Text className="text-[22px] font-sans-bold text-ink-3">₦</Text>
              <Text
                className="font-serif text-ink"
                style={{ fontSize: 38, letterSpacing: -1.1, lineHeight: 38 }}
              >
                {formatNaira(amount)}
              </Text>
            </View>
            <View className="mt-2.5 flex-row items-center justify-between">
              <Text className="text-xs font-sans-semibold text-ink-3">
                <Text style={{ color: offerColor, fontFamily: "Inter_700Bold" }}>
                  {asking ? offerLabel : "Set your amount"}
                </Text>
              </Text>
              <View className="flex-row gap-1.5">
                {QUICK_ADJUSTMENTS.map((q) => (
                  <Pressable
                    key={q.label}
                    onPress={() => setAmount((a) => Math.max(0, a + q.delta))}
                    className="bg-cream-2 rounded-full px-2 py-1"
                  >
                    <Text className="text-[11px] font-sans-bold text-ink">
                      {q.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Manual amount entry */}
          <View
            className="mt-2.5 bg-white rounded-2xl px-3.5 border-line"
            style={{ borderWidth: 1 }}
          >
            <TextInput
              value={amount ? String(amount) : ""}
              onChangeText={(t) =>
                setAmount(Number(t.replace(/[^0-9]/g, "")) || 0)
              }
              keyboardType="number-pad"
              placeholder="Enter exact amount"
              placeholderTextColor={INK_3}
              className="text-ink text-[14px] font-sans-semibold"
              style={{ paddingVertical: 12 }}
            />
          </View>

          {/* Financing */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2">
            How you&apos;ll pay the seller
          </Text>
          <View className="gap-2">
            <FinancingOption
              icon="card-outline"
              label="Cash buyer"
              detail="Full amount paid directly to seller on completion"
              selected={financing === "cash"}
              onPress={() => setFinancing("cash")}
            />
            <FinancingOption
              icon="business-outline"
              label="Own financing"
              detail="You've arranged a loan separately"
              selected={financing === "own"}
              onPress={() => setFinancing("own")}
            />
          </View>

          {/* Note */}
          <View className="flex-row items-baseline gap-1 mt-5 mb-2">
            <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase">
              Note to seller
            </Text>
            <Text className="text-[13px] font-sans-medium text-ink-3 tracking-wider">
              · optional
            </Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder='"Looking to relocate by August — happy to be flexible on close date."'
            placeholderTextColor={INK_3}
            className="bg-cream-2 rounded-2xl px-3.5 py-3 text-ink-2 text-[14px]"
            style={{
              minHeight: 70,
              fontFamily: "PlayfairDisplay_400Regular_Italic",
            }}
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 border-line"
          style={{
            backgroundColor: "rgba(255,255,255,0.96)",
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          }}
        >
          <Pressable
            disabled={submitting || loadingListing}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{
              paddingVertical: 17,
              opacity: submitting || loadingListing ? 0.6 : 1,
            }}
            onPress={submit}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {submitting ? "Sending…" : "Send offer to agent"}
            </Text>
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-1.5">
            Non-binding · you and the seller settle directly
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FinancingOption({
  icon,
  label,
  detail,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl px-3.5 py-3.5 ${
        selected ? "bg-primary-soft" : "bg-white"
      }`}
      style={{
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? PRIMARY : LINE,
      }}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center ${
          selected ? "bg-white" : "bg-cream-2"
        }`}
      >
        <Ionicons name={icon} size={20} color={selected ? PRIMARY : INK_2} />
      </View>
      <View className="flex-1">
        <Text className="text-[13.5px] font-sans-bold text-ink">{label}</Text>
        <Text className="text-xs text-ink-3 mt-0.5">{detail}</Text>
      </View>
      <View
        className="w-5 h-5 rounded-full items-center justify-center"
        style={{
          backgroundColor: selected ? PRIMARY : "transparent",
          borderWidth: selected ? 0 : 1.5,
          borderColor: LINE,
        }}
      >
        {selected && (
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 7,
              backgroundColor: "white",
            }}
          />
        )}
      </View>
    </Pressable>
  );
}
