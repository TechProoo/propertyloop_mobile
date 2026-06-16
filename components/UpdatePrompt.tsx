import { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Pressable,
  Text,
  View,
  type AppStateStatus,
} from "react-native";
import * as Updates from "expo-updates";
import { useUpdates } from "expo-updates";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY = "#1f6f43";

/**
 * A gentle "Update available" banner that slides in from the top once an OTA
 * update (published via `eas update`) has downloaded and is ready to launch.
 * Tapping Refresh applies it instantly via Updates.reloadAsync(); the X just
 * dismisses until the next one. Re-checks whenever the app returns to the
 * foreground so long-lived sessions still pick updates up.
 *
 * Only active in real builds — expo-updates is disabled in Expo Go / dev, so
 * this renders nothing there.
 */
export function UpdatePrompt() {
  const { isUpdatePending } = useUpdates();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  const [reloading, setReloading] = useState(false);
  const slide = useRef(new Animated.Value(-140)).current;

  const active = Updates.isEnabled && !__DEV__;

  // Re-check on foreground (the launch check only runs at cold start).
  useEffect(() => {
    if (!active) return;
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state !== "active") return;
      Updates.checkForUpdateAsync()
        .then((r) => (r.isAvailable ? Updates.fetchUpdateAsync() : null))
        .catch(() => {
          /* offline or no update — ignore */
        });
    });
    return () => sub.remove();
  }, [active]);

  // A freshly downloaded update should re-surface the banner even if a previous
  // one was dismissed.
  useEffect(() => {
    if (isUpdatePending) setDismissed(false);
  }, [isUpdatePending]);

  const visible = active && isUpdatePending && !dismissed;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : -140,
      useNativeDriver: true,
      bounciness: 6,
      speed: 12,
    }).start();
  }, [visible, slide]);

  const apply = async () => {
    setReloading(true);
    try {
      await Updates.reloadAsync();
    } catch {
      // Reload failed — keep the banner up so they can retry.
      setReloading(false);
    }
  };

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 12,
        right: 12,
        transform: [{ translateY: slide }],
      }}
    >
      <View
        className="flex-row items-center bg-white rounded-2xl px-3.5 py-3"
        style={{
          borderWidth: 1,
          borderColor: "#e1dcd3",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 34, height: 34, backgroundColor: "#e3f3ea" }}
        >
          <Ionicons name="sparkles" size={17} color={PRIMARY} />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-ink font-sans-bold text-[13px]">
            Update available
          </Text>
          <Text className="text-ink-3 text-[11px] mt-0.5">
            Get the latest version of PropertyLoop.
          </Text>
        </View>
        <Pressable
          onPress={apply}
          disabled={reloading}
          className="bg-primary rounded-full px-3.5 py-2 active:opacity-80 disabled:opacity-60"
        >
          <Text className="text-white font-sans-bold text-[12px]">
            {reloading ? "Updating…" : "Refresh"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={8}
          className="ml-1.5"
        >
          <Ionicons name="close" size={16} color="#7f857f" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
