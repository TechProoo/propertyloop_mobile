import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { PressableScale } from "@/components/anim";
import {
  cart,
  useCart,
  useCartSubtotal,
  type CartLine,
} from "@/lib/storeCart";
import { tapLight } from "@/lib/haptics";
import { Alert } from "@/lib/dialog";
import {
  naira,
  estimateDelivery,
  estimatePlatformFee,
} from "@/lib/money";
import { useAuth } from "@/context/auth";
import marketplaceService from "@/api/services/marketplace";

const PRIMARY = "#1f6f43";

export default function CartScreen() {
  const lines = useCart();
  const subtotal = useCartSubtotal();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const delivery = estimateDelivery(subtotal);
  const platformFee = estimatePlatformFee(subtotal);
  const total = subtotal + delivery + platformFee;

  function validate(): string | null {
    if (lines.length === 0) return "Your cart is empty.";
    if (!name.trim()) return "Please enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return "Please enter a valid email.";
    if (!phone.trim()) return "Please enter a phone number.";
    if (!address.trim()) return "Please enter a delivery address.";
    if (!city.trim()) return "Please enter a city.";
    if (!stateField.trim()) return "Please enter a state.";
    return null;
  }

  async function checkout() {
    const err = validate();
    if (err) {
      Alert.alert("Almost there", err);
      return;
    }
    setSubmitting(true);
    try {
      const returnUrl = Linking.createURL("payment-callback");
      const { reference, paymentUrl } = await marketplaceService.createOrder({
        buyerName: name.trim(),
        buyerEmail: email.trim(),
        buyerPhone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateField.trim(),
        notes: notes.trim() || undefined,
        returnUrl,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          options: l.options,
        })),
      });

      // In-app browser that closes when Paystack redirects to returnUrl.
      await WebBrowser.openAuthSessionAsync(paymentUrl, returnUrl);

      // Confirm the charge regardless of how the browser closed.
      const order = await marketplaceService.verifyOrder(reference);
      if (order.status === "PAID" || order.status === "FULFILLED") {
        cart.clear();
        router.replace(`/marketplace/order/${reference}` as Href);
      } else {
        // Not paid — still take them to the order page, which polls/verifies
        // and shows the pending state.
        router.replace(`/marketplace/order/${reference}` as Href);
      }
    } catch (e: any) {
      Alert.alert(
        "Checkout failed",
        e?.response?.data?.message ?? "We couldn't start the payment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center gap-3 px-5 pt-2 pb-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#1a2120" />
          </Pressable>
          <Text className="flex-1 font-serif text-ink text-[22px]">Your cart</Text>
          {lines.length > 0 && (
            <Pressable
              onPress={() => {
                tapLight();
                Alert.alert("Clear cart?", "Remove everything from your cart?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive", onPress: () => cart.clear() },
                ]);
              }}
              hitSlop={10}
            >
              <Text className="text-ink-3 text-[13px] font-sans-medium">Clear</Text>
            </Pressable>
          )}
        </View>

        {lines.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Ionicons name="cart-outline" size={40} color="#c7ccc8" />
            <Text className="text-ink text-[16px] font-sans-bold mt-4">
              Your cart is empty
            </Text>
            <Text className="text-ink-3 text-[13.5px] text-center mt-1.5 leading-5">
              Browse the marketplace and add what you need for your home.
            </Text>
            <PressableScale
              onPress={() => router.replace("/marketplace" as Href)}
              className="mt-5 rounded-full bg-primary px-6 py-3"
            >
              <Text className="text-white font-sans-bold text-[14px]">
                Browse marketplace
              </Text>
            </PressableScale>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 170 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Lines */}
              <View className="px-5 gap-3">
                {lines.map((l) => (
                  <CartRow key={l.productId + JSON.stringify(l.options ?? {})} line={l} />
                ))}
              </View>

              {/* Delivery details */}
              <View className="px-5 mt-6">
                <Text className="text-ink text-[15px] font-sans-bold mb-3">
                  Delivery details
                </Text>
                <View className="gap-2.5">
                  <Field label="Full name" value={name} onChange={setName} />
                  <Field
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    keyboardType="email-address"
                  />
                  <Field
                    label="Phone"
                    value={phone}
                    onChange={setPhone}
                    keyboardType="phone-pad"
                  />
                  <Field label="Address" value={address} onChange={setAddress} />
                  <View className="flex-row gap-2.5">
                    <View className="flex-1">
                      <Field label="City" value={city} onChange={setCity} />
                    </View>
                    <View className="flex-1">
                      <Field label="State" value={stateField} onChange={setStateField} />
                    </View>
                  </View>
                  <Field
                    label="Notes (optional)"
                    value={notes}
                    onChange={setNotes}
                    multiline
                  />
                </View>
              </View>

              {/* Summary */}
              <View className="mx-5 mt-6 rounded-2xl bg-white border border-line p-4">
                <SummaryRow label="Subtotal" value={naira(subtotal)} />
                <SummaryRow
                  label="Delivery (est.)"
                  value={delivery === 0 ? "Free" : naira(delivery)}
                />
                <SummaryRow label="Service fee (est.)" value={naira(platformFee)} />
                <View className="h-px bg-line my-2.5" />
                <SummaryRow label="Total" value={naira(total)} bold />
                <Text className="text-ink-3 text-[11px] mt-2 leading-4">
                  Delivery and fees are confirmed at payment. Held safely until
                  your order is delivered.
                </Text>
              </View>
            </ScrollView>

            {/* Sticky checkout */}
            <SafeAreaView
              edges={["bottom"]}
              className="absolute bottom-0 left-0 right-0 bg-cream border-t border-line"
            >
              <View className="px-5 py-3">
                <PressableScale
                  onPress={checkout}
                  disabled={submitting}
                  className="rounded-full bg-primary py-4 flex-row items-center justify-center gap-2"
                  style={submitting ? { opacity: 0.7 } : undefined}
                >
                  <Ionicons name="lock-closed" size={16} color="#ffffff" />
                  <Text className="text-white font-sans-bold text-[15px]">
                    {submitting ? "Starting payment…" : `Pay ${naira(total)}`}
                  </Text>
                </PressableScale>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

function CartRow({ line }: { line: CartLine }) {
  return (
    <View className="flex-row gap-3 rounded-2xl bg-white border border-line p-3">
      <Image
        source={{ uri: line.image }}
        style={{ width: 68, height: 68, borderRadius: 12 }}
        contentFit="cover"
      />
      <View className="flex-1 min-w-0">
        <Text numberOfLines={2} className="text-ink text-[13.5px] font-sans-semibold">
          {line.name}
        </Text>
        {line.options && Object.keys(line.options).length > 0 && (
          <Text className="text-ink-3 text-[11px] mt-0.5">
            {Object.entries(line.options)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          </Text>
        )}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-primary-ink text-[14px] font-sans-bold">
            {naira(line.priceNaira * line.quantity)}
          </Text>
          <View className="flex-row items-center gap-3 rounded-full bg-cream-2 px-2.5 py-1">
            <Pressable
              onPress={() =>
                cart.setQuantity(line.productId, line.options, line.quantity - 1)
              }
              hitSlop={8}
            >
              <Ionicons
                name={line.quantity <= 1 ? "trash-outline" : "remove"}
                size={16}
                color="#1a2120"
              />
            </Pressable>
            <Text className="text-ink text-[14px] font-sans-bold w-5 text-center">
              {line.quantity}
            </Text>
            <Pressable
              onPress={() =>
                cart.setQuantity(line.productId, line.options, line.quantity + 1)
              }
              hitSlop={8}
            >
              <Ionicons name="add" size={16} color="#1a2120" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function SummaryRow({
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
      <Text
        className={`text-[13px] ${bold ? "text-ink font-sans-bold" : "text-ink-2"}`}
      >
        {label}
      </Text>
      <Text
        className={`text-[13px] ${
          bold ? "text-ink text-[16px] font-sans-bold" : "text-ink font-sans-medium"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: "email-address" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text className="text-ink-3 text-[11px] font-sans-semibold uppercase tracking-wide mb-1">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        className="rounded-xl bg-white border border-line px-3.5 py-3 text-[14px] text-ink"
        style={multiline ? { minHeight: 64, textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}
