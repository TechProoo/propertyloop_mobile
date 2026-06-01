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
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getVendorJob } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const FEE_RATE = 0.1;

const PRESETS = [
  { id: "supplies",  label: "Extra supplies"        },
  { id: "scope",     label: "Larger scope"          },
  { id: "transport", label: "Extra trip / transport" },
  { id: "time",      label: "Overtime"              },
];

export default function VendorExtraScreen() {
  const params = useLocalSearchParams<{ jobId?: string }>();
  const job = getVendorJob(params.jobId);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("supplies");
  const [note, setNote]     = useState("");

  const amountNum = Number(amount) || 0;
  const net = useMemo(() => Math.round(amountNum * (1 - FEE_RATE)), [amountNum]);
  const canSend = amountNum > 0 && note.trim().length > 4;

  const onSend = () => {
    if (!canSend) {
      Alert.alert("Almost there", "Enter an amount and a short reason.");
      return;
    }
    Alert.alert(
      "Request sent",
      `${job.customer.name} will be asked to approve ₦${amountNum.toLocaleString()}. You'll be notified when they decide.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Drag handle */}
        <View className="items-center pt-2 pb-1">
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "#d3cdc1" }} />
        </View>

        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-ink-2">Cancel</Text>
          </Pressable>
          <Text className="text-[15px] font-sans-bold text-ink">Request extra</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            className="font-serif text-ink mt-2"
            style={{ fontSize: 24, letterSpacing: -0.5, lineHeight: 26 }}
          >
            Charge an <Text className="font-serif-italic">extra</Text>
          </Text>
          <Text className="text-[13px] text-ink-2 mt-1.5 leading-5">
            {job.customer.name} must approve before this is added to the job total.
          </Text>

          {/* Amount input */}
          <Label className="mt-5">Amount</Label>
          <View
            className="mt-2 bg-white rounded-2xl px-4 py-3.5 flex-row items-baseline gap-1.5"
            style={{ borderWidth: 1.5, borderColor: "#1a2120" }}
          >
            <Text className="text-[18px] font-sans-bold text-ink-3">₦</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={INK_3}
              className="flex-1 font-serif text-ink"
              style={{ fontSize: 26, padding: 0, letterSpacing: -0.4 }}
            />
            {amountNum > 0 && (
              <Text className="text-[11px] font-sans-semibold text-ink-3">
                You keep ₦{net.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Reason chips */}
          <Label className="mt-5">Reason</Label>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {PRESETS.map((p) => {
              const on = reason === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setReason(p.id)}
                  className="px-3.5 py-2 rounded-full"
                  style={{
                    backgroundColor: on ? "#1a2120" : "#ffffff",
                    borderWidth: on ? 0 : 1,
                    borderColor: "#e1dcd3",
                  }}
                >
                  <Text className="text-[12.5px] font-sans-bold" style={{ color: on ? "#ffffff" : INK_2 }}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Note */}
          <Label className="mt-5">Details for the customer</Label>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
            placeholder='"Found two extra rooms not in the original brief — needs an extra hour to do properly."'
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px] mt-2"
            style={{ minHeight: 90, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
          />

          <View
            className="mt-5 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start"
            style={{ backgroundColor: "#e3efe7" }}
          >
            <Ionicons name="shield-checkmark" size={15} color={PRIMARY_INK} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11.5px] leading-4" style={{ color: PRIMARY_INK }}>
              Customer's escrow tops up by this amount if they approve. You can't charge an extra
              without approval.
            </Text>
          </View>
        </ScrollView>

        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{ borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 }}
        >
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              Send request{amountNum > 0 ? ` · ₦${amountNum.toLocaleString()}` : ""}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase ${className ?? ""}`}>
      {children}
    </Text>
  );
}

void PRIMARY;
