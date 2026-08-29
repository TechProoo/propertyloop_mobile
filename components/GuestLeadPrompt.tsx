import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth";
import { capturePartialSignup } from "@/api/services/partialSignups";
import { hasPromptedGuest, markGuestPrompted, saveGuestLead } from "@/lib/guestLead";
import { tapLight, tapMedium } from "@/lib/haptics";

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DELAY_MS = 15_000;
const PRIMARY = "#1f6f43";

/**
 * Asks a guest for a name and email a short way into their browse, so someone
 * who never registers is still reachable. Fifteen seconds is the point of the
 * delay: long enough that they've seen real listings and the ask makes sense,
 * early enough that it lands before they lose interest and leave.
 *
 * Shows once per two-day window, dismissal included — see lib/guestLead. What
 * they give is stored on the device to prefill signup, and sent to the server
 * as a partial signup so it survives them deleting the app.
 *
 * Mounted in the tab layout, which signed-in buyers share, hence the isAuthed
 * guard: this is only ever for someone browsing without an account.
 */
export function GuestLeadPrompt() {
  const { status, isAuthed } = useAuth();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status !== "guest" || isAuthed) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (await hasPromptedGuest()) return;
      if (cancelled) return;
      // Mark before showing, not on dismissal — otherwise force-quitting while
      // the modal is up means they get asked all over again next launch.
      await markGuestPrompted();
      if (!cancelled) setVisible(true);
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, isAuthed]);

  const close = () => {
    tapLight();
    setVisible(false);
  };

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RULE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    tapMedium();
    setSaving(true);
    await saveGuestLead(name, trimmed);
    capturePartialSignup({
      email: trimmed,
      name: name.trim() || undefined,
      step: "guest_modal",
    });
    setSaving(false);
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/50 px-6"
      >
        <View className="w-full bg-white rounded-3xl p-6">
          <View className="flex-row items-start justify-between">
            <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center">
              <Ionicons name="mail-outline" size={22} color={PRIMARY} />
            </View>
            <Pressable onPress={close} hitSlop={12} accessibilityLabel="Dismiss">
              <Ionicons name="close" size={22} color="#7f857f" />
            </Pressable>
          </View>

          <Text className="text-ink font-serif text-2xl mt-4">
            Want the good ones first?
          </Text>
          <Text className="text-ink-2 text-sm mt-2 leading-5">
            Leave your details and we&apos;ll send new homes matching what
            you&apos;re browsing. No account needed.
          </Text>

          <View className="mt-5 gap-3">
            <View>
              <Text className="text-ink-2 text-xs font-sans-semibold mb-1.5">
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#7f857f"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-base"
              />
            </View>
            <View>
              <Text className="text-ink-2 text-xs font-sans-semibold mb-1.5">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor="#7f857f"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                className="bg-white border border-line rounded-2xl px-4 py-3.5 text-ink text-base"
              />
            </View>
            {error && <Text className="text-red-600 text-xs">{error}</Text>}
          </View>

          <Pressable
            onPress={submit}
            disabled={saving}
            className="mt-5 bg-primary rounded-full py-4 items-center"
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-sans-semibold text-base">
                Keep me posted
              </Text>
            )}
          </Pressable>
          <Pressable onPress={close} className="mt-2 py-3 items-center">
            <Text className="text-ink-2 font-sans-semibold text-sm">
              Not now
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
