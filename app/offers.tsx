import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import offersService, {
  type Offer,
  type OfferStatus,
} from "@/api/services/offers";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS = [
  { id: "active", label: "Active" },
  { id: "accepted", label: "Accepted" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const ACTIVE: OfferStatus[] = ["PENDING", "COUNTERED"];
const CLOSED: OfferStatus[] = ["DECLINED", "WITHDRAWN", "EXPIRED"];

const STATUS_UI: Record<
  OfferStatus,
  { bg: string; fg: string; dot: string; label: string }
> = {
  PENDING: { bg: "#f5ead4", fg: "#6b4a16", dot: "#b9842c", label: "Awaiting reply" },
  COUNTERED: { bg: "#fbe6d8", fg: "#7a3a13", dot: "#c05a1f", label: "Counter-offer" },
  ACCEPTED: { bg: "#e3efe7", fg: PRIMARY_INK, dot: PRIMARY, label: "Accepted · closing" },
  DECLINED: { bg: "#f3e0de", fg: "#7a1f17", dot: "#b3261e", label: "Declined" },
  WITHDRAWN: { bg: "#ece6df", fg: "#4d524f", dot: "#7f857f", label: "Withdrawn" },
  EXPIRED: { bg: "#ece6df", fg: "#4d524f", dot: "#7f857f", label: "Expired" },
};

export default function OffersScreen() {
  const [tab, setTab] = useState<TabId>("active");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await offersService.listMine();
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

  const counts = {
    active: offers.filter((o) => ACTIVE.includes(o.status)).length,
    accepted: offers.filter((o) => o.status === "ACCEPTED").length,
    closed: offers.filter((o) => CLOSED.includes(o.status)).length,
    all: offers.length,
  };

  const filtered = offers.filter((o) => {
    if (tab === "all") return true;
    if (tab === "active") return ACTIVE.includes(o.status);
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
              Buyer dashboard
            </Text>
            <Text
              className="font-serif text-ink"
              style={{ fontSize: 26, letterSpacing: -0.6, lineHeight: 30 }}
            >
              Your <Text className="font-serif-italic">offers</Text>
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View
          className="flex-row gap-4 px-5 pt-4"
          style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
        >
          {TABS.map((t) => {
            const isOn = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{
                  paddingBottom: 12,
                  marginBottom: -1,
                  borderBottomWidth: isOn ? 2 : 0,
                  borderBottomColor: "#1a2120",
                }}
              >
                <Text
                  className={`text-[13px] ${
                    isOn
                      ? "font-sans-bold text-ink"
                      : "font-sans-semibold text-ink-3"
                  }`}
                >
                  {t.label} · {counts[t.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Body */}
        {loading ? (
          <View className="py-20 items-center">
            <BouncyLoader color={PRIMARY} />
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
            title="Nothing here yet"
            body={
              tab === "active"
                ? "Offers you make show up here while you wait for the agent."
                : "No offers in this tab."
            }
          />
        ) : (
          <View className="px-5 pt-3.5 gap-3">
            {filtered.map((o) => (
              <OfferCard key={o.id} offer={o} onChanged={load} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferCard({ offer, onChanged }: { offer: Offer; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const T = STATUS_UI[offer.status];
  // The buyer can act when the AGENT made the last move on a live counter.
  const agentCountered =
    offer.status === "COUNTERED" && offer.lastActor === "AGENT";

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
        Alert.alert(
          "Something went wrong",
          e?.response?.data?.message ?? "Please try again.",
        );
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
    <View
      className="bg-white rounded-[18px] overflow-hidden border-line"
      style={{ borderWidth: 0.5 }}
    >
      {/* Status bar */}
      <View
        className="flex-row items-center gap-2 px-3.5 py-2"
        style={{ backgroundColor: T.bg }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 7, backgroundColor: T.dot }} />
        <Text
          className="text-[11px] font-sans-bold tracking-widest uppercase"
          style={{ color: T.fg }}
        >
          {T.label}
        </Text>
      </View>

      {/* Body */}
      <Pressable
        onPress={() =>
          offer.status === "ACCEPTED"
            ? router.push("/purchase-progress" as Href)
            : router.push(`/property/${offer.listingId}` as Href)
        }
        className="flex-row gap-3 p-3 active:opacity-90"
      >
        <Image
          source={offer.listing?.coverImage}
          style={{ width: 80, height: 80, borderRadius: 12 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
            {offer.listing?.title ?? "Property"}
          </Text>
          <Text className="text-xs text-ink-3 mt-0.5" numberOfLines={1}>
            {offer.listing?.location}
          </Text>
          <View className="mt-2 flex-row gap-2" style={{ flexWrap: "wrap" }}>
            <PriceTag label="Asking" value={offer.listing?.priceLabel ?? "—"} />
            <PriceTag label="Your offer" value={offer.amountLabel} highlight />
            {offer.status === "COUNTERED" && (
              <PriceTag label="Counter" value={offer.currentAmountLabel} dark />
            )}
          </View>
        </View>
      </Pressable>

      {/* Actions */}
      {busy ? (
        <View
          className="py-3 items-center"
          style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}
        >
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : agentCountered ? (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn
            label="Decline"
            soft
            onPress={() =>
              act(() => offersService.decline(offer.id), {
                title: "Decline counter?",
                message: `Decline the ${offer.currentAmountLabel} counter on ${offer.listing?.title ?? "this property"}?`,
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
                title: "Accept counter?",
                message: `Accept the ${offer.currentAmountLabel} counter? This kicks off the purchase process.`,
                action: "Accept",
              })
            }
          />
        </View>
      ) : offer.status === "PENDING" && offer.lastActor === "BUYER" ? (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn
            label="Withdraw offer"
            soft
            onPress={() =>
              act(() => offersService.withdraw(offer.id), {
                title: "Withdraw offer?",
                message: `Pull your ${offer.amountLabel} offer on ${offer.listing?.title ?? "this property"}?`,
                action: "Withdraw",
              })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function PriceTag({
  label,
  value,
  highlight,
  dark,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  dark?: boolean;
}) {
  const bg = highlight ? "#e3efe7" : dark ? "#1a2120" : "#ece6df";
  const fg = dark ? "#ffffff" : highlight ? PRIMARY_INK : "#1a2120";
  const labelColor = dark
    ? "rgba(255,255,255,0.6)"
    : highlight
      ? PRIMARY_INK
      : INK_3;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
      <Text
        className="text-[9.5px] font-sans-bold tracking-widest uppercase"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      <Text
        className="text-[13px] font-sans-bold mt-0.5"
        style={{ color: fg, letterSpacing: -0.2 }}
      >
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
      <View
        className="bg-white rounded-2xl px-4 py-10 items-center w-full border-line"
        style={{ borderWidth: 0.5 }}
      >
        <Text className="text-[15px] font-sans-bold text-ink">{title}</Text>
        <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
          {body}
        </Text>
        {actionLabel && onAction && (
          <Pressable
            onPress={onAction}
            className="mt-4 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
          >
            <Text className="text-white text-[13px] font-sans-bold">
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
