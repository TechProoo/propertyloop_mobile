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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Account-name verification via Paystack resolve.
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  // Fallback when an account legitimately can't be auto-verified.
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Promise.all([paymentsService.listBanks(), paymentsService.getBankAccount()])
      .then(([bankList, existing]) => {
        setBanks(bankList);
        if (existing) {
          setBankName(existing.bankName);
          setBankCode(existing.bankCode);
          setAcct(existing.accountNumber);
          setResolvedName(existing.accountName);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const acctValid = /^[0-9]{10}$/.test(acct);

  // Auto-verify the account holder whenever a full account number + bank are
  // present. Debounced so we don't hit Paystack on every keystroke.
  useEffect(() => {
    if (!acctValid || !bankCode) {
      setResolvedName("");
      setResolveError(null);
      setResolving(false);
      return;
    }
    let active = true;
    setResolving(true);
    setResolveError(null);
    setResolvedName("");
    const t = setTimeout(async () => {
      try {
        const res = await paymentsService.resolveAccount(acct, bankCode);
        if (!active) return;
        setResolvedName(res.accountName);
        setManualMode(false);
      } catch (e: any) {
        if (!active) return;
        setResolveError(
          e?.response?.data?.message ??
            "Couldn't verify this account. Check the number and bank.",
        );
      } finally {
        if (active) setResolving(false);
      }
    }, 550);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [acct, bankCode, acctValid]);

  // The name we actually save: the Paystack-verified one, or a manual fallback.
  const accountName = manualMode ? manualName.trim() : resolvedName;
  const verified = !manualMode && !!resolvedName;
  const canSave =
    !!bankCode && acctValid && accountName.length > 2 && (verified || manualMode);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;
    return list.slice(0, 40);
  }, [banks, query]);

  const onSave = async () => {
    if (!canSave) {
      Alert.alert("Confirm your account", "Pick a bank, enter your 10-digit account number, and confirm the name we find.");
      return;
    }
    setSaving(true);
    try {
      await paymentsService.saveBankAccount({
        accountName,
        accountNumber: acct,
        bankCode,
        bankName,
      });
      Alert.alert("Payout bank saved", `${accountName} · ${bankName} (${acct}) will receive your payouts.`, [
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
            {/* Hero — payout destination, shown in full so it can be verified */}
            <View className="rounded-2xl p-5 mt-2" style={{ backgroundColor: "#1a2120" }}>
              <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
                Payout destination
              </Text>
              <Text className="font-serif text-white mt-1.5" style={{ fontSize: 22, letterSpacing: -0.4 }}>
                {bankName || "Choose a bank"}
              </Text>
              <Text className="font-serif text-white mt-1" style={{ fontSize: 18, letterSpacing: 2 }}>
                {acct.length === 0 ? "0000000000" : acct}
              </Text>
              {/* Verified account holder */}
              {verified ? (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <Ionicons name="checkmark-circle" size={15} color="#7ad296" />
                  <Text className="text-[13px] font-sans-bold" style={{ color: "#7ad296" }} numberOfLines={1}>
                    {resolvedName}
                  </Text>
                </View>
              ) : manualMode && accountName.length > 2 ? (
                <Text className="text-[13px] font-sans-bold mt-2" style={{ color: "rgba(255,255,255,0.85)" }} numberOfLines={1}>
                  {accountName}
                </Text>
              ) : (
                <Text className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Enter your account number to confirm the name
                </Text>
              )}
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

            {/* Account name — verified automatically, not typed */}
            <Label className="mt-5">Account name</Label>
            {resolving ? (
              <View className="bg-white border border-line rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5 mt-1.5">
                <BouncyLoader color={PRIMARY} />
                <Text className="text-[14px] text-ink-3">Checking account…</Text>
              </View>
            ) : verified ? (
              <View
                className="rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5 mt-1.5"
                style={{ backgroundColor: "#e3efe7", borderWidth: 1, borderColor: "#bfe0cb" }}
              >
                <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />
                <View className="flex-1">
                  <Text className="text-[15px] font-sans-bold text-ink" numberOfLines={1}>
                    {resolvedName}
                  </Text>
                  <Text className="text-[11px] font-sans-semibold mt-0.5" style={{ color: PRIMARY_INK }}>
                    Verified with your bank
                  </Text>
                </View>
              </View>
            ) : manualMode ? (
              <>
                <TextInput
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="As shown by your bank"
                  placeholderTextColor={INK_3}
                  autoCapitalize="words"
                  className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] mt-1.5"
                />
                <Text className="text-[11px] text-ink-3 mt-1.5">
                  Double-check this matches your bank exactly — payouts to a wrong name can fail or go astray.
                </Text>
              </>
            ) : resolveError ? (
              <View
                className="rounded-2xl px-4 py-3.5 mt-1.5"
                style={{ backgroundColor: "#fdecea", borderWidth: 1, borderColor: "#f1b5ab" }}
              >
                <View className="flex-row items-start gap-2.5">
                  <Ionicons name="alert-circle" size={17} color="#b3261e" style={{ marginTop: 1 }} />
                  <Text className="flex-1 text-[12.5px] font-sans-semibold" style={{ color: "#7a1d12" }}>
                    {resolveError}
                  </Text>
                </View>
                <Pressable onPress={() => setManualMode(true)} hitSlop={6} className="mt-2 self-start">
                  <Text className="text-[12.5px] font-sans-bold" style={{ color: "#b3261e" }}>
                    Enter name manually instead
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="bg-white border border-line rounded-2xl px-4 py-3.5 mt-1.5">
                <Text className="text-[14px] text-ink-3">
                  Pick a bank and enter your account number to confirm the name.
                </Text>
              </View>
            )}

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
