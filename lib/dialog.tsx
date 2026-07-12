// Branded, app-wide replacement for React Native's `Alert`.
//
// Call sites keep using `Alert.alert(title, message, buttons)` exactly as
// before — they just import `Alert` from here instead of "react-native". The
// imperative call is bridged to a single <DialogHost/> mounted at the app root,
// which renders an on-brand modal (rounded card, tinted status icon, branded
// buttons) instead of the bare OS dialog.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert as RNAlert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type DialogRequest = {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
};

// ── Imperative bridge ───────────────────────────────────────────────────────
// The host registers its enqueue fn here on mount; `Alert.alert` calls it.
let hostHandler: ((req: DialogRequest) => void) | null = null;

/** Drop-in for react-native's `Alert` — identical signature. */
export const Alert = {
  alert(
    title?: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: unknown,
  ) {
    // iOS: the OS alert presents on the top-most view controller, so it shows
    // correctly even above a `presentation: 'modal'` screen (create-listing,
    // make-offer, book-service, …). Our branded <DialogHost/> is a React Native
    // <Modal> mounted at the app root, which on iOS renders *behind* a native
    // modal screen — so its dialogs (success AND error) would be invisible
    // there, leaving the user with no confirmation and the screen stuck. Use
    // the native alert on iOS; keep the branded host on Android where the
    // z-ordering works.
    if (Platform.OS === "ios") {
      RNAlert.alert(title ?? "", message, buttons as never);
      return;
    }
    if (hostHandler) hostHandler({ title, message, buttons });
    // Host not mounted yet (very early in startup) — fall back to the OS dialog
    // so a message is never silently lost.
    else RNAlert.alert(title ?? "", message, buttons as never);
  },
};

// ── Tone (purely cosmetic icon + colour, inferred from the copy) ─────────────
type Tone = "success" | "error" | "info";
function toneFor(req: DialogRequest): Tone {
  if (req.buttons?.some((b) => b.style === "destructive")) return "error";
  const t = `${req.title ?? ""} ${req.message ?? ""}`.toLowerCase();
  if (
    /(fail|error|wrong|invalid|couldn'?t|can'?t|denied|unable|not allowed|expired|missing|required|too )/.test(
      t,
    )
  )
    return "error";
  if (
    /(saved|success|sent|done|updated|published|confirmed|added|booked|submitted|posted|complete|live)/.test(
      t,
    )
  )
    return "success";
  return "info";
}

const TONES: Record<Tone, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: "checkmark-circle", color: PRIMARY, bg: "#e3efe7" },
  error: { icon: "alert-circle", color: "#c0392b", bg: "#fbe9e7" },
  info: { icon: "information-circle", color: "#4d524f", bg: "#eef0ec" },
};

// ── Host (mount once at the app root) ────────────────────────────────────────
export function DialogHost() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0] ?? null;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hostHandler = (req) => setQueue((q) => [...q, req]);
    return () => {
      hostHandler = null;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start();
  }, [current, anim]);

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  const press = useCallback(
    (b: AlertButton) => {
      // Close this dialog first, then run the action once the modal has fully
      // dismissed. On iOS a second modal — an image/document picker, share
      // sheet, etc. — cannot present while this dialog is still on screen, so a
      // picker launched straight from a button's onPress would silently never
      // appear. Deferring past the dismiss animation is what lets it open.
      dismiss();
      if (b.onPress) {
        const run = b.onPress;
        setTimeout(run, 300);
      }
    },
    [dismiss],
  );

  if (!current) return null;

  const buttons: AlertButton[] = current.buttons?.length
    ? current.buttons
    : [{ text: "OK", style: "default" }];
  const tone = TONES[toneFor(current)];
  const stacked = buttons.length > 2;

  // Backdrop / Android-back: trigger cancel if present, else dismiss only when
  // it's a single-action info dialog (never auto-resolve a multi-choice prompt).
  const onBackdrop = () => {
    const cancel = buttons.find((b) => b.style === "cancel");
    if (cancel) press(cancel);
    else if (buttons.length === 1) press(buttons[0]);
  };

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onBackdrop}>
      <View style={styles.center}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15,20,17,0.55)" }]}
          onPress={onBackdrop}
        />
        <Animated.View
          style={{ width: "100%", maxWidth: 400, paddingHorizontal: 20, opacity: anim, transform: [{ scale }] }}
        >
          <View className="bg-white rounded-[30px] overflow-hidden" style={styles.card}>
            <View style={{ height: 5, backgroundColor: tone.color }} />
            <View className="px-6 pt-6 pb-5">
            <View className="flex-row items-start gap-3">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: tone.bg }}
              >
                <Ionicons name={tone.icon} size={24} color={tone.color} />
              </View>
              <View className="flex-1 pt-0.5">
                <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: tone.color }}>
                  {tone === TONES.error ? "Please confirm" : tone === TONES.success ? "All set" : "PropertyLoop"}
                </Text>
                {!!current.title && (
                  <Text className="font-serif text-ink mt-1" style={{ fontSize: 22, lineHeight: 26, letterSpacing: -0.35 }}>
                    {current.title}
                  </Text>
                )}
              </View>
            </View>

            {!!current.message && (
              <Text className="text-ink-2 text-[14px] leading-[20px] mt-3">
                {current.message}
              </Text>
            )}

            <View className={`mt-5 gap-2.5 ${stacked ? "" : "flex-row"}`}>
              {buttons.map((b, i) => (
                <DialogButton
                  key={`${b.text ?? "btn"}-${i}`}
                  btn={b}
                  stacked={stacked}
                  onPress={() => press(b)}
                />
              ))}
            </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DialogButton({
  btn,
  onPress,
  stacked,
}: {
  btn: AlertButton;
  onPress: () => void;
  stacked: boolean;
}) {
  const kind = btn.style ?? "default";
  const bg = kind === "destructive" ? "#c83b3b" : kind === "cancel" ? "#f1f0ec" : PRIMARY;
  const color = kind === "cancel" ? INK : "#ffffff";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`rounded-full items-center justify-center py-3.5 active:opacity-80 ${stacked ? "" : "flex-1"}`}
      style={{ backgroundColor: bg }}
    >
      <Text className="font-sans-bold text-[14.5px]" style={{ color }}>
        {btn.text ?? "OK"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
