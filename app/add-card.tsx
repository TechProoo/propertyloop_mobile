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
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

function formatCard(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
function detectBrand(num: string): { label: string; icon: keyof typeof Ionicons.glyphMap } {
  const d = num.replace(/\s/g, "");
  if (d.startsWith("4")) return { label: "Visa", icon: "card" };
  if (/^5[1-5]/.test(d)) return { label: "Mastercard", icon: "card" };
  if (/^5061|^65/.test(d)) return { label: "Verve", icon: "card" };
  return { label: "Card", icon: "card-outline" };
}

export default function AddCardScreen() {
  const [name, setName]   = useState("");
  const [num, setNum]     = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv]     = useState("");
  const [setDefault, setSetDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const brand = useMemo(() => detectBrand(num), [num]);
  const last4 = num.replace(/\s/g, "").slice(-4);

  const canSave =
    name.trim().length > 1 &&
    num.replace(/\s/g, "").length >= 15 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvv.length >= 3;

  const onSave = () => {
    if (!canSave) {
      Alert.alert("Check your card", "Make sure all fields are filled correctly.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        "Card added",
        `${brand.label} •• ${last4} is now on file.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    }, 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={INK_2} />
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">Add card</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Visual card */}
          <View
            className="rounded-2xl p-5 mt-2 overflow-hidden"
            style={{ backgroundColor: INK, minHeight: 170 }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {brand.label}
              </Text>
              <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: "90deg" }] }} />
            </View>
            <Text
              className="font-serif text-white mt-7"
              style={{ fontSize: 22, letterSpacing: 2 }}
            >
              {num || "•••• •••• •••• ••••"}
            </Text>
            <View className="flex-row justify-between mt-4">
              <View>
                <Text className="text-[9.5px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Holder
                </Text>
                <Text className="text-[12px] font-sans-bold text-white mt-0.5" numberOfLines={1}>
                  {name.toUpperCase() || "CARDHOLDER NAME"}
                </Text>
              </View>
              <View>
                <Text className="text-[9.5px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Exp
                </Text>
                <Text className="text-[12px] font-sans-bold text-white mt-0.5">
                  {expiry || "MM/YY"}
                </Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View className="mt-5 gap-4">
            <Field
              label="Cardholder name"
              value={name}
              onChangeText={setName}
              placeholder="Tunde Adebayo"
              autoCapitalize="words"
              autoComplete="cc-name"
            />
            <Field
              label="Card number"
              value={num}
              onChangeText={(v) => setNum(formatCard(v))}
              placeholder="1234 5678 9012 3456"
              keyboardType="number-pad"
              autoComplete="cc-number"
              maxLength={19}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="Expiry"
                  value={expiry}
                  onChangeText={(v) => setExpiry(formatExpiry(v))}
                  placeholder="MM/YY"
                  keyboardType="number-pad"
                  autoComplete="cc-exp"
                  maxLength={5}
                />
              </View>
              <View className="flex-1">
                <Field
                  label="CVV"
                  value={cvv}
                  onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  keyboardType="number-pad"
                  autoComplete="cc-csc"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          {/* Default switch */}
          <Pressable
            onPress={() => setSetDefault((d) => !d)}
            className="mt-5 bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line"
            style={{ borderWidth: 1 }}
          >
            <View
              className="w-5 h-5 rounded items-center justify-center"
              style={{
                backgroundColor: setDefault ? PRIMARY : "transparent",
                borderWidth: setDefault ? 0 : 1.5,
                borderColor: "#d3cdc1",
              }}
            >
              {setDefault && <Ionicons name="checkmark" size={13} color="#ffffff" />}
            </View>
            <Text className="flex-1 text-[13px] font-sans-bold text-ink">
              Use as default payment method
            </Text>
          </Pressable>

          {/* Trust strip */}
          <View
            className="mt-4 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start"
            style={{ backgroundColor: "#e3efe7" }}
          >
            <Ionicons name="lock-closed-outline" size={15} color="#134a2d" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11.5px] leading-4" style={{ color: "#134a2d" }}>
              Card details are tokenised by Paystack. We never see or store the full
              number, expiry, or CVV.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}
        >
          <Pressable
            onPress={onSave}
            disabled={submitting || !canSave}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {submitting ? "Adding…" : "Add card"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
} & React.ComponentProps<typeof TextInput>;

function Field({ label, ...rest }: FieldProps) {
  return (
    <View>
      <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">
        {label}
      </Text>
      <TextInput
        placeholderTextColor={INK_3}
        className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] font-sans-bold"
        style={{ letterSpacing: rest.maxLength && rest.maxLength > 10 ? 1 : 0 }}
        {...rest}
      />
    </View>
  );
}
