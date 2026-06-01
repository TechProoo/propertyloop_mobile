import { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const BANKS = [
  "Guaranty Trust Bank",
  "Access Bank",
  "Zenith Bank",
  "First Bank of Nigeria",
  "United Bank for Africa",
  "Stanbic IBTC",
  "Fidelity Bank",
  "Sterling Bank",
  "Wema Bank",
  "Kuda",
  "Opay",
];

export default function PayoutBankScreen() {
  const [bank, setBank]       = useState("Guaranty Trust Bank");
  const [acct, setAcct]       = useState("0123454421");
  const [holder, setHolder]   = useState("Emeka Adeyemi");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified]   = useState(true);
  const [setDefault, setSetDefault] = useState(true);

  const acctValid = /^[0-9]{10}$/.test(acct);
  const canSave = !!bank && acctValid && holder.trim().length > 2 && verified;

  const verify = () => {
    if (!acctValid) {
      Alert.alert("Account number", "Enter a 10-digit account number.");
      return;
    }
    setVerifying(true);
    setVerified(false);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      Alert.alert(
        "Account verified",
        `Name on the account matches ${holder}.`,
      );
    }, 700);
  };

  const onSave = () => {
    if (!canSave) {
      Alert.alert("Missing info", "Verify the account before saving.");
      return;
    }
    Alert.alert(
      "Payout bank saved",
      `${bank} •• ${acct.slice(-4)} will receive future payouts.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
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
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">
            Payout bank
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View
            className="rounded-2xl p-5 mt-2"
            style={{ backgroundColor: "#1a2120" }}
          >
            <Text
              className="text-[11px] font-sans-bold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Payout destination
            </Text>
            <Text
              className="font-serif text-white mt-1.5"
              style={{ fontSize: 22, letterSpacing: -0.4 }}
            >
              {bank || "Choose a bank"}
            </Text>
            <Text
              className="font-serif text-white mt-2"
              style={{ fontSize: 18, letterSpacing: 2 }}
            >
              •• {acct.slice(-4).padStart(4, "•")}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-3">
              <Ionicons
                name={verified ? "shield-checkmark" : "alert-circle-outline"}
                size={13}
                color={verified ? "#7ad296" : "#f0b86c"}
              />
              <Text
                className="text-[11.5px]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {verified
                  ? "Account name verified"
                  : verifying
                    ? "Verifying with bank…"
                    : "Tap verify to confirm"}
              </Text>
            </View>
          </View>

          {/* Bank picker */}
          <Label className="mt-6">Bank</Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 6 }}
          >
            {BANKS.map((b) => {
              const on = bank === b;
              return (
                <Pressable
                  key={b}
                  onPress={() => {
                    setBank(b);
                    setVerified(false);
                  }}
                  className="rounded-full"
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: on ? "#1a2120" : "#ffffff",
                    borderWidth: on ? 0 : 1,
                    borderColor: "#e1dcd3",
                  }}
                >
                  <Text
                    className="text-[12.5px] font-sans-bold"
                    style={{ color: on ? "#ffffff" : INK_2 }}
                  >
                    {b}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Account number */}
          <Label className="mt-5">Account number</Label>
          <TextInput
            value={acct}
            onChangeText={(t) => {
              setAcct(t.replace(/[^0-9]/g, "").slice(0, 10));
              setVerified(false);
            }}
            keyboardType="number-pad"
            placeholder="10 digits"
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] font-sans-bold mt-1.5"
            style={{ letterSpacing: 2 }}
          />

          {/* Holder */}
          <Label className="mt-5">Account name</Label>
          <TextInput
            value={holder}
            onChangeText={setHolder}
            placeholder="As shown by your bank"
            placeholderTextColor={INK_3}
            autoCapitalize="words"
            className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] mt-1.5"
          />

          {/* Verify CTA */}
          <Pressable
            onPress={verify}
            disabled={verifying}
            className="mt-4 rounded-full items-center active:opacity-80"
            style={{
              paddingVertical: 13,
              backgroundColor: verified ? "#e3efe7" : "#ffffff",
              borderWidth: 1,
              borderColor: verified ? "#bcd9c5" : "#e1dcd3",
            }}
          >
            <Text
              className="text-[13px] font-sans-bold"
              style={{ color: verified ? PRIMARY_INK : INK_2 }}
            >
              {verifying ? "Verifying…" : verified ? "Re-verify with bank" : "Verify with bank"}
            </Text>
          </Pressable>

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
              Make this the default payout account
            </Text>
          </Pressable>

          {/* Trust */}
          <View
            className="mt-4 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start"
            style={{ backgroundColor: "#e3efe7" }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={15}
              color={PRIMARY_INK}
              style={{ marginTop: 1 }}
            />
            <Text className="flex-1 text-[11.5px] leading-4" style={{ color: PRIMARY_INK }}>
              Bank details are encrypted and only used to send Paystack payouts.
              You can change them any time — pending payouts are unaffected.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 28,
          }}
        >
          <Pressable
            onPress={onSave}
            disabled={!canSave}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              Save payout account
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5 ${className ?? ""}`}>
      {children}
    </Text>
  );
}
