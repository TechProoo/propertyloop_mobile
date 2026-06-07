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
import { useAuth, roleHome } from "@/context/auth";

const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || password.length < 1) {
      setError("Enter your email and password to sign in.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const user = await signIn({
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace(roleHome(user.role) as Href);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        "Couldn't sign you in. Check your details and try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
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
          <Pressable onPress={() => router.push("/help" as Href)} hitSlop={8}>
            <Text className="text-[13px] font-sans-bold text-ink-3">Help</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 36,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center gap-3.5">
            <PLAvatar initials="PL" size={60} tone="primary" />
            <View className="flex-1">
              <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
                Welcome back
              </Text>
              <Text
                className="font-serif text-ink mt-0.5"
                style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 30 }}
              >
                Sign <Text className="font-serif-italic">in</Text>
              </Text>
            </View>
          </View>

          {/* Email */}
          <Text className="text-xs font-sans-bold text-ink-2 mt-7">Email</Text>
          <View
            className="mt-2 bg-white rounded-2xl px-3.5 flex-row items-center"
            style={{ borderWidth: 1, borderColor: "#e1dcd3", height: 52 }}
          >
            <Ionicons name="mail-outline" size={18} color={INK_3} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={INK_3}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              className="flex-1 text-ink ml-2.5"
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }}
            />
          </View>

          {/* Password */}
          <View
            className="flex-row items-center justify-between"
            style={{ marginTop: 18 }}
          >
            <Text className="text-xs font-sans-bold text-ink-2">Password</Text>
            <Pressable
              onPress={() => router.push("/forgot-password" as Href)}
              hitSlop={6}
            >
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
              onSubmitEditing={handleSignIn}
              returnKeyType="go"
              className="flex-1 text-ink"
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
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

          {error && (
            <Text className="text-red-600 text-xs mt-3">{error}</Text>
          )}

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
