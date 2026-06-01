import { useMemo, useState } from "react";
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
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { VENDOR_DURATIONS, VENDOR_SERVICES } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const FEE_RATE = 0.1;

export default function VendorFirstServiceScreen() {
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();
  const editing = params.id ? VENDOR_SERVICES.find((s) => s.id === params.id) ?? null : null;
  // Modes: onboarding (default first-time, advances to payout) | add | edit
  const mode: "onboarding" | "add" | "edit" =
    editing ? "edit" : params.mode === "add" ? "add" : "onboarding";

  const editingFromIsFrom = editing?.price?.startsWith("from") ?? false;
  const editingPriceDigits = editing ? editing.price.replace(/[^0-9]/g, "") : "";

  const [name, setName]           = useState(editing?.name ?? "");
  const [included, setIncluded]   = useState(editing?.description ?? "");
  const [priceMode, setPriceMode] = useState<"fixed" | "from">(editingFromIsFrom ? "from" : "fixed");
  const [price, setPrice]         = useState(editingPriceDigits);
  const [duration, setDuration]   = useState(editing?.duration ?? VENDOR_DURATIONS[1]);

  const priceNum = Number(price) || 0;
  const net = useMemo(() => Math.round(priceNum * (1 - FEE_RATE)), [priceNum]);
  const canContinue = name.trim().length > 2 && included.trim().length > 10 && priceNum > 0;

  const onContinue = () => {
    if (!canContinue) {
      Alert.alert("Almost there", "Service name, what's included, and a price are required.");
      return;
    }
    if (mode === "onboarding") {
      router.push("/vendor-payout-setup" as Href);
      return;
    }
    Alert.alert(
      mode === "edit" ? "Changes saved" : "Service added",
      mode === "edit"
        ? `"${name.trim()}" updated.`
        : `"${name.trim()}" is now in your menu.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  const title =
    mode === "edit" ? "Edit service" : mode === "add" ? "Add service" : "Add a service";
  const ctaLabel =
    mode === "edit" ? "Save changes" : mode === "add" ? "Save service" : "Save service & continue";

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {/* Top bar */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-white/70 items-center justify-center"
            >
              <Text className="text-ink-2 text-xl">‹</Text>
            </Pressable>
            <View className="items-center">
              <Text className="text-ink font-sans-bold text-sm">{title}</Text>
              {mode === "onboarding" && (
                <Text className="text-ink-3 text-xs mt-0.5">Step 3 of 4</Text>
              )}
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              className="font-serif text-ink mt-6"
              style={{ fontSize: 26, lineHeight: 28, letterSpacing: -0.5 }}
            >
              {mode === "edit" ? (
                <>Edit <Text className="font-serif-italic">service</Text></>
              ) : mode === "add" ? (
                <>New <Text className="font-serif-italic">service</Text></>
              ) : (
                <>Your first <Text className="font-serif-italic">service</Text></>
              )}
            </Text>
            <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
              {mode === "onboarding"
                ? "List one thing you offer. You can build out the full menu after you're live."
                : "Customers see this on your menu and can book it directly."}
            </Text>

            <Label className="mt-5">Service name</Label>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Standard home clean"
              placeholderTextColor={INK_3}
              autoCapitalize="words"
              className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] mt-1.5"
            />

            <Label className="mt-4">What's included</Label>
            <TextInput
              value={included}
              onChangeText={setIncluded}
              multiline
              textAlignVertical="top"
              placeholder="What does the customer get for this price?"
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px] mt-1.5"
              style={{ minHeight: 90, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
            />

            {/* Pricing */}
            <Label className="mt-5">Pricing</Label>
            <View className="flex-row gap-2 mt-2">
              {(["fixed", "from"] as const).map((m) => {
                const on = priceMode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setPriceMode(m)}
                    className="flex-1 rounded-xl items-center py-2.5"
                    style={{
                      backgroundColor: on ? INK : "#ece6df",
                      borderWidth: 0,
                    }}
                  >
                    <Text className="text-[13px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>
                      {m === "fixed" ? "Fixed price" : "From (varies)"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View
              className="mt-2.5 bg-white rounded-2xl px-4 py-3.5 flex-row items-baseline gap-1.5"
              style={{ borderWidth: 1.5, borderColor: INK }}
            >
              <Text className="text-[18px] font-sans-bold text-ink-3">₦</Text>
              <TextInput
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={INK_3}
                className="flex-1 font-serif text-ink"
                style={{ fontSize: 26, padding: 0, letterSpacing: -0.4 }}
              />
              <Text className="text-[11px] font-sans-semibold text-ink-3">
                You keep ₦{net.toLocaleString()} after 10% fee
              </Text>
            </View>

            {/* Duration */}
            <Label className="mt-5">Typical duration</Label>
            <View className="flex-row gap-2 mt-2">
              {VENDOR_DURATIONS.map((d) => {
                const on = duration === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    className="flex-1 rounded-full items-center"
                    style={{
                      paddingVertical: 11,
                      backgroundColor: on ? PRIMARY : "#ffffff",
                      borderWidth: on ? 0 : 1,
                      borderColor: "#e1dcd3",
                    }}
                  >
                    <Text className="text-[12px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Fee explainer */}
            <View
              className="mt-5 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start"
              style={{ backgroundColor: "#e3efe7" }}
            >
              <Ionicons name="shield-checkmark" size={16} color={PRIMARY_INK} style={{ marginTop: 1 }} />
              <View className="flex-1">
                <Text className="text-[12.5px] font-sans-bold" style={{ color: PRIMARY_INK }}>
                  How you get paid
                </Text>
                <Text className="text-[11.5px] mt-1 leading-4" style={{ color: PRIMARY_INK, opacity: 0.78 }}>
                  Customers pay into escrow. After they confirm the job's done, PropertyLoop releases
                  your share (minus a 10% platform fee) to your bank.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            className="absolute left-0 right-0 bottom-0 bg-cream border-line"
            style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
          >
            <Pressable
              onPress={onContinue}
              disabled={!canContinue}
              className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
              style={{ paddingVertical: 17 }}
            >
              <Text className="text-white font-sans-bold text-[15px]">{ctaLabel}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}>
      {children}
    </Text>
  );
}
