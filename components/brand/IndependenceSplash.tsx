import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Persisted via expo-secure-store (already a dependency — we avoid pulling in
// AsyncStorage just for one key), mirroring lib/guestLead.
import * as SecureStore from "expo-secure-store";

/**
 * Independence Day greeting, shown once per install on 1 October.
 *
 * Not the launch screen: this comes up after the app has booted, is
 * dismissible, and is gone for the rest of the day once closed. The date is
 * read in Lagos time — the greeting belongs to the Nigerian day, not to
 * whatever time zone the phone is set to.
 */

/** 1 October. Year-agnostic so the poster can be swapped and the gate reused. */
const DAY = { month: 10, date: 1 };

/** Bumped per year, so next year's greeting shows again on the same install. */
const SEEN_KEY = "pl_independence_2026";

const BACKDROP = "rgba(5, 28, 17, 0.9)";
const INK = "#0f1411";

/** Today in Lagos, as { month, date }. */
function lagosToday(): { month: number; date: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { month: get("month"), date: get("day") };
}

export function isIndependenceDay(): boolean {
  const today = lagosToday();
  return today.month === DAY.month && today.date === DAY.date;
}

export function IndependenceSplash() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (!isIndependenceDay()) return;
    let cancelled = false;
    // A failed read is not a reason to withhold a greeting; only a successful
    // "seen" read suppresses it.
    SecureStore.getItemAsync(SEEN_KEY)
      .then((seen) => {
        if (!cancelled && seen !== "1") setOpen(true);
      })
      .catch(() => {
        if (!cancelled) setOpen(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    SecureStore.setItemAsync(SEEN_KEY, "1").catch(() => {
      /* nothing to remember it with — it simply shows again */
    });
  };

  if (!open) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Pressable
        onPress={dismiss}
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: BACKDROP,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        {/* Swallows taps on the card itself, so only the backdrop dismisses. */}
        <Pressable onPress={() => {}} className="w-full items-center">
          <View className="w-full" style={{ maxWidth: 340 }}>
            <Image
              source={require("@/assets/images/independence-2026.jpg")}
              style={{
                width: "100%",
                // The poster is 3:4 portrait; cap it so the caption and button
                // still fit on a short screen.
                aspectRatio: 896 / 1200,
                maxHeight: height * 0.62,
                borderRadius: 18,
              }}
              contentFit="contain"
              accessibilityLabel="Happy Independence Day Nigeria — Nigeria at 66, 1st October. From PropertyLoop."
            />

            <Pressable
              onPress={dismiss}
              accessibilityLabel="Close"
              hitSlop={10}
              className="absolute -top-2 -right-2 w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
            >
              <Ionicons name="close" size={18} color={INK} />
            </Pressable>
          </View>

          <Text
            className="text-[13px] text-center mt-4"
            style={{ color: "rgba(255,255,255,0.85)", lineHeight: 19, maxWidth: 300 }}
          >
            {"From all of us at PropertyLoop — happy Independence Day. Here's to a home for every Nigerian."}
          </Text>

          <Pressable
            onPress={dismiss}
            className="rounded-full mt-4 px-7 py-3"
            style={{ backgroundColor: "#ffffff" }}
          >
            <Text className="font-sans-bold text-[13.5px]" style={{ color: INK }}>
              Continue
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default IndependenceSplash;
