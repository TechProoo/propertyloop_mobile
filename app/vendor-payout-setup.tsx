import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import paymentsService, { type Bank } from "@/api/services/payments";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingCta from "@/components/onboarding/OnboardingCta";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VendorPayoutSetupScreen() {
  const insets = useSafeAreaInsets();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [query, setQuery] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [acct, setAcct] = useState("");
  const [holder, setHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    paymentsService.listBanks().then(setBanks).catch(() => {});
  }, []);

  const acctValid = /^[0-9]{10}$/.test(acct);
  const canContinue = !!bankCode && acctValid && holder.trim().length > 2;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;
    return list.slice(0, 40);
  }, [banks, query]);

  const onFinish = async () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    try {
      await paymentsService.saveBankAccount({
        accountName: holder.trim(),
        accountNumber: acct,
        bankCode,
        bankName,
      });
      router.replace("/vendor-submitted" as Href);
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.response?.data?.message ?? "Check the details and try again.");
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          {/* Top bar */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <Pressable onPress={() => router.back()} hitSlop={12} className="w-9 h-9 rounded-full bg-white/70 items-center justify-center">
              <Text className="text-ink-2 text-xl">‹</Text>
            </Pressable>
            <Text className="text-ink font-sans-bold text-sm">Payout account</Text>
            <View style={{ width: 36 }} />
          </View>
          <OnboardingProgress step={4} total={4} className="px-5 mt-3" />

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="w-14 h-14 rounded-2xl items-center justify-center mt-5" style={{ backgroundColor: "#e3efe7" }}>
              <Ionicons name="business-outline" size={26} color={PRIMARY_INK} />
            </View>
            <Text className="font-serif text-ink mt-4" style={{ fontSize: 26, lineHeight: 28, letterSpacing: -0.5 }}>
              Where should we <Text className="font-serif-italic">pay you</Text>?
            </Text>
            <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
              Escrow releases land here, usually within 24 hours of a confirmed job.
            </Text>

            <Label className="mt-6">Bank</Label>
            <View className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5 border-line mt-1.5" style={{ borderWidth: 1 }}>
              <Ionicons name="search" size={16} color={INK_3} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Search banks" placeholderTextColor={INK_3} className="flex-1 text-[14px] text-ink" style={{ paddingVertical: 0 }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
              {filtered.map((b) => {
                const on = bankCode === b.code;
                return (
                  <Pressable
                    key={b.code}
                    onPress={() => { setBankName(b.name); setBankCode(b.code); }}
                    className="rounded-full"
                    style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: on ? "#1a2120" : "#ffffff", borderWidth: on ? 0 : 1, borderColor: "#e1dcd3" }}
                  >
                    <Text className="text-[12.5px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>{b.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Label className="mt-5">Account number</Label>
            <TextInput
              value={acct}
              onChangeText={(t) => setAcct(t.replace(/[^0-9]/g, "").slice(0, 10))}
              keyboardType="number-pad"
              placeholder="10 digits"
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] font-sans-bold mt-1.5"
              style={{ letterSpacing: 2 }}
            />

            <Label className="mt-5">Account name</Label>
            <TextInput
              value={holder}
              onChangeText={setHolder}
              placeholder="As shown by your bank"
              placeholderTextColor={INK_3}
              autoCapitalize="words"
              className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] mt-1.5"
            />

            <View className="flex-row items-center justify-center gap-1.5 mt-5">
              <Ionicons name="shield-checkmark-outline" size={12} color={INK_3} />
              <Text className="text-[11px] text-ink-3">
                Bank details secured by <Text className="font-sans-bold text-ink-2">Paystack</Text>
              </Text>
            </View>
          </ScrollView>

          <View className="absolute left-0 right-0 bottom-0 bg-cream border-line" style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}>
            <OnboardingCta
              label={submitting ? "Submitting…" : "Finish & submit for review"}
              ready={canContinue && !submitting}
              onPress={onFinish}
              getMissing={() =>
                [
                  !bankCode && "your bank",
                  !acctValid && "a 10-digit account number",
                  holder.trim().length <= 2 && "the account name",
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
