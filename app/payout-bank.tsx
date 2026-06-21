import { useEffect, useMemo, useState } from "react";
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
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import paymentsService, { type Bank } from "@/api/services/payments";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function PayoutBankScreen() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [query, setQuery] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [acct, setAcct] = useState("");
  const [holder, setHolder] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAcct, setShowAcct] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Promise.all([paymentsService.listBanks(), paymentsService.getBankAccount()])
      .then(([bankList, existing]) => {
        setBanks(bankList);
        if (existing) {
          setBankName(existing.bankName);
          setBankCode(existing.bankCode);
          setAcct(existing.accountNumber);
          setHolder(existing.accountName);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const acctValid = /^[0-9]{10}$/.test(acct);
  const canSave = !!bankCode && acctValid && holder.trim().length > 2;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;
    return list.slice(0, 40);
  }, [banks, query]);

  const onSave = async () => {
    if (!canSave) {
      Alert.alert("Missing info", "Pick a bank and enter a 10-digit account number and name.");
      return;
    }
    setSaving(true);
    try {
      await paymentsService.saveBankAccount({
        accountName: holder.trim(),
        accountNumber: acct,
        bankCode,
        bankName,
      });
      Alert.alert("Payout bank saved", `${bankName} •• ${acct.slice(-4)} will receive your payouts.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.response?.data?.message ?? "Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
          <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">Payout bank</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View className="rounded-2xl p-5 mt-2" style={{ backgroundColor: "#1a2120" }}>
              <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
                Payout destination
              </Text>
              <Text className="font-serif text-white mt-1.5" style={{ fontSize: 22, letterSpacing: -0.4 }}>
                {bankName || "Choose a bank"}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="font-serif text-white" style={{ fontSize: 18, letterSpacing: 2 }}>
                  {acct.length === 0
                    ? "••••••••••"
                    : showAcct
                      ? acct
                      : `${"•".repeat(Math.max(0, acct.length - 4))}${acct.slice(-4)}`}
                </Text>
                {acct.length > 0 && (
                  <Pressable
                    onPress={() => setShowAcct((v) => !v)}
                    hitSlop={10}
                    className="flex-row items-center gap-1.5"
                  >
                    <Ionicons
                      name={showAcct ? "eye-off-outline" : "eye-outline"}
                      size={17}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text className="text-[12px] font-sans-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {showAcct ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Bank picker */}
            <Label className="mt-6">Bank</Label>
            <View className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5 border-line mt-1.5" style={{ borderWidth: 1 }}>
              <Ionicons name="search" size={16} color={INK_3} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search banks"
                placeholderTextColor={INK_3}
                className="flex-1 text-[14px] text-ink"
                style={{ paddingVertical: 0 }}
              />
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

            {/* Account number */}
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

            {/* Trust */}
            <View className="mt-5 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start" style={{ backgroundColor: "#e3efe7" }}>
              <Ionicons name="lock-closed-outline" size={15} color={PRIMARY_INK} style={{ marginTop: 1 }} />
              <Text className="flex-1 text-[11.5px] leading-4" style={{ color: PRIMARY_INK }}>
                Bank details are encrypted and only used to send Paystack payouts. You can change them any time.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* Sticky CTA */}
        {!loading && (
          <View className="absolute left-0 right-0 bottom-0 bg-cream border-line" style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}>
            <Pressable
              onPress={onSave}
              disabled={!canSave || saving}
              className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
              style={{ paddingVertical: 16, opacity: !canSave || saving ? 0.5 : 1 }}
            >
              <Text className="text-white font-sans-bold text-[15px]">{saving ? "Saving…" : "Save payout account"}</Text>
            </Pressable>
          </View>
        )}
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
