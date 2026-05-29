import { useMemo, useState } from "react";
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
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const ASKING = 78_000_000;
const QUICK_ADJUSTMENTS = [
  { label: "-₦1M", delta: -1_000_000 },
  { label: "-₦5M", delta: -5_000_000 },
  { label: "+₦1M", delta: 1_000_000 },
];

type Financing = "cash" | "own";

function formatNaira(n: number): string {
  return n.toLocaleString("en-NG");
}

export default function MakeOfferScreen() {
  useLocalSearchParams<{ listingId?: string }>(); // wire-up only
  const [amount, setAmount] = useState(72_500_000);
  const [financing, setFinancing] = useState<Financing>("cash");
  const [note, setNote] = useState("");

  const pctOff = useMemo(() => {
    const diff = (ASKING - amount) / ASKING;
    return Math.round(diff * 100);
  }, [amount]);

  const offerLabel =
    pctOff > 0
      ? `${pctOff}% below asking`
      : pctOff < 0
        ? `${-pctOff}% above asking`
        : "Matching asking";

  const offerColor = pctOff > 0 ? "#a8421a" : pctOff < 0 ? PRIMARY : INK_2;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center gap-2.5 px-5 pt-1 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={INK_2} />
          </Pressable>
          <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">
            Make an offer
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Property pin */}
          <View className="flex-row gap-3 p-2.5 bg-cream-2 rounded-2xl">
            <Image
              source="https://picsum.photos/seed/hibiscus-1/200/200"
              style={{ width: 60, height: 60, borderRadius: 10 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
                For sale
              </Text>
              <Text className="text-[14px] font-sans-bold text-ink mt-0.5">
                Hibiscus House · 4-bed
              </Text>
              <Text className="text-xs text-ink-3">
                Asking ₦78,000,000 · Lekki P1
              </Text>
            </View>
          </View>

          {/* Your offer */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-6 mb-2">
            Your offer
          </Text>
          <View
            className="bg-white rounded-2xl px-4.5 py-5"
            style={{
              borderWidth: 1.5,
              borderColor: "#1a2120",
              paddingHorizontal: 18,
              paddingVertical: 20,
            }}
          >
            <View className="flex-row items-baseline gap-1">
              <Text className="text-[22px] font-sans-bold text-ink-3">₦</Text>
              <Text
                className="font-serif text-ink"
                style={{ fontSize: 38, letterSpacing: -1.1, lineHeight: 38 }}
              >
                {formatNaira(amount)}
              </Text>
            </View>
            <View className="mt-2.5 flex-row items-center justify-between">
              <Text className="text-xs font-sans-semibold text-ink-3">
                <Text style={{ color: offerColor, fontFamily: "Inter_700Bold" }}>
                  {offerLabel}
                </Text>
              </Text>
              <View className="flex-row gap-1.5">
                {QUICK_ADJUSTMENTS.map((q) => (
                  <Pressable
                    key={q.label}
                    onPress={() => setAmount((a) => Math.max(0, a + q.delta))}
                    className="bg-cream-2 rounded-full px-2 py-1"
                  >
                    <Text className="text-[11px] font-sans-bold text-ink">
                      {q.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Histogram */}
          <View className="mt-2.5 bg-cream-2 rounded-2xl px-3.5 py-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[11px] font-sans-semibold text-ink-3">
                Where your offer lands
              </Text>
              <Text className="text-[11px] font-sans-bold text-ink">
                vs. 8 recent offers in Lekki P1
              </Text>
            </View>
            <Histogram pctOff={pctOff} />
            <View className="flex-row justify-between mt-1">
              <Text className="text-[10px] font-sans-semibold text-ink-3">-15%</Text>
              <Text className="text-[10px] font-sans-semibold text-ink-3">Asking</Text>
              <Text className="text-[10px] font-sans-semibold text-ink-3">+10%</Text>
            </View>
          </View>

          {/* Financing */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2">
            How you'll pay the seller
          </Text>
          <View className="gap-2">
            <FinancingOption
              icon="card-outline"
              label="Cash buyer"
              detail="Full amount paid directly to seller on completion"
              selected={financing === "cash"}
              onPress={() => setFinancing("cash")}
            />
            <FinancingOption
              icon="business-outline"
              label="Own financing"
              detail="You've arranged a loan separately"
              selected={financing === "own"}
              onPress={() => setFinancing("own")}
            />
          </View>

          {/* Terms */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2">
            Terms
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden border-line"
            style={{ borderWidth: 1 }}
          >
            <TermsRow label="Close date" value="On or before 30 Aug 2026" />
            <TermsRow label="Subject to inspection" value="Yes" isLast />
          </View>

          {/* Note */}
          <View className="flex-row items-baseline gap-1 mt-5 mb-2">
            <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase">
              Note to seller
            </Text>
            <Text className="text-[13px] font-sans-medium text-ink-3 tracking-wider">
              · optional
            </Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder='"Looking to relocate from Ikoyi by August — happy to be flexible on close date if it helps."'
            placeholderTextColor={INK_3}
            className="bg-cream-2 rounded-2xl px-3.5 py-3 text-ink-2 text-[14px]"
            style={{
              minHeight: 70,
              fontFamily: "PlayfairDisplay_400Regular_Italic",
            }}
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 border-line"
          style={{
            backgroundColor: "rgba(255,255,255,0.96)",
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 30,
          }}
        >
          <Pressable
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 17 }}
            onPress={() => router.back()}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              Send offer to agent
            </Text>
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-1.5">
            Non-binding · you and the seller settle directly
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Histogram (10 bars, position 3 is your offer) ───────────────
function Histogram({ pctOff }: { pctOff: number }) {
  // 10 bars roughly bell-shaped around "Asking" (center)
  const heights = [6, 9, 14, 22, 28, 24, 18, 12, 8, 5];
  // Map pctOff (-15..+10) to bar index 0..9 — your offer slot.
  // -15% → 0, asking (0%) → midway (~4-5), +10% → 9.
  const clamped = Math.max(-15, Math.min(10, pctOff));
  const yourIdx = Math.round(((-clamped + 15) / 25) * 9);
  return (
    <View
      className="flex-row items-end mt-2"
      style={{ height: 40, gap: 4 }}
    >
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: h * 1.3,
            backgroundColor: i === yourIdx ? PRIMARY : LINE,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

function FinancingOption({
  icon,
  label,
  detail,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl px-3.5 py-3.5 ${
        selected ? "bg-primary-soft" : "bg-white"
      }`}
      style={{
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? PRIMARY : LINE,
      }}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center ${
          selected ? "bg-white" : "bg-cream-2"
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={selected ? PRIMARY : INK_2}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[13.5px] font-sans-bold text-ink">{label}</Text>
        <Text className="text-xs text-ink-3 mt-0.5">{detail}</Text>
      </View>
      <View
        className="w-5 h-5 rounded-full items-center justify-center"
        style={{
          backgroundColor: selected ? PRIMARY : "transparent",
          borderWidth: selected ? 0 : 1.5,
          borderColor: LINE,
        }}
      >
        {selected && (
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 7,
              backgroundColor: "white",
            }}
          />
        )}
      </View>
    </Pressable>
  );
}

function TermsRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between px-3.5 py-3.5"
      style={{
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: "#ece6df",
      }}
    >
      <Text className="text-[13px] text-ink-2">{label}</Text>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-[13px] font-sans-bold text-ink">{value}</Text>
        <Ionicons name="chevron-forward" size={12} color={INK_3} />
      </View>
    </View>
  );
}
