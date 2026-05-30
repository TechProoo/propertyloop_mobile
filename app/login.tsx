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
import { PLAvatar } from "@/components/brand/PLAvatar";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

// Mock returning-user — in real wiring this comes from the last
// stored session in expo-secure-store. Falling back to "fresh"
// signup if no session exists is a future concern.
const KNOWN_USER = {
  initials: "AO",
  firstName: "Adebayo",
  lastName: "Okafor",
  phoneMasked: "+234 80 •••• 5678",
};

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (password.length < 1) {
      Alert.alert("Password required", "Enter your password to sign in.");
      return;
    }
    setSubmitting(true);
    // Demo mode — fake delay then drop on the "Welcome back" landing.
    // Backend wiring goes here:  await authService.login({ phone, password });
    await new Promise((r) => setTimeout(r, 500));
    router.replace("/welcome-back" as Href);
  };

  const stub = (label: string) =>
    Alert.alert("Coming soon", `${label} isn't wired up yet.`);

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
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Pressable onPress={() => stub("Help")} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-ink-3">Help</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Returning-user header */}
          <View className="flex-row items-center gap-3.5">
            <View className="relative">
              <PLAvatar initials={KNOWN_USER.initials} size={64} tone="primary" />
              <View
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary items-center justify-center"
                style={{ borderWidth: 3, borderColor: "#f5f0eb" }}
              >
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
                Welcome back
              </Text>
              <Text
                className="font-serif text-ink mt-0.5"
                style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}
              >
                <Text className="font-serif-italic">{KNOWN_USER.firstName}</Text>{" "}
                {KNOWN_USER.lastName}
              </Text>
            </View>
          </View>

          <Text className="text-[13.5px] text-ink-2 mt-5 leading-5">
            Not you?{" "}
            <Text
              className="text-primary font-sans-bold"
              onPress={() => router.replace("/role-select" as Href)}
            >
              Switch account
            </Text>
          </Text>

          {/* Phone (locked / pre-filled) */}
          <Text className="text-xs font-sans-bold text-ink-2 mt-6">
            Phone number
          </Text>
          <View
            className="mt-2 bg-cream-2 border-line rounded-2xl px-3.5 flex-row items-center gap-2.5"
            style={{ borderWidth: 1, height: 52 }}
          >
            <Text className="text-lg">🇳🇬</Text>
            <Text className="text-[15px] font-sans-bold text-ink">
              {KNOWN_USER.phoneMasked}
            </Text>
            <Pressable className="ml-auto" onPress={() => stub("Change phone")}>
              <Text className="text-[13px] font-sans-bold text-primary">
                Change
              </Text>
            </Pressable>
          </View>

          {/* Password */}
          <View className="flex-row items-center justify-between mt-4.5" style={{ marginTop: 18 }}>
            <Text className="text-xs font-sans-bold text-ink-2">Password</Text>
            <Pressable onPress={() => router.push("/forgot-password" as Href)} hitSlop={6}>
              <Text className="text-xs font-sans-bold text-primary">Forgot?</Text>
            </Pressable>
          </View>
          <View
            className="mt-2 bg-white rounded-2xl px-3.5 flex-row items-center gap-2.5"
            style={{ borderWidth: 1.5, borderColor: INK, height: 54 }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={INK_3}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              className="flex-1 text-ink"
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                letterSpacing: showPassword ? 0 : 4,
                paddingVertical: 0,
              }}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              className="w-7 h-7 items-center justify-center"
              hitSlop={6}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={INK_3}
              />
            </Pressable>
          </View>

          {/* Sign in CTA */}
          <Pressable
            onPress={handleSignIn}
            disabled={submitting}
            className="bg-primary rounded-full items-center mt-5 active:opacity-80 disabled:opacity-60"
            style={{ paddingVertical: 17 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {submitting ? "Signing in…" : "Sign in"}
            </Text>
          </Pressable>

          {/* Face ID stub */}
          <Pressable
            onPress={() => stub("Face ID")}
            className="rounded-full items-center justify-center flex-row gap-2.5 mt-2.5 active:opacity-80"
            style={{ paddingVertical: 14, borderWidth: 1, borderColor: "#e1dcd3" }}
          >
            <Ionicons name="scan-outline" size={20} color={INK} />
            <Text className="text-ink font-sans-bold text-[14px]">
              Use Face ID
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center gap-3 mt-6 mb-4">
            <View className="flex-1 bg-line" style={{ height: 0.5 }} />
            <Text className="text-[11px] font-sans-semibold text-ink-3 tracking-widest uppercase">
              or use a one-time code
            </Text>
            <View className="flex-1 bg-line" style={{ height: 0.5 }} />
          </View>

          {/* SMS code card */}
          <Pressable
            onPress={() => stub("SMS one-time code")}
            className="bg-cream-2 rounded-2xl px-4 py-3.5 flex-row items-center gap-3 active:opacity-90"
          >
            <View className="w-8 h-8 rounded-[10px] bg-white items-center justify-center">
              <Ionicons name="chatbox-outline" size={16} color={PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold text-ink">
                Send SMS code to {KNOWN_USER.phoneMasked}
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-0.5">
                No password needed
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={INK_3} />
          </Pressable>
        </ScrollView>

        {/* Footer */}
        <View className="px-6 pb-8 flex-row items-center justify-center">
          <Text className="text-[13px] text-ink-3">New here? </Text>
          <Pressable onPress={() => router.replace("/role-select" as Href)}>
            <Text className="text-[13px] font-sans-bold text-primary">
              Create an account
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
