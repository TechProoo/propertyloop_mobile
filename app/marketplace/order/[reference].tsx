import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Appear, PressableScale } from "@/components/anim";
import { tapLight } from "@/lib/haptics";
import { Alert } from "@/lib/dialog";
import { naira } from "@/lib/money";
import marketplaceService, {
  type MarketplaceOrder,
} from "@/api/services/marketplace";

const PRIMARY = "#1f6f43";

const DISPUTE_REASONS = [
  "Item not delivered",
  "Item damaged or faulty",
  "Wrong item received",
  "Item not as described",
  "Other",
];

export default function OrderConfirmationScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [phase, setPhase] = useState<"loading" | "ok" | "error">("loading");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputed, setDisputed] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!reference) {
      setPhase("error");
      return;
    }
    marketplaceService
      .verifyOrder(reference)
      .then((o) => {
        if (!alive) return;
        setOrder(o);
        setPhase("ok");
      })
      .catch(() => alive && setPhase("error"));
    return () => {
      alive = false;
    };
  }, [reference]);

  if (phase === "loading") {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={PRIMARY} />
        <Text className="text-ink-2 text-[13px] mt-3">Confirming your order…</Text>
      </View>
    );
  }

  if (phase === "error" || !order) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={34} color="#c0392b" />
        <Text className="text-ink text-center mt-3 font-sans-bold">
          We couldn't load this order
        </Text>
        <PressableScale
          onPress={() => router.replace("/marketplace" as Href)}
          className="mt-5 rounded-full bg-primary px-6 py-3"
        >
          <Text className="text-white font-sans-bold">Back to marketplace</Text>
        </PressableScale>
      </View>
    );
  }

  const paid = order.status === "PAID" || order.status === "FULFILLED";
  const canDispute =
    (order.status === "PAID" || order.status === "FULFILLED") && !disputed;

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Status hero */}
          <View className="items-center px-6 pt-8 pb-4">
            <Appear from="fade">
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 76,
                  height: 76,
                  backgroundColor: paid ? "#e3efe7" : "#fdf3e3",
                }}
              >
                <Ionicons
                  name={paid ? "checkmark-circle" : "time-outline"}
                  size={40}
                  color={paid ? PRIMARY : "#b9842c"}
                />
              </View>
            </Appear>
            <Appear delay={120}>
              <Text className="font-serif text-ink text-[26px] mt-4 text-center">
                {paid ? (
                  <>
                    Order <Text className="font-serif-italic">confirmed</Text>
                  </>
                ) : (
                  "Payment pending"
                )}
              </Text>
              <Text className="text-ink-2 text-[13.5px] text-center mt-2 leading-5">
                {paid
                  ? "Thank you. The store has been notified and will prepare your items for delivery."
                  : "We haven't confirmed your payment yet. If you were charged, it will update shortly."}
              </Text>
              <Text className="text-ink-3 text-[12px] text-center mt-2">
                Order {order.orderNumber}
              </Text>
            </Appear>
          </View>

          {/* Items */}
          <View className="px-5 mt-2">
            <Text className="text-ink text-[14px] font-sans-bold mb-2.5">
              {order.items.length} item{order.items.length === 1 ? "" : "s"}
            </Text>
            <View className="rounded-2xl bg-white border border-line overflow-hidden">
              {order.items.map((it, i) => (
                <View
                  key={it.productId + i}
                  className={`flex-row gap-3 p-3 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <Image
                    source={{ uri: it.image }}
                    style={{ width: 54, height: 54, borderRadius: 10 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={2} className="text-ink text-[13px] font-sans-semibold">
                      {it.name}
                    </Text>
                    <Text className="text-ink-3 text-[11px] mt-0.5">
                      {it.storeName} · Qty {it.quantity}
                    </Text>
                  </View>
                  <Text className="text-ink text-[13px] font-sans-bold">
                    {naira(it.lineTotal)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Totals */}
          <View className="mx-5 mt-4 rounded-2xl bg-white border border-line p-4">
            <Row label="Subtotal" value={naira(order.subtotal)} />
            <Row
              label="Delivery"
              value={order.deliveryFee === 0 ? "Free" : naira(order.deliveryFee)}
            />
            <Row label="Service fee" value={naira(order.platformFee)} />
            <View className="h-px bg-line my-2.5" />
            <Row label="Total paid" value={naira(order.total)} bold />
          </View>

          {/* Delivery address */}
          <View className="mx-5 mt-4 rounded-2xl bg-white border border-line p-4">
            <View className="flex-row items-center gap-2 mb-1.5">
              <Ionicons name="location-outline" size={15} color={PRIMARY} />
              <Text className="text-ink text-[13px] font-sans-bold">Deliver to</Text>
            </View>
            <Text className="text-ink-2 text-[13px] leading-5">
              {order.buyerName}
              {"\n"}
              {order.address}, {order.city}, {order.state}
              {"\n"}
              {order.buyerPhone}
            </Text>
          </View>

          {/* Dispute */}
          <View className="px-5 mt-5 items-center">
            {disputed || order.status === "DISPUTED" ? (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="alert-circle" size={15} color="#b9842c" />
                <Text className="text-[12.5px] font-sans-medium text-accent">
                  Our team is reviewing your report.
                </Text>
              </View>
            ) : order.status === "REFUNDED" ? (
              <Text className="text-[12.5px] text-ink-3">
                This order has been refunded.
              </Text>
            ) : canDispute ? (
              <Pressable
                onPress={() => {
                  tapLight();
                  setDisputeOpen(true);
                }}
                className="flex-row items-center gap-1.5"
              >
                <Ionicons name="alert-circle-outline" size={15} color="#7f857f" />
                <Text className="text-[12.5px] font-sans-semibold text-ink-2 underline">
                  Something wrong? Report a problem
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Actions */}
          <View className="px-5 mt-6 gap-2.5">
            <PressableScale
              onPress={() => router.replace("/marketplace" as Href)}
              className="rounded-full bg-primary py-4 items-center"
            >
              <Text className="text-white font-sans-bold text-[15px]">
                Continue shopping
              </Text>
            </PressableScale>
            <Pressable
              onPress={() => router.replace("/(tabs)" as Href)}
              className="py-3 items-center"
            >
              <Text className="text-ink-2 font-sans-semibold text-[14px]">
                Back to home
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DisputeModal
        visible={disputeOpen}
        orderNumber={order.orderNumber}
        onClose={() => setDisputeOpen(false)}
        onDone={() => {
          setDisputeOpen(false);
          setDisputed(true);
        }}
      />
    </View>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={`text-[13px] ${bold ? "text-ink font-sans-bold" : "text-ink-2"}`}>
        {label}
      </Text>
      <Text
        className={`${bold ? "text-ink text-[16px] font-sans-bold" : "text-ink text-[13px] font-sans-medium"}`}
      >
        {value}
      </Text>
    </View>
  );
}

function DisputeModal({
  visible,
  orderNumber,
  onClose,
  onDone,
}: {
  visible: boolean;
  orderNumber: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (details.trim().length < 10) {
      Alert.alert("A little more detail", "Please describe the problem so we can look into it.");
      return;
    }
    setBusy(true);
    try {
      await marketplaceService.raiseDispute(orderNumber, {
        reason,
        details: details.trim(),
      });
      onDone();
      setDetails("");
    } catch {
      Alert.alert("Couldn't submit", "Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-cream rounded-t-3xl px-5 pt-5 pb-8">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-serif text-ink text-[22px]">
                  Report a problem
                </Text>
                <Text className="text-ink-2 text-[13px] mt-1 leading-5">
                  Order {orderNumber}. Our team reviews every report and refunds
                  you if it's warranted.
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color="#7f857f" />
              </Pressable>
            </View>

            <Text className="text-ink text-[12.5px] font-sans-bold mt-5 mb-2">
              What went wrong?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DISPUTE_REASONS.map((r) => {
                const active = reason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    className={`rounded-full border px-3.5 py-2 ${
                      active ? "bg-primary border-primary" : "bg-white border-line"
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-sans-medium ${
                        active ? "text-white" : "text-ink-2"
                      }`}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-ink text-[12.5px] font-sans-bold mt-4 mb-2">
              Tell us more
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              multiline
              placeholder="Describe what happened."
              placeholderTextColor="#7f857f"
              className="rounded-xl bg-white border border-line px-3.5 py-3 text-[14px] text-ink"
              style={{ minHeight: 96, textAlignVertical: "top" }}
            />

            <PressableScale
              onPress={submit}
              disabled={busy}
              className="mt-5 rounded-full bg-primary py-4 items-center"
              style={busy ? { opacity: 0.7 } : undefined}
            >
              <Text className="text-white font-sans-bold text-[15px]">
                {busy ? "Submitting…" : "Submit report"}
              </Text>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
