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
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingCta from "@/components/onboarding/OnboardingCta";

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

export default function VendorPayoutSetupScreen() {
  const [bank, setBank]     = useState("Guaranty Trust Bank");
  const [acct, setAcct]     = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified]   = useState(false);
  const [resolvedName, setResolvedName] = useState("");

  const acctValid = /^[0-9]{10}$/.test(acct);
  const canContinue = !!bank && acctValid && verified;

  const verify = () => {
    if (!acctValid) {
      Alert.alert("Account number", "Enter a 10-digit account number.");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setResolvedName("SPARKLE AND CO LTD");
    }, 700);
  };

  const onFinish = () => {
    if (!canContinue) {
      Alert.alert("Verify first", "Confirm the account before submitting.");
      return;
    }
    router.replace("/vendor-submitted" as Href);
  };

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
            <Text className="text-ink font-sans-bold text-sm">Payout account</Text>
            <View style={{ width: 36 }} />
          </View>
          <OnboardingProgress step={4} total={4} className="px-5 mt-3" />

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mt-5"
              style={{ backgroundColor: "#e3efe7" }}
            >
              <Ionicons name="business-outline" size={26} color={PRIMARY_INK} />
            </View>
            <Text
              className="font-serif text-ink mt-4"
              style={{ fontSize: 26, lineHeight: 28, letterSpacing: -0.5 }}
            >
              Where should we <Text className="font-serif-italic">pay you</Text>?
            </Text>
            <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
              Escrow releases land here, usually within 24 hours of a confirmed job.
            </Text>

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
                      setResolvedName("");
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
                    <Text className="text-[12.5px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>
                      {b}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Label className="mt-5">Account number</Label>
            <TextInput
              value={acct}
              onChangeText={(t) => {
                setAcct(t.replace(/[^0-9]/g, "").slice(0, 10));
                setVerified(false);
                setResolvedName("");
              }}
              keyboardType="number-pad"
              placeholder="10 digits"
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] font-sans-bold mt-1.5"
              style={{ letterSpacing: 2 }}
            />

            <Pressable
              onPress={verify}
              disabled={verifying}
              className="mt-3 rounded-full items-center active:opacity-80"
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
                {verifying ? "Resolving…" : verified ? "Re-resolve" : "Resolve account name"}
              </Text>
            </Pressable>

            {verified && (
              <View
                className="mt-3 rounded-xl px-3.5 py-3 flex-row items-center gap-2.5"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Ionicons name="shield-checkmark" size={18} color={PRIMARY} />
                <View className="flex-1">
                  <Text className="text-[13px] font-sans-bold" style={{ color: PRIMARY_INK }}>
                    {resolvedName}
                  </Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: PRIMARY_INK, opacity: 0.7 }}>
                    Account name confirmed via Paystack
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row items-center justify-center gap-1.5 mt-5">
              <Ionicons name="shield-checkmark-outline" size={12} color={INK_3} />
              <Text className="text-[11px] text-ink-3">
                Bank details secured by <Text className="font-sans-bold text-ink-2">Paystack</Text>
              </Text>
            </View>
          </ScrollView>

          <View
            className="absolute left-0 right-0 bottom-0 bg-cream border-line"
            style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
          >
            <OnboardingCta
              label="Finish & submit for review"
              ready={canContinue}
              onPress={onFinish}
              getMissing={() =>
                [
                  !bank && "your bank",
                  !acctValid && "a 10-digit account number",
                  bank && acctValid && !verified && "account confirmation",
                ].filter(Boolean) as string[]
              }
            />
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
