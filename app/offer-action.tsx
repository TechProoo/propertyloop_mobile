import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import offersService, { type Offer } from "@/api/services/offers";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DECLINE = "#b3261e";

function fmt(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

export default function OfferActionScreen() {
  const { offerId } = useLocalSearchParams<{ offerId?: string }>();
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!offerId) {
      setLoading(false);
      return;
    }
    let active = true;
    offersService
      .getById(offerId)
      .then((o) => {
        if (!active) return;
        setOffer(o);
        setCounter(fmt(String(o.currentAmountNaira)));
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [offerId]);

  const run = async (fn: () => Promise<unknown>) => {
    if (!offerId) return;
    setBusy(true);
    try {
      await fn();
      router.replace("/offers" as Href);
    } catch (e: any) {
      Alert.alert(
        "Something went wrong",
        e?.response?.data?.message ?? "Please try again.",
      );
      setBusy(false);
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

  if (!offer) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8" edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-[15px] font-sans-bold text-ink">Offer not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
        >
          <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isAgent = !!user && offer.agentId === user.id;
  const otherParty =
    (isAgent ? offer.buyer?.name : offer.agent?.name) ?? "The other party";
  const theirCounter = offer.currentAmountLabel;
  const counterAmount = Number(counter.replace(/,/g, "")) || 0;

  const onSendCounter = () => {
    if (counterAmount <= 0) {
      Alert.alert("Enter an amount", "Set your counter amount first.");
      return;
    }
    Alert.alert(
      "Send counter?",
      `Send a counter-offer of ₦${counter} on ${offer.listing?.title ?? "this property"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => run(() => offersService.counter(offer.id, counterAmount)),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Drag handle */}
      <View className="items-center pt-2 pb-1">
        <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "#d3cdc1" }} />
      </View>

      <View className="px-5 pt-3">
        <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
          Counter offer
        </Text>
        <Text className="text-[14px] font-sans-bold text-ink mt-1.5">
          {offer.listing?.title ?? "Property"}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">
          {otherParty} is at {theirCounter}
        </Text>

        {/* Counter input */}
        <View
          className="mt-5 bg-cream-2 rounded-2xl px-4 py-4 flex-row items-baseline gap-1.5"
          style={{ borderWidth: 1.5, borderColor: INK }}
        >
          <Text className="font-serif text-ink" style={{ fontSize: 28, lineHeight: 32 }}>
            ₦
          </Text>
          <TextInput
            value={counter}
            onChangeText={(t) => setCounter(fmt(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={INK_3}
            className="flex-1 font-serif text-ink"
            style={{ fontSize: 30, padding: 0, letterSpacing: -0.5 }}
          />
        </View>

        {/* Quick chips */}
        <View className="flex-row gap-2 mt-3">
          <Pressable
            onPress={() => setCounter(fmt(String(offer.currentAmountNaira)))}
            className="px-3.5 py-2 rounded-full bg-white border-line active:opacity-80"
            style={{ borderWidth: 1 }}
          >
            <Text className="text-[12px] font-sans-bold text-ink-2">
              Match {theirCounter}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setCounter(fmt(String(counterAmount + 1_000_000)))}
            className="px-3.5 py-2 rounded-full bg-white border-line active:opacity-80"
            style={{ borderWidth: 1 }}
          >
            <Text className="text-[12px] font-sans-bold text-ink-2">+₦1M</Text>
          </Pressable>
        </View>

        {/* Ladder */}
        <View className="mt-4 bg-white rounded-2xl px-4 py-3 border-line" style={{ borderWidth: 0.5 }}>
          <LadderRow label="Asking" value={offer.listing?.priceLabel ?? "—"} />
          <LadderRow label="On the table" value={theirCounter} />
          <LadderRow label="Your counter" value={`₦${counter || "0"}`} highlight />
          <LadderRow label="Opening offer" value={offer.amountLabel} muted last />
        </View>

        {/* Actions */}
        {busy ? (
          <View className="mt-6 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <View className="mt-5 gap-2.5">
            <Pressable
              onPress={onSendCounter}
              className="bg-primary rounded-full items-center active:opacity-80"
              style={{ paddingVertical: 15 }}
            >
              <Text className="text-white font-sans-bold text-[14.5px]">
                Send counter · ₦{counter || "0"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Accept counter?",
                  `Accept the ${theirCounter} counter on ${offer.listing?.title ?? "this property"}? This kicks off the purchase process.`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Accept",
                      onPress: () => run(() => offersService.accept(offer.id)),
                    },
                  ],
                )
              }
              className="bg-primary-soft rounded-full items-center active:opacity-80"
              style={{ paddingVertical: 15 }}
            >
              <Text className="font-sans-bold text-[14.5px]" style={{ color: PRIMARY_INK }}>
                Accept {theirCounter}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Decline counter?",
                  `Decline the ${theirCounter} counter on ${offer.listing?.title ?? "this property"}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Decline",
                      style: "destructive",
                      onPress: () => run(() => offersService.decline(offer.id)),
                    },
                  ],
                )
              }
              className="rounded-full items-center active:opacity-70 bg-white"
              style={{ paddingVertical: 14, borderWidth: 1.5, borderColor: DECLINE }}
            >
              <Text className="font-sans-bold text-[14.5px]" style={{ color: DECLINE }}>
                Decline
              </Text>
            </Pressable>
          </View>
        )}

        <View className="flex-row items-center justify-center gap-1.5 mt-3">
          <Ionicons name="information-circle-outline" size={12} color={INK_3} />
          <Text className="text-[11px] text-ink-3 font-sans-medium">
            Non-binding · you and the seller settle directly
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LadderRow({
  label,
  value,
  highlight,
  muted,
  last,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between py-2"
      style={{ borderBottomWidth: last ? 0 : 0.5, borderBottomColor: "#ece6df" }}
    >
      <Text className="text-[11.5px] font-sans-semibold text-ink-3">{label}</Text>
      <Text
        className="font-sans-bold"
        style={{
          fontSize: highlight ? 15 : 13,
          color: highlight ? PRIMARY : muted ? INK_3 : INK_2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
