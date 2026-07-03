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
import { SafeAreaView } from "react-native-safe-area-context";
import authService from "@/api/services/auth";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

// Mirrors backend: 8+ chars, at least 1 lowercase, 1 uppercase, 1 digit.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "request" | "reset";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async () => {
    setError(null);
    if (!EMAIL_RULE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      // Always succeeds server-side (no account-existence leak); move on so the
      // user can enter the code that lands in their inbox.
      await authService.forgotPassword(email);
      setStep("reset");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Couldn't send the code. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const doReset = async () => {
    setError(null);
    if (code.trim().length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      setError("Password must be 8+ characters with an uppercase letter, lowercase letter, and number.");
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword({ email, code, password });
      Alert.alert(
        "Password reset",
        "Your password has been changed. Sign in with your new password.",
        [{ text: "OK", onPress: () => router.replace("/login" as Href) }],
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "That code is invalid or has expired. Request a new one.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await authService.forgotPassword(email);
      Alert.alert("Code sent", `We've emailed a new code to ${email.trim()}.`);
    } catch {
      Alert.alert("Couldn't resend", "Please try again in a moment.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pt-1">
          <Pressable
            onPress={() => (step === "reset" ? setStep("request") : router.back())}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-ink-3">Cancel</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Lock badge */}
          <View className="w-14 h-14 rounded-[16px] bg-primary-soft items-center justify-center">
            <Ionicons name="lock-closed-outline" size={26} color={PRIMARY_INK} />
          </View>

          <Text
            className="font-serif text-ink mt-5"
            style={{ fontSize: 30, lineHeight: 32, letterSpacing: -0.6 }}
          >
            Reset your <Text className="font-serif-italic">password</Text>
          </Text>

          {step === "request" ? (
            <>
              <Text className="text-[14px] text-ink-2 mt-2 leading-5">
                Enter your account email and we'll send you a 6-digit reset code.
              </Text>

              <Label className="mt-6">Email</Label>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={INK_3}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[15px]"
              />
            </>
          ) : (
            <>
              <Text className="text-[14px] text-ink-2 mt-2 leading-5">
                We emailed a 6-digit code to{" "}
                <Text className="font-sans-bold text-ink">{email.trim()}</Text>. Enter
                it below with your new password. The code expires in 15 minutes.
              </Text>

              <Label className="mt-6">Reset code</Label>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="123456"
                placeholderTextColor={INK_3}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-[18px] tracking-[6px]"
              />

              <Label className="mt-4">New password</Label>
              <View className="bg-white border border-line rounded-2xl px-4 flex-row items-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="8+ chars · upper, lower, number"
                  placeholderTextColor={INK_3}
                  secureTextEntry={hidden}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  className="flex-1 py-3.5 text-ink text-[15px]"
                />
                <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8} className="pl-2">
                  <Ionicons
                    name={hidden ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={INK_3}
                  />
                </Pressable>
              </View>

              <Pressable onPress={resend} hitSlop={6} className="mt-3 self-start">
                <Text className="text-[13px] font-sans-bold text-primary">
                  Resend code
                </Text>
              </Pressable>
            </>
          )}

          {error && (
            <Text className="text-red-600 text-xs mt-3 leading-4">{error}</Text>
          )}

          <Text className="text-xs text-ink-3 mt-5 leading-5">
            For your security, we'll sign you out from all devices once your
            password is reset.
          </Text>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="px-5 pb-8 pt-2">
          <Pressable
            onPress={step === "request" ? requestCode : doReset}
            disabled={submitting}
            className="bg-primary rounded-full items-center active:opacity-80 disabled:opacity-60"
            style={{ paddingVertical: 17 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {submitting
                ? step === "request"
                  ? "Sending…"
                  : "Resetting…"
                : step === "request"
                  ? "Send reset code"
                  : "Reset password"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text
      className={`text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5 ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}
