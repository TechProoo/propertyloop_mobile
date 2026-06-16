import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import authService from "@/api/services/auth";

const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const PRIMARY = "#2f9e61";

// Server throttles public resends to 3/60s; keep the button quiet in between.
const RESEND_COOLDOWN = 30;

/**
 * Shown after signup (and when an unverified user tries to log in). The
 * verification link is delivered by email and opens on the web; this screen's
 * job is to explain that, let the user resend it, and send them to log in once
 * they've confirmed. See backend POST /auth/resend-verification-public.
 */
export default function VerifyEmailSentScreen() {
  const params = useLocalSearchParams<{ email?: string; from?: string }>();
  const email = params.email ?? "your email";
  const fromLogin = params.from === "login";

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (sending || cooldown > 0 || !params.email) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      await authService.resendVerification(params.email);
      setNotice("Sent — check your inbox (and your spam folder).");
      startCooldown();
    } catch (e: any) {
      if (e?.response?.status === 429) {
        setError("Too many requests — please wait a minute and try again.");
        startCooldown();
      } else {
        setError("Couldn't resend right now. Please try again shortly.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="px-5 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
      </View>

      <View className="flex-1 px-7 justify-center">
        {/* Icon */}
        <View className="items-center">
          <View
            className="rounded-full items-center justify-center"
            style={{ width: 84, height: 84, backgroundColor: "#e3f3ea" }}
          >
            <Ionicons name="mail-unread-outline" size={38} color={PRIMARY} />
          </View>
        </View>

        {/* Heading */}
        <Text className="text-ink font-serif text-3xl text-center mt-7 leading-9">
          Check your <Text className="font-serif-italic">inbox</Text>
        </Text>

        <Text className="text-ink-2 text-[15px] text-center mt-3 leading-6">
          {fromLogin
            ? "Your email isn't verified yet. We've sent a verification link to"
            : "We've sent a verification link to"}{" "}
          <Text className="font-sans-bold text-ink">{email}</Text>. Open it to
          confirm your account, then come back and log in.
        </Text>

        {notice && (
          <Text className="text-primary text-[13px] text-center mt-4">
            {notice}
          </Text>
        )}
        {error && (
          <Text className="text-red-600 text-[13px] text-center mt-4">
            {error}
          </Text>
        )}

        {/* Primary: head to login once verified */}
        <Pressable
          onPress={() => router.replace("/login" as Href)}
          className="bg-primary rounded-full items-center mt-8 active:opacity-80"
          style={{ paddingVertical: 17 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Go to login
          </Text>
        </Pressable>

        {/* Resend */}
        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-ink-3 text-[13px]">Didn&apos;t get it? </Text>
          {sending ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <Pressable onPress={handleResend} disabled={cooldown > 0} hitSlop={8}>
              <Text
                className="text-[13px] font-sans-bold"
                style={{ color: cooldown > 0 ? INK_3 : PRIMARY }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
