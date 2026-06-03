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
import { KYC_STEPS } from "@/mocks/buyer-extra";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function VerifyIdentityScreen() {
  const [nin, setNin] = useState("");
  const [selfie, setSelfie] = useState(false);
  const [proof, setProof] = useState(false);

  const ninValid = /^[0-9]{11}$/.test(nin);
  const canSubmit = ninValid && selfie && proof;

  const onSubmit = () => {
    if (!canSubmit) {
      Alert.alert("Almost there", "Complete all three steps to submit.");
      return;
    }
    Alert.alert(
      "Submitted",
      "Verification typically takes under 10 minutes. We'll notify you once it's done.",
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
            Verify identity
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View
            className="rounded-2xl p-5 mt-2"
            style={{ backgroundColor: "#e3efe7" }}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: PRIMARY }}
            >
              <Ionicons name="shield-checkmark" size={22} color="#ffffff" />
            </View>
            <Text
              className="font-serif mt-3"
              style={{
                fontSize: 24,
                letterSpacing: -0.5,
                lineHeight: 27,
                color: PRIMARY_INK,
              }}
            >
              Get the{" "}
              <Text className="font-serif-italic">verified badge</Text>
            </Text>
            <Text
              className="text-[12.5px] mt-1.5 leading-5"
              style={{ color: PRIMARY_INK, opacity: 0.78 }}
            >
              Agents and landlords respond up to 3× faster to verified buyers.
              We only store the data needed to confirm your identity.
            </Text>
          </View>

          {/* Step 1 — NIN */}
          <StepCard step="01" title={KYC_STEPS[0].title} detail={KYC_STEPS[0].detail} done={ninValid}>
            <TextInput
              value={nin}
              onChangeText={(t) => setNin(t.replace(/[^0-9]/g, "").slice(0, 11))}
              keyboardType="number-pad"
              placeholder="11 digits"
              placeholderTextColor={INK_3}
              className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px] font-sans-bold mt-3"
              style={{ letterSpacing: 2 }}
            />
            <Text className="text-[11px] text-ink-3 mt-1.5">
              Dial *346# on the SIM linked to your NIN to retrieve it.
            </Text>
          </StepCard>

          {/* Step 2 — Selfie */}
          <StepCard step="02" title={KYC_STEPS[1].title} detail={KYC_STEPS[1].detail} done={selfie}>
            <Pressable
              onPress={() => setSelfie((s) => !s)}
              className="mt-3 bg-white border border-line rounded-2xl py-5 items-center active:opacity-90"
              style={{
                borderStyle: selfie ? "solid" : "dashed",
                borderWidth: 1.5,
                borderColor: selfie ? PRIMARY : "#d3cdc1",
              }}
            >
              <Ionicons
                name={selfie ? "checkmark-circle" : "camera-outline"}
                size={28}
                color={selfie ? PRIMARY : INK_2}
              />
              <Text className="text-[13px] font-sans-bold text-ink mt-2">
                {selfie ? "Selfie captured" : "Take a selfie"}
              </Text>
              <Text className="text-[11px] text-ink-3 mt-0.5">
                {selfie ? "Tap to retake" : "Camera permission required"}
              </Text>
            </Pressable>
          </StepCard>

          {/* Step 3 — Proof of address */}
          <StepCard step="03" title={KYC_STEPS[2].title} detail={KYC_STEPS[2].detail} done={proof}>
            <Pressable
              onPress={() => setProof((p) => !p)}
              className="mt-3 bg-white border border-line rounded-2xl px-4 py-3.5 flex-row items-center gap-3 active:opacity-90"
              style={{
                borderStyle: proof ? "solid" : "dashed",
                borderWidth: 1.5,
                borderColor: proof ? PRIMARY : "#d3cdc1",
              }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: proof ? "#e3efe7" : "#f0f0f0" }}
              >
                <Ionicons
                  name={proof ? "document-attach" : "cloud-upload-outline"}
                  size={18}
                  color={proof ? PRIMARY : INK_2}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-sans-bold text-ink">
                  {proof ? "ikeja-electric-apr-2026.pdf" : "Upload utility bill"}
                </Text>
                <Text className="text-[11.5px] text-ink-3 mt-0.5">
                  {proof ? "1.2 MB · ready" : "PDF or photo · < 5 MB"}
                </Text>
              </View>
              {proof && <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />}
            </Pressable>
          </StepCard>

          {/* Privacy note */}
          <View
            className="mt-5 rounded-2xl px-3.5 py-3 flex-row gap-2.5 items-start"
            style={{ backgroundColor: "#f5ead4" }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={15}
              color={ACCENT_INK}
              style={{ marginTop: 1 }}
            />
            <Text
              className="flex-1 text-[11.5px] leading-4"
              style={{ color: ACCENT_INK }}
            >
              Documents are encrypted at rest and only seen by our verification
              team. Never shared with agents, landlords or vendors.
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
            onPress={onSubmit}
            disabled={!canSubmit}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-50"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              Submit for verification
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepCard({
  step,
  title,
  detail,
  done,
  children,
}: {
  step: string;
  title: string;
  detail: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-5">
      <View className="flex-row items-baseline gap-2.5">
        <Text className="font-serif text-primary" style={{ fontSize: 14 }}>
          {step}
        </Text>
        <Text className="text-[14.5px] font-sans-bold text-ink">{title}</Text>
        {done && (
          <View className="ml-auto flex-row items-center gap-1">
            <Ionicons name="checkmark-circle" size={14} color={PRIMARY} />
            <Text className="text-[11px] font-sans-bold text-primary">
              Done
            </Text>
          </View>
        )}
      </View>
      <Text className="text-[12px] text-ink-3 mt-1">{detail}</Text>
      {children}
    </View>
  );
}

// Quiet unused warning if a constant becomes unused later.
void INK;
