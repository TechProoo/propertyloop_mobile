import { useState } from "react";
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
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingCta from "@/components/onboarding/OnboardingCta";
import listingsService from "@/api/services/listings";
import kycService from "@/api/services/kyc";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function AgentVerifyScreen() {
  const insets = useSafeAreaInsets();
  const [nin, setNin]         = useState("");
  const [licenseFile, setLicenseFile] = useState<{ name: string; uri: string; type?: string } | null>(null);
  const [selfieUri, setSelfieUri]     = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const ninValid = /^[0-9]{11}$/.test(nin);
  const canContinue = ninValid && licenseFile && selfieUri;

  const pickLicense = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!r.canceled && r.assets[0]) {
      const a = r.assets[0];
      setLicenseFile({ name: a.name, uri: a.uri, type: a.mimeType });
    }
  };

  const takeSelfie = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert("Camera", "Allow camera access in Settings to take a headshot.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) setSelfieUri(r.assets[0].uri);
  };

  const onContinue = async () => {
    if (!canContinue || submitting) {
      if (!canContinue) {
        Alert.alert("Almost there", "Complete all three documents to continue.");
      }
      return;
    }
    setSubmitting(true);
    try {
      const [licenseUrl, selfieUrl] = await Promise.all([
        listingsService.uploadPhoto(licenseFile!.uri, {
          name: licenseFile!.name,
          type: licenseFile!.type ?? "image/jpeg",
        }),
        listingsService.uploadPhoto(selfieUri!, { name: "selfie.jpg", type: "image/jpeg" }),
      ]);
      await kycService.submit({
        documentType: "NIN",
        documentNumber: nin,
        documentUrls: [licenseUrl],
        selfieUrl,
      });
      // PropertyLoop is free for all agents — no plan/payment step. Straight
      // to the dashboard once KYC is submitted.
      router.replace("/(agent-tabs)" as Href);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Couldn't submit. Please try again.";
      Alert.alert("Submission failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
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
            <Text className="text-ink font-sans-semibold text-sm">
              Verify your practice
            </Text>
            <View style={{ width: 36 }} />
          </View>
          <OnboardingProgress step={2} total={2} className="px-5 mt-3" />

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <Text
              className="font-serif text-ink mt-6"
              style={{ fontSize: 28, lineHeight: 30, letterSpacing: -0.6 }}
            >
              We verify <Text className="font-serif-italic">every agent</Text>
            </Text>
            <Text className="text-[13px] text-ink-2 mt-2 leading-5">
              Buyers trust the verified badge. NIESV checks usually clear in
              under 24 hours. Documents are encrypted and only seen by our
              verification team.
            </Text>

            {/* Step 1 — NIN */}
            <StepCard step="01" title="National ID (NIN)" hint="11-digit number" done={ninValid}>
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

            {/* Step 2 — License */}
            <StepCard step="02" title="NIESV licence" hint="Current practising certificate" done={!!licenseFile}>
              <Pressable
                onPress={pickLicense}
                className="mt-3 bg-white border border-line rounded-2xl px-4 py-3.5 flex-row items-center gap-3 active:opacity-90"
                style={{
                  borderStyle: licenseFile ? "solid" : "dashed",
                  borderWidth: 1.5,
                  borderColor: licenseFile ? PRIMARY : "#d3cdc1",
                }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: licenseFile ? "#e3efe7" : "#f0f0f0" }}
                >
                  <Ionicons
                    name={licenseFile ? "document-attach" : "cloud-upload-outline"}
                    size={18}
                    color={licenseFile ? PRIMARY : INK_2}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-sans-bold text-ink">
                    {licenseFile ? licenseFile.name : "Upload licence"}
                  </Text>
                  <Text className="text-[11.5px] text-ink-3 mt-0.5">
                    {licenseFile ? "Ready to submit" : "PDF or photo · < 5 MB"}
                  </Text>
                </View>
                {licenseFile && <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />}
              </Pressable>
            </StepCard>

            {/* Step 3 — Selfie */}
            <StepCard step="03" title="Headshot" hint="Front-facing, neutral background" done={!!selfieUri}>
              <Pressable
                onPress={takeSelfie}
                className="mt-3 bg-white border border-line rounded-2xl py-5 items-center active:opacity-90"
                style={{
                  borderStyle: selfieUri ? "solid" : "dashed",
                  borderWidth: 1.5,
                  borderColor: selfieUri ? PRIMARY : "#d3cdc1",
                }}
              >
                <Ionicons
                  name={selfieUri ? "checkmark-circle" : "camera-outline"}
                  size={28}
                  color={selfieUri ? PRIMARY : INK_2}
                />
                <Text className="text-[13px] font-sans-bold text-ink mt-2">
                  {selfieUri ? "Headshot captured" : "Take a headshot"}
                </Text>
                <Text className="text-[11px] text-ink-3 mt-0.5">
                  {selfieUri ? "Tap to retake" : "Camera permission required"}
                </Text>
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
                team. Never shared with buyers, renters or other agents.
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
              paddingBottom: Math.max(insets.bottom, 20) + 10,
            }}
          >
            <OnboardingCta
              label={submitting ? "Submitting…" : "Submit & continue"}
              ready={!!canContinue && !submitting}
              onPress={onContinue}
              getMissing={() =>
                [
                  !ninValid && "your 11-digit NIN",
                  !licenseFile && "your licence document",
                  !selfieUri && "a headshot selfie",
                ].filter(Boolean) as string[]
              }
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function StepCard({
  step,
  title,
  hint,
  done,
  children,
}: {
  step: string;
  title: string;
  hint: string;
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
            <Text className="text-[11px] font-sans-bold text-primary">Done</Text>
          </View>
        )}
      </View>
      <Text className="text-[12px] text-ink-3 mt-1">{hint}</Text>
      {children}
    </View>
  );
}

// Silence unused-warning if a constant becomes unused.
void PRIMARY_INK;
