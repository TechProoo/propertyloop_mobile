import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import offersService, {
  type Offer,
  type OfferStatus,
} from "@/api/services/offers";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS = [
  { id: "review", label: "To review" },
  { id: "accepted", label: "Accepted" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const CLOSED: OfferStatus[] = ["DECLINED", "WITHDRAWN", "EXPIRED"];

const STATUS_UI: Record<
  OfferStatus,
  { bg: string; fg: string; dot: string; label: string }
> = {
  PENDING: { bg: "#f5ead4", fg: "#6b4a16", dot: "#b9842c", label: "New offer" },
  COUNTERED: { bg: "#fbe6d8", fg: "#7a3a13", dot: "#c05a1f", label: "In negotiation" },
  ACCEPTED: { bg: "#e3efe7", fg: PRIMARY_INK, dot: PRIMARY, label: "Accepted" },
  DECLINED: { bg: "#f3e0de", fg: "#7a1f17", dot: "#b3261e", label: "Declined" },
  WITHDRAWN: { bg: "#ece6df", fg: "#4d524f", dot: "#7f857f", label: "Withdrawn" },
  EXPIRED: { bg: "#ece6df", fg: "#4d524f", dot: "#7f857f", label: "Expired" },
};

export default function AgentOffersScreen() {
  const [tab, setTab] = useState<TabId>("review");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await offersService.listReceived();
      setOffers(res.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The agent's turn = buyer made the last move on a live offer.
  const isAgentTurn = (o: Offer) =>
    (o.status === "PENDING" || o.status === "COUNTERED") &&
    o.lastActor === "BUYER";

  const counts = {
    review: offers.filter(isAgentTurn).length,
    accepted: offers.filter((o) => o.status === "ACCEPTED").length,
    closed: offers.filter((o) => CLOSED.includes(o.status)).length,
    all: offers.length,
  };

  const filtered = offers.filter((o) => {
    if (tab === "all") return true;
    if (tab === "review") return isAgentTurn(o);
    if (tab === "accepted") return o.status === "ACCEPTED";
    return CLOSED.includes(o.status);
  });

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-1 flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Text className="text-ink-2 text-xl">‹</Text>
          </Pressable>
          <View>
            <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
              Agent
            </Text>
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 26, letterSpacing: -0.6, lineHeight: 30 }}
            >
              Offers <Text className="font-serif-italic">received</Text>
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View
          className="flex-row gap-4 px-5 pt-4"
          style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
        >
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{
                  paddingBottom: 12,
                  marginBottom: -1,
                  borderBottomWidth: on ? 2 : 0,
                  borderBottomColor: "#1a2120",
                }}
              >
                <Text
                  className={`text-[13px] ${on ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"}`}
                >
                  {t.label} · {counts[t.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : error ? (
          <Empty
            title="Couldn’t load offers"
            body="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => {
              setLoading(true);
              load();
            }}
          />
        ) : filtered.length === 0 ? (
          <Empty
            title="Nothing here"
            body={
              tab === "review"
                ? "Offers from buyers will show up here for you to respond to."
                : "No offers in this tab."
            }
          />
        ) : (
          <View className="px-5 pt-3.5 gap-3">
            {filtered.map((o) => (
              <OfferCard key={o.id} offer={o} onChanged={load} myTurn={isAgentTurn(o)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferCard({
  offer,
  onChanged,
  myTurn,
}: {
  offer: Offer;
  onChanged: () => void;
  myTurn: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const T = STATUS_UI[offer.status];

  const act = (
    fn: () => Promise<unknown>,
    confirm: { title: string; message: string; action: string },
  ) => {
    const run = async () => {
      setBusy(true);
      try {
        await fn();
        onChanged();
      } catch (e: any) {
        Alert.alert("Something went wrong", e?.response?.data?.message ?? "Please try again.");
      } finally {
        setBusy(false);
      }
    };
    Alert.alert(confirm.title, confirm.message, [
      { text: "Cancel", style: "cancel" },
      { text: confirm.action, onPress: run },
    ]);
  };

  return (
    <View className="bg-white rounded-[18px] overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
      <View className="flex-row items-center gap-2 px-3.5 py-2" style={{ backgroundColor: T.bg }}>
        <View style={{ width: 7, height: 7, borderRadius: 7, backgroundColor: T.dot }} />
        <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: T.fg }}>
          {T.label}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push(`/property/${offer.listingId}` as Href)}
        className="flex-row gap-3 p-3 active:opacity-90"
      >
        <Image
          source={offer.listing?.coverImage}
          style={{ width: 76, height: 76, borderRadius: 12 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
            {offer.listing?.title ?? "Property"}
          </Text>
          <Text className="text-xs text-ink-3 mt-0.5" numberOfLines={1}>
            from {offer.buyer?.name ?? "a buyer"}
          </Text>
          <View className="mt-2 flex-row gap-2" style={{ flexWrap: "wrap" }}>
            <PriceTag label="Asking" value={offer.listing?.priceLabel ?? "—"} />
            <PriceTag label="Offer" value={offer.currentAmountLabel} highlight />
          </View>
        </View>
      </Pressable>

      {busy ? (
        <View className="py-3 items-center" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : myTurn ? (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn
            label="Decline"
            soft
            onPress={() =>
              act(() => offersService.decline(offer.id), {
                title: "Decline offer?",
                message: `Decline the ${offer.currentAmountLabel} offer on ${offer.listing?.title ?? "this property"}?`,
                action: "Decline",
              })
            }
          />
          <ActionBtn
            label="Counter"
            color={PRIMARY}
            onPress={() => router.push(`/offer-action?offerId=${offer.id}` as Href)}
          />
          <ActionBtn
            label="Accept"
            filled
            onPress={() =>
              act(() => offersService.accept(offer.id), {
                title: "Accept offer?",
                message: `Accept the ${offer.currentAmountLabel} offer? This starts the purchase process.`,
                action: "Accept",
              })
            }
          />
        </View>
      ) : offer.status === "COUNTERED" ? (
        <View className="px-3.5 py-2.5" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <Text className="text-[11.5px] text-ink-3">
            Waiting on the buyer to respond to your counter.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PriceTag({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const bg = highlight ? "#e3efe7" : "#ece6df";
  const fg = highlight ? PRIMARY_INK : "#1a2120";
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
      <Text
        className="text-[9.5px] font-sans-bold tracking-widest uppercase"
        style={{ color: highlight ? PRIMARY_INK : INK_3 }}
      >
        {label}
      </Text>
      <Text className="text-[13px] font-sans-bold mt-0.5" style={{ color: fg, letterSpacing: -0.2 }}>
        {value}
      </Text>
    </View>
  );
}

function ActionBtn({
  label,
  soft,
  filled,
  color,
  onPress,
}: {
  label: string;
  soft?: boolean;
  filled?: boolean;
  color?: string;
  onPress?: () => void;
}) {
  const bg = filled ? PRIMARY : "transparent";
  const fg = filled ? "#ffffff" : soft ? INK_3 : color ?? "#1a2120";
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center active:opacity-80"
      style={{
        backgroundColor: bg,
        paddingVertical: 13,
        borderRightWidth: filled ? 0 : 0.5,
        borderRightColor: "#ece6df",
      }}
    >
      <Text className="text-[13px] font-sans-bold" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Empty({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="px-5 pt-10 items-center">
      <View className="bg-white rounded-2xl px-4 py-10 items-center w-full border-line" style={{ borderWidth: 0.5 }}>
        <Text className="text-[15px] font-sans-bold text-ink">{title}</Text>
        <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">{body}</Text>
        {actionLabel && onAction && (
          <Pressable onPress={onAction} className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80">
            <Text className="text-white text-[13px] font-sans-bold">{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
